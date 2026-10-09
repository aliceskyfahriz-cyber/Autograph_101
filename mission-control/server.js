#!/usr/bin/env node
'use strict';
/*
 * Mission Control — server.js
 * Node.js TANPA dependensi eksternal (hanya modul bawaan).
 * Data nyata dari file JSON/JSONL di data/, /proc, dan file cron markdown.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const WORKSPACE = path.resolve(ROOT, '..');
const HOST = process.env.HOST || '127.0.0.1'; // set HOST=0.0.0.0 agar bisa dibuka dari HP satu WiFi (LAN)
const PORT = 3001;
const TZ_DEFAULT = 'Asia/Jakarta';

/* ---------------- Roster agent (id HARUS stabil, dipakai di tasks.jsonl) ---------------- */
const ROSTER = [
  { id: 'muse',              name: 'Muse',            role: 'Project Manager / General', visual: 'robot default',            color: '#5b8def', capabilities: ['Koordinasi & delegasi tugas', 'Ringkasan dan laporan', 'Penjadwalan', 'Manajemen proyek'] },
  { id: 'aris',              name: 'Aris',            role: 'Graphic Designer',          visual: 'baret ungu + stylus + drawing tablet', color: '#a06ee8', capabilities: ['Desain grafis', 'Ilustrasi', 'Branding', 'Layout & tipografi'] },
  { id: 'udin',              name: 'Udin',            role: 'Video Editor',              visual: 'headphone + tema merah REC', color: '#e5534b', capabilities: ['Edit video', 'Caption & subtitle', 'Thumbnail video', 'Repurpose konten'] },
  { id: 'vision-agent-03',   name: 'Vision Agent 03', role: 'QC Visual',                 visual: 'mata kamera',                color: '#39c5cf', capabilities: ['Review visual', 'Cek kualitas gambar', 'Deteksi cacat desain', 'Konsistensi brand'] },
  { id: 'research-agent-01', name: 'Research Agent 01', role: 'Riset',                   visual: 'kaca pembesar / antena',     color: '#e8b93e', capabilities: ['Riset web', 'Ringkasan sumber', 'Perbandingan data', 'Fact-checking'] },
  { id: 'coding-agent-02',   name: 'Coding Agent 02', role: 'Coding',                    visual: 'keyboard',                   color: '#4cc38a', capabilities: ['Tulis & perbaiki kode', 'Review kode', 'Script & otomasi', 'Debugging'] },
];
const ROSTER_IDS = new Set(ROSTER.map(a => a.id));

/* ---------------- Util ---------------- */
function nowWibIso() {
  // WIB = UTC+7 sepanjang tahun (tidak ada DST) — aman diformat manual dari waktu Jakarta.
  const s = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ_DEFAULT, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date()); // "2026-10-07 15:40:11"
  return s.replace(' ', 'T') + '+07:00';
}
function readText(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
function readJSON(p, fallback) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; } }
function readJSONL(p) {
  const txt = readText(p);
  if (!txt) return [];
  const out = [];
  for (const line of txt.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try { out.push(JSON.parse(t)); } catch { /* baris rusak di-skip */ }
  }
  return out;
}
function fmtBytes(n) {
  if (n == null || isNaN(n)) return null;
  const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0; let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return Math.round(v * 10) / 10 + ' ' + u[i];
}

/* ---------------- /proc: sistem & memory container ---------------- */
let PAGE_SIZE = 4096;
try { PAGE_SIZE = parseInt(require('child_process').execFileSync('getconf', ['PAGESIZE'], { encoding: 'utf8' }).trim(), 10) || 4096; } catch { /* fallback 4096 */ }

function readProc() {
  const loadavg = (readText('/proc/loadavg') || '').trim().split(/\s+/);
  const uptimeSec = parseFloat((readText('/proc/uptime') || '0').split(/\s+/)[0]) || 0;
  const mem = {};
  const meminfo = readText('/proc/meminfo') || '';
  for (const line of meminfo.split('\n')) {
    const m = line.match(/^(\w+):\s+(\d+)\s*kB/);
    if (m) mem[m[1]] = parseInt(m[2], 10) * 1024;
  }
  let cpuModel = null, cores = 0;
  const cpuinfo = readText('/proc/cpuinfo') || '';
  for (const line of cpuinfo.split('\n')) {
    if (!cpuModel && /^model name/i.test(line)) cpuModel = line.split(':')[1].trim();
    if (/^processor\s*:/.test(line)) cores++;
  }
  if (!cores) cores = os.cpus().length || 1;
  // Memory container: jumlah RSS semua proses yang terlihat di /proc (statm kolom resident).
  let rssTotal = 0, procCount = 0;
  let pids = [];
  try { pids = fs.readdirSync('/proc').filter(d => /^\d+$/.test(d)); } catch { /* abaikan */ }
  for (const pid of pids) {
    try {
      const parts = fs.readFileSync(`/proc/${pid}/statm`, 'utf8').trim().split(/\s+/);
      const resident = parseInt(parts[1], 10);
      if (!isNaN(resident)) { rssTotal += resident * PAGE_SIZE; procCount++; }
    } catch { /* proses sudah mati / tak terbaca */ }
  }
  return {
    loadavg: loadavg.slice(0, 3).map(x => parseFloat(x) || 0),
    cores,
    cpu_model: cpuModel,
    uptime_sec: Math.floor(uptimeSec),
    mem_host: { total: mem.MemTotal || null, free: mem.MemFree || null, available: mem.MemAvailable || null },
    mem_container_bytes: rssTotal,
    proc_count: procCount,
  };
}
function readOsRelease() {
  const txt = readText('/etc/os-release') || '';
  const m = txt.match(/^PRETTY_NAME="?([^"\n]+)"?/m);
  return m ? m[1] : (os.type() + ' ' + os.release());
}
function readDisk() {
  try {
    const s = fs.statfsSync('/');
    const total = s.blocks * s.bsize;
    const free = s.bavail * s.bsize;
    return { total, free, used: total - free, mount: '/' };
  } catch { return { total: null, free: null, used: null, mount: '/' }; }
}

/* ---------------- Schedules: parse frontmatter cron .md ---------------- */
function parseFrontmatter(txt) {
  if (!txt.startsWith('---')) return null;
  const end = txt.indexOf('\n---', 3);
  if (end < 0) return null;
  const block = txt.slice(3, end);
  const root = {};
  let currentObj = null; // nama objek nested (indent 2)
  let currentArrKey = null, currentArrObj = null;
  const parseVal = (v) => {
    v = v.trim();
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === '[]') return [];
    if (v.startsWith('[') && v.endsWith(']')) {
      const inner = v.slice(1, -1).trim();
      return inner ? inner.split(',').map(x => x.trim().replace(/^["']|["']$/g, '')) : [];
    }
    return v.replace(/^["']|["']$/g, '');
  };
  for (const rawLine of block.split('\n')) {
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue;
    const indent = rawLine.length - rawLine.trimStart().length;
    const line = rawLine.trim();
    if (line.startsWith('- ')) { // item array blok
      if (currentArrKey) {
        if (!Array.isArray((currentArrObj || root)[currentArrKey])) (currentArrObj || root)[currentArrKey] = [];
        (currentArrObj || root)[currentArrKey].push(parseVal(line.slice(2)));
      }
      continue;
    }
    const m = line.match(/^([\w.-]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, val] = m;
    if (indent === 0) {
      if (val === '') { root[key] = {}; currentObj = key; currentArrKey = null; currentArrObj = null; }
      else { root[key] = parseVal(val); currentObj = null; currentArrKey = key; currentArrObj = root; }
    } else if (currentObj && root[currentObj] && typeof root[currentObj] === 'object') {
      if (val === '') { root[currentObj][key] = {}; }
      else { root[currentObj][key] = parseVal(val); currentArrKey = key; currentArrObj = root[currentObj]; }
    }
  }
  return root;
}

const DOW_ID = { Mon: 'Sen', Tue: 'Sel', Wed: 'Rab', Thu: 'Kam', Fri: 'Jum', Sat: 'Sab', Sun: 'Min' };
function tzOffsetMs(tz, utcMs) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(utcMs));
    const p = {}; for (const x of parts) p[x.type] = x.value;
    const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
    return asUtc - Math.floor(utcMs / 1000) * 1000;
  } catch { return 7 * 3600 * 1000; }
}
function zonedToUtc(y, mo, d, H, M, S, tz) {
  let guess = Date.UTC(y, mo - 1, d, H, M, S);
  let off = tzOffsetMs(tz, guess);
  let utc = guess - off;
  off = tzOffsetMs(tz, utc);
  utc = guess - off;
  return utc;
}
function wallParts(tz, utcMs) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(utcMs));
  const p = {}; for (const x of parts) p[x.type] = x.value;
  return { y: +p.year, mo: +p.month, d: +p.day, H: +p.hour % 24, M: +p.minute, S: +p.second, dow: p.weekday };
}
function parseHMS(t) {
  const m = String(t || '00:00').match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  return m ? { H: +m[1], M: +m[2], S: +(m[3] || 0) } : { H: 0, M: 0, S: 0 };
}
function parseEveryMs(every) {
  const m = String(every || '').trim().match(/^(\d+)\s*([smhd])$/);
  if (!m) return null;
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]];
  return { n: parseInt(m[1], 10), unit: m[2], ms: parseInt(m[1], 10) * mult };
}
function fmtDateID(utcMs, tz) {
  try {
    return new Intl.DateTimeFormat('id-ID', { timeZone: tz, day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(utcMs));
  } catch { return new Date(utcMs).toISOString().slice(0, 10); }
}
function fmtTimeID(utcMs, tz) {
  try {
    return new Intl.DateTimeFormat('id-ID', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(utcMs)).replace('.', ':');
  } catch { return ''; }
}
function scheduleLabelAndNext(fm, filePath) {
  const sch = fm.schedule || {};
  const kind = sch.kind || 'unknown';
  const tz = sch.timezone && sch.timezone !== '@user.current' ? sch.timezone : TZ_DEFAULT;
  const now = Date.now();
  let next = null;
  let label = kind;
  try {
    if (kind === 'runonce' && sch.at) {
      const m = String(sch.at).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
      if (m) {
        const utc = zonedToUtc(+m[1], +m[2], +m[3], +m[4], +m[5], +(m[6] || 0), tz);
        label = `sekali • ${fmtDateID(utc, tz)}, ${fmtTimeID(utc, tz)}`;
        if (utc > now) next = utc;
      }
    } else if (kind === 'interval') {
      const ev = parseEveryMs(sch.every);
      if (ev) {
        if (ev.unit === 's') label = `tiap ${ev.n} detik`;
        else if (ev.unit === 'm') label = `tiap ${ev.n} menit`;
        else if (ev.unit === 'h') label = (ev.n % 24 === 0) ? `tiap ${ev.n / 24} hari` : `tiap ${ev.n} jam`;
        else label = `tiap ${ev.n} hari`;
        let anchor = null;
        if (sch.at) {
          const m = String(sch.at).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
          if (m) anchor = zonedToUtc(+m[1], +m[2], +m[3], +m[4], +m[5], +(m[6] || 0), tz);
        }
        if (anchor == null) { try { anchor = fs.statSync(filePath).mtimeMs; } catch { anchor = now; } }
        next = anchor > now ? anchor : anchor + Math.ceil((now - anchor) / ev.ms) * ev.ms;
        if (next <= now) next += ev.ms;
      }
    } else if (kind === 'daily' || kind === 'weekly' || kind === 'monthly' || kind === 'yearly') {
      const { H, M, S } = parseHMS(sch.time);
      const hhmm = String(H).padStart(2, '0') + ':' + String(M).padStart(2, '0');
      const dowSet = Array.isArray(sch.dow) ? sch.dow : (sch.dow ? [sch.dow] : []);
      const domSet = Array.isArray(sch.dom) ? sch.dom.map(Number) : (sch.dom ? [Number(sch.dom)] : []);
      const monSet = Array.isArray(sch.month) ? sch.month.map(Number) : (sch.month ? [Number(sch.month)] : []);
      if (kind === 'daily') label = `harian • ${hhmm}`;
      if (kind === 'weekly') label = `mingguan • ${dowSet.map(d => DOW_ID[d] || d).join(', ')} ${hhmm}`;
      if (kind === 'monthly') label = `bulanan • tgl ${domSet.join(', ')} ${hhmm}`;
      if (kind === 'yearly') label = `tahunan • ${hhmm}`;
      // Telusuri hari-hari dinding (wall days) berikutnya di zona waktu jadwal.
      const startWall = wallParts(tz, now);
      let base = Date.UTC(startWall.y, startWall.mo - 1, startWall.d);
      for (let i = 0; i < 400 && next == null; i++) {
        const day = new Date(base + i * 86400000);
        const y = day.getUTCFullYear(), mo = day.getUTCMonth() + 1, d = day.getUTCDate();
        const utc = zonedToUtc(y, mo, d, H, M, S, tz);
        if (utc <= now) continue;
        const wp = wallParts(tz, utc);
        if (kind === 'weekly' && dowSet.length && !dowSet.includes(wp.dow)) continue;
        if (kind === 'monthly' && domSet.length && !domSet.includes(wp.d)) continue;
        if (kind === 'yearly' && ((domSet.length && !domSet.includes(wp.d)) || (monSet.length && !monSet.includes(wp.mo)))) continue;
        next = utc;
      }
    }
  } catch { /* jadwal rusak tidak boleh menjatuhkan server */ }
  return { label, next_iso: next ? new Date(next).toISOString() : null };
}
function collectScheduleFiles() {
  const bases = [
    { dir: path.join(WORKSPACE, 'cron.d'), is_system: false },
    { dir: path.join(WORKSPACE, 'system-cron.d'), is_system: true },
  ];
  try {
    const goalsDir = path.join(WORKSPACE, 'goals');
    for (const g of fs.readdirSync(goalsDir)) {
      bases.push({ dir: path.join(goalsDir, g, 'crons'), is_system: false });
      bases.push({ dir: path.join(goalsDir, g, 'cron.d'), is_system: false });
    }
  } catch { /* folder goals belum ada */ }
  const files = [];
  const walk = (dir, is_system) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith('_')) continue; // _archive / _invalid dilewati
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, is_system);
      else if (e.isFile() && e.name.endsWith('.md')) files.push({ path: p, is_system });
    }
  };
  for (const b of bases) walk(b.dir, b.is_system);
  return files;
}
function readSchedules() {
  const out = [];
  for (const f of collectScheduleFiles()) {
    try {
      const txt = readText(f.path);
      if (!txt) continue;
      const fm = parseFrontmatter(txt);
      if (!fm || !fm.id) continue;
      const { label, next_iso } = scheduleLabelAndNext(fm, f.path);
      out.push({
        id: String(fm.id),
        title: fm.title ? String(fm.title) : String(fm.id),
        enabled: fm.enabled !== false && fm.enabled !== 'false',
        owner: fm.owner ? String(fm.owner) : null,
        mode: fm.mode ? String(fm.mode) : null,
        kind: fm.schedule && fm.schedule.kind ? String(fm.schedule.kind) : 'unknown',
        label,
        timezone: fm.schedule && fm.schedule.timezone ? String(fm.schedule.timezone) : TZ_DEFAULT,
        next_iso,
        is_system: f.is_system,
      });
    } catch { /* file rusak di-skip tanpa crash */ }
  }
  out.sort((a, b) => (a.is_system - b.is_system) || ((a.next_iso || '9999') < (b.next_iso || '9999') ? -1 : 1));
  return out;
}

/* ---------------- Token status (perintah status langganan, di-cache 60 dtk) ---------------- */
let tokenCache = { at: 0, data: { available: false, note: 'belum diperiksa' } };
function resolveSubStatusBin() {
  const candidates = ['/opt/hatch/bin/subscription-status', '/usr/local/bin/subscription-status', '/usr/bin/subscription-status'];
  for (const c of candidates) { try { if (fs.existsSync(c)) return c; } catch { /* lanjut */ } }
  return 'subscription-status'; // fallback: cari lewat PATH
}
function refreshToken() {
  execFile(resolveSubStatusBin(), ['status'], { timeout: 8000 }, (err, stdout) => {
    if (err) { tokenCache = { at: Date.now(), data: { available: false, note: 'perintah subscription-status tidak tersedia/gagal', error: String(err.message || err) } }; return; }
    const raw = String(stdout || '').trim();
    const get = (re) => { const m = raw.match(re); return m ? m : null; };
    const usage = get(/Usage:\s*([\d.]+)%\s*of\s*(.+)\./i);
    const resets = get(/resets\s+(.+)/i);
    const add = get(/Additional tokens:\s*([\d.]+)%\s*used\s*\(([^)]+)\)/i);
    tokenCache = {
      at: Date.now(),
      data: {
        available: true,
        has_subscription: !/does not have a subscription/i.test(raw),
        usage_percent: usage ? parseFloat(usage[1]) : null,
        usage_scope: usage ? usage[2].trim() : null,
        resets: resets ? resets[1].trim() : null,
        additional_percent: add ? parseFloat(add[1]) : null,
        additional_left: add ? add[2].trim() : null,
        raw,
        checked_at: new Date().toISOString(),
      },
    };
  });
}
refreshToken();
setInterval(refreshToken, 60000).unref();

/* ---------------- Tunnel: cek HTTP berkala (cache 25 dtk, tidak memblokir) ---------------- */
let tunnelCheck = { at: 0, online: null };
function getPublicUrl() {
  const t = readText(path.join(ROOT, 'PUBLIC_URL.txt'));
  const v = t ? t.trim() : '';
  return v || null;
}
function boreAlive() {
  try {
    for (const pid of fs.readdirSync('/proc').filter(d => /^\d+$/.test(d))) {
      try {
        const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ');
        if (/\bbore\b/.test(cmd) && /3001/.test(cmd)) return true;
      } catch { /* lanjut */ }
    }
  } catch { /* abaikan */ }
  return false;
}
function refreshTunnelCheck() {
  const url = getPublicUrl();
  if (!url) { tunnelCheck = { at: Date.now(), online: false }; return; }
  if (Date.now() - tunnelCheck.at < 25000) return;
  tunnelCheck.at = Date.now();
  try {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? require('https') : http;
    const req = lib.get(url, { timeout: 3000 }, (res) => {
      tunnelCheck.online = res.statusCode >= 200 && res.statusCode < 500;
      res.resume();
    });
    req.on('timeout', () => { tunnelCheck.online = false; req.destroy(); });
    req.on('error', () => { tunnelCheck.online = false; });
  } catch { tunnelCheck.online = false; }
}

/* ---------------- State ---------------- */
function buildState() {
  const proc = readProc();
  const taskEvents = readJSONL(path.join(DATA, 'tasks.jsonl'));
  const queue = readJSONL(path.join(DATA, 'queue.jsonl'));
  const dispatch = readJSON(path.join(DATA, 'dispatch.json'), { paused: false });
  const dispatchPaused = !!(dispatch && dispatch.paused);
  const pausedMap = readJSON(path.join(DATA, 'agents-paused.json'), {}) || {};

  // Task terakhir per task_id menentukan status aktif agent.
  const latestByTask = new Map();
  for (const ev of taskEvents) if (ev && ev.task_id) latestByTask.set(ev.task_id, ev);
  const activeByAgent = new Map();
  for (const ev of latestByTask.values()) {
    if ((ev.status === 'started' || ev.status === 'progress') && ev.agent) {
      const prev = activeByAgent.get(ev.agent);
      if (!prev || String(ev.ts) > String(prev.ts)) activeByAgent.set(ev.agent, ev);
    }
  }
  const agents = ROSTER.map(r => {
    const active = activeByAgent.get(r.id) || null;
    const paused = dispatchPaused || !!pausedMap[r.id];
    return {
      id: r.id, name: r.name, role: r.role, visual: r.visual, color: r.color, capabilities: r.capabilities,
      status: paused ? 'paused' : (active ? 'working' : 'idle'),
      paused_individual: !!pausedMap[r.id],
      active_task: active ? { task_id: active.task_id, title: active.title || '', status: active.status, ts: active.ts, detail: active.detail || '' } : null,
    };
  });

  const disk = readDisk();
  const publicUrl = getPublicUrl();
  refreshTunnelCheck();
  const watchdogLast = readJSON(path.join(DATA, 'watchdog-last.json'), null);
  const watchdogHist = readJSONL(path.join(DATA, 'watchdog-history.jsonl'));
  const hostTotal = proc.mem_host.total, hostAvail = proc.mem_host.available;

  const vps = {
    disk: { used: disk.used, total: disk.total, free: disk.free, pct: disk.total ? Math.round(disk.used / disk.total * 1000) / 10 : null, mount: disk.mount },
    cpu: { model: proc.cpu_model, cores: proc.cores, loadavg: proc.loadavg, load_pct: Math.round((proc.loadavg[0] / proc.cores) * 1000) / 10 },
    memory_container: {
      bytes: proc.mem_container_bytes,
      label: 'MEMORY (CONTAINER)',
      subtext: hostTotal ? `container kita • host: ${(((hostTotal - (hostAvail || 0)) / 1073741824)).toFixed(1)} / ${(hostTotal / 1073741824).toFixed(1)} GB (di luar kendali)` : 'container kita • host: tidak terbaca',
      proc_count: proc.proc_count,
    },
    memory_host: proc.mem_host,
    uptime_sec: proc.uptime_sec,
    tunnel: { url: publicUrl, online: tunnelCheck.online, bore_alive: boreAlive(), checked_at: tunnelCheck.at ? new Date(tunnelCheck.at).toISOString() : null },
    os: readOsRelease(),
    kernel: os.release(),
    hostname: os.hostname(),
    watchdog: {
      last_run: watchdogLast ? watchdogLast.ts || null : null,
      last_status: watchdogLast ? watchdogLast.status || null : null,
      last_event: watchdogHist.length ? watchdogHist[watchdogHist.length - 1] : null,
    },
  };

  const log = [];
  for (const ev of taskEvents) log.push({ ts: ev.ts || '', source: 'task', text: `${ev.agent || '?'} • ${ev.task_id || ''} • ${ev.status || ''} • ${ev.title || ''}${ev.detail ? ' — ' + ev.detail : ''}` });
  for (const q of queue) log.push({ ts: q.ts || '', source: 'queue', text: `queue → ${q.agent || '?'}: ${q.prompt || ''} [${q.status || ''}]` });
  for (const w of watchdogHist) log.push({ ts: w.ts || '', source: 'watchdog', text: `watchdog: ${w.event || ''} ${w.new_url || w.url || ''} ${w.reason || ''}`.trim() });
  log.sort((a, b) => String(b.ts).localeCompare(String(a.ts)));

  return {
    now: new Date().toISOString(),
    now_wib: nowWibIso(),
    roster: ROSTER,
    agents,
    queue: queue.slice(-100).reverse(),
    queue_queued_count: queue.filter(q => q.status === 'queued').length,
    tasks: taskEvents.slice(-200).reverse(),
    system: {
      loadavg: proc.loadavg, cores: proc.cores, cpu_model: proc.cpu_model,
      load_pct: Math.round((proc.loadavg[0] / proc.cores) * 1000) / 10,
      mem_host: proc.mem_host, mem_container_bytes: proc.mem_container_bytes,
      uptime_sec: proc.uptime_sec, proc_count: proc.proc_count,
      server_uptime_sec: Math.floor(process.uptime()),
      node: process.version,
    },
    vps,
    schedules: readSchedules(),
    token: tokenCache.data,
    dispatch_paused: dispatchPaused,
    log: log.slice(0, 100),
  };
}

/* ---------------- HTTP server ---------------- */
function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}
function readBody(req, cb) {
  let data = '';
  req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
  req.on('end', () => { try { cb(JSON.parse(data || '{}')); } catch { cb(null); } });
}
const STATIC = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/vendor/three.min.js': ['vendor/three.min.js', 'application/javascript; charset=utf-8'],
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const p = url.pathname;
  if (p === '/api/state' && req.method === 'GET') {
    try { sendJSON(res, 200, buildState()); } catch (e) { sendJSON(res, 500, { error: String(e && e.message || e) }); }
    return;
  }
  if (p === '/api/queue' && req.method === 'POST') {
    readBody(req, (body) => {
      if (!body || !String(body.prompt || '').trim()) { sendJSON(res, 400, { ok: false, error: 'prompt wajib diisi' }); return; }
      const agent = ROSTER_IDS.has(body.agent) ? body.agent : 'muse';
      const item = { ts: nowWibIso(), prompt: String(body.prompt).trim().slice(0, 500), agent, status: 'queued' };
      fs.appendFileSync(path.join(DATA, 'queue.jsonl'), JSON.stringify(item) + '\n');
      sendJSON(res, 200, { ok: true, item });
    });
    return;
  }
  if (p === '/api/dispatch' && req.method === 'POST') {
    readBody(req, (body) => {
      if (!body || typeof body.paused !== 'boolean') { sendJSON(res, 400, { ok: false, error: 'paused harus boolean' }); return; }
      fs.writeFileSync(path.join(DATA, 'dispatch.json'), JSON.stringify({ paused: body.paused, updated_at: nowWibIso() }, null, 2) + '\n');
      sendJSON(res, 200, { ok: true, paused: body.paused });
    });
    return;
  }
  if (p === '/api/agent-pause' && req.method === 'POST') {
    readBody(req, (body) => {
      if (!body || !ROSTER_IDS.has(body.agent) || typeof body.paused !== 'boolean') { sendJSON(res, 400, { ok: false, error: 'agent/paused tidak valid' }); return; }
      const map = readJSON(path.join(DATA, 'agents-paused.json'), {}) || {};
      map[body.agent] = body.paused;
      fs.writeFileSync(path.join(DATA, 'agents-paused.json'), JSON.stringify(map, null, 2) + '\n');
      sendJSON(res, 200, { ok: true, agent: body.agent, paused: body.paused });
    });
    return;
  }
  if (req.method === 'GET' && STATIC[p]) {
    const [file, type] = STATIC[p];
    fs.readFile(path.join(ROOT, file), (err, buf) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': type });
      res.end(buf);
    });
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});
server.listen(PORT, HOST, () => {
  console.log(`[mission-control] listening on http://${HOST}:${PORT} at ${nowWibIso()}`);
});
