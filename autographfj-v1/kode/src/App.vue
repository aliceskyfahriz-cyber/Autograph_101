<script setup>
import { computed, onMounted, ref } from 'vue'
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'
import Toast from './components/Toast.vue'
import Dashboard from './pages/Dashboard.vue'
import Jobs from './pages/Jobs.vue'
import MasterJobs from './pages/MasterJobs.vue'
import Reports from './pages/Reports.vue'
import Settings from './pages/Settings.vue'
import Login from './pages/Login.vue'
import AdminTeknisi from './pages/AdminTeknisi.vue'
import { hashPassword } from './utils/auth.js'
import { supabase } from './lib/supabase.js'

// ===== Penyimpanan v2: akun (users) + data per-teknisi (data[userId]) =====
const DB_KEY = 'tpm-techpoint-v2'
const SESSION_KEY = 'tpm_session_v2'

const seedMasters = [
  { id: 101, code: 'PB-B2C', name: 'Pasang Baru B2C', category: 'Pasang Baru', segment: 'B2C', points: 5, active: true },
  { id: 102, code: 'PB-B2B', name: 'Pasang Baru B2B', category: 'Pasang Baru', segment: 'B2B', points: 7, active: true },
  { id: 103, code: 'PB-EXBISS', name: 'Pasang Baru EXBISS', category: 'Pasang Baru', segment: 'EXBISS', points: 10, active: true },
  { id: 104, code: 'MT-B2C', name: 'Maintenance B2C', category: 'Maintenance', segment: 'B2C', points: 2, active: true },
  { id: 105, code: 'MT-B2B', name: 'Maintenance B2B', category: 'Maintenance', segment: 'B2B', points: 4, active: true },
  { id: 106, code: 'MT-EXBISS', name: 'Maintenance EXBISS', category: 'Maintenance', segment: 'EXBISS', points: 8, active: true },
  { id: 107, code: 'UP-B2C', name: 'Upgrade B2C', category: 'Upgrade', segment: 'B2C', points: 1, active: true },
  { id: 108, code: 'UP-B2B', name: 'Upgrade B2B', category: 'Upgrade', segment: 'B2B', points: 2, active: true },
  { id: 109, code: 'UP-EXBISS', name: 'Upgrade EXBISS', category: 'Upgrade', segment: 'EXBISS', points: 4, active: true }
]
const legacyMasterIds = new Set([1, 2, 3, 4])
const legacyMasters = [
  { id: 1, code: 'PB01', name: 'Pasang Baru (data lama)', points: 10, active: false },
  { id: 2, code: 'GS01', name: 'Gangguan (data lama)', points: 5, active: false },
  { id: 3, code: 'UP01', name: 'Upgrade (data lama)', points: 7, active: false },
  { id: 4, code: 'MT01', name: 'Maintenance (data lama)', points: 8, active: false }
]
const demoJobs = [
  { id: 1, date: '2026-09-01', typeId: 1, qty: 2 }, { id: 2, date: '2026-09-02', typeId: 2, qty: 4 },
  { id: 3, date: '2026-09-04', typeId: 3, qty: 3 }, { id: 4, date: '2026-09-07', typeId: 1, qty: 2 },
  { id: 5, date: '2026-09-10', typeId: 4, qty: 5 }, { id: 6, date: '2026-09-12', typeId: 2, qty: 3 },
  { id: 7, date: '2026-09-15', typeId: 3, qty: 2 }
]
function datasetFor(profile, jobs = [], target = 1000) {
  return { profile: { ...profile }, target, jobs: structuredClone(jobs), masterJobs: [...structuredClone(seedMasters), ...structuredClone(legacyMasters)] }
}
function seedDB() {
  const users = [
    { id: 'u-admin', username: 'admin', passHash: hashPassword('admin123'), role: 'admin', status: 'active', name: 'Administrator', code: 'ADMIN', team: 'Pengelola Sistem' },
    { id: 'u-fahriz', username: 'fahriz', passHash: hashPassword('teknisi123'), role: 'teknisi', status: 'active', name: 'Fahriz', code: 'TECH-001', team: 'Tim Lapangan' },
    { id: 'u-budi', username: 'budi', passHash: hashPassword('teknisi123'), role: 'teknisi', status: 'active', name: 'Budi Santoso', code: 'TECH-002', team: 'Tim Lapangan' }
  ]
  const data = {
    'u-fahriz': datasetFor({ name: 'Fahriz', code: 'TECH-001', team: 'Tim Lapangan' }, demoJobs, 1000),
    'u-budi': datasetFor({ name: 'Budi Santoso', code: 'TECH-002', team: 'Tim Lapangan' }, [
      { id: 1, date: '2026-09-03', typeId: 1, qty: 1 },
      { id: 2, date: '2026-09-08', typeId: 2, qty: 3 },
      { id: 3, date: '2026-09-11', typeId: 4, qty: 2 }
    ], 1000)
  }
  return { users, data }
}
function loadDB() {
  try {
    const raw = JSON.parse(localStorage.getItem(DB_KEY))
    if (raw && Array.isArray(raw.users) && raw.data) {
      // Migrasi aman: pertahankan riwayat lama, nonaktifkan master lama, tambahkan 9 kombinasi jenis pekerjaan baru.
      Object.values(raw.data).forEach(data => {
        if (!Array.isArray(data.masterJobs)) data.masterJobs = []
        data.masterJobs.forEach(m => { if (legacyMasterIds.has(m.id)) m.active = false })
        seedMasters.forEach(master => {
          const existing = data.masterJobs.find(m => m.id === master.id)
          if (!existing) data.masterJobs.push({ ...master })
          else Object.assign(existing, { segment: master.segment, category: master.category })
        })
      })
      return raw
    }
  } catch { /* abaikan, reseed */ }
  return seedDB()
}

const db = ref(loadDB())
const page = ref('dashboard')
const mobile = ref(false)
const toast = ref({ show: false, message: '' })
const loginError = ref('')
const sessionId = ref('')
const authReady = ref(false)
const managedId = ref('')
const remoteJobTypes = ref([])
const remoteDataReady = ref(false)

function save() { localStorage.setItem(DB_KEY, JSON.stringify(db.value)) }
save()

// ===== Sesi & role =====
const currentUser = computed(() => db.value.users.find(u => u.id === sessionId.value && u.status === 'active') || null)
const logged = computed(() => !!currentUser.value)
const isAdmin = computed(() => currentUser.value?.role === 'admin')
const teknisiList = computed(() => db.value.users.filter(u => u.role === 'teknisi'))
const activeUserId = computed(() => {
  if (!currentUser.value) return ''
  if (!isAdmin.value) return currentUser.value.id
  const m = teknisiList.value.find(u => u.id === managedId.value)
  return (m || teknisiList.value[0])?.id || ''
})
const activeUser = computed(() => db.value.users.find(u => u.id === activeUserId.value) || null)
function ds() { return db.value.data[activeUserId.value] || null }

// ===== Data aktif (teknisi sendiri, atau teknisi yang dikelola admin) =====
const masters = computed(() => (ds()?.masterJobs || []).filter(x => x.active))
const partnerOptions = computed(() => teknisiList.value.filter(u => u.status === 'active' && u.id !== activeUserId.value))
const jobs = computed(() => {
  const d = ds(); if (!d) return []
  return d.jobs.map(x => {
    const m = d.masterJobs.find(y => y.id === x.typeId)
    const partner = db.value.users.find(u => u.id === x.partnerId)
    const basePoints = Number(m?.points || 0) * Number(x.qty || 0)
    return { ...x, master: m, partnerName: partner?.name || '', points: Number(m?.points || 0), total: basePoints / (x.partnerId ? 2 : 1) }
  }).sort((a, b) => b.date.localeCompare(a.date))
})
const total = computed(() => jobs.value.reduce((s, x) => s + x.total, 0))
const qty = computed(() => jobs.value.reduce((s, x) => s + Number(x.qty), 0))
const target = computed(() => ds()?.target || 0)
const pct = computed(() => target.value ? Math.min(total.value / target.value * 100, 100) : 0)
const rem = computed(() => Math.max(target.value - total.value, 0))
const stats = computed(() => {
  const out = {}
  db.value.users.forEach(u => {
    const d = db.value.data[u.id]; if (!d) return
    let q = 0, t = 0
    d.jobs.forEach(j => {
      const m = d.masterJobs.find(y => y.id === j.typeId)
      q += Number(j.qty); t += ((m?.points || 0) * Number(j.qty)) / (j.partnerId ? 2 : 1)
    })
    out[u.id] = { qty: q, total: t, target: d.target }
  })
  return out
})

function nav(x) { page.value = x; mobile.value = false; scrollTo({ top: 0, behavior: 'smooth' }) }
function note(m) { toast.value = { show: true, message: m }; setTimeout(() => toast.value.show = false, 2600) }

// ===== Supabase Auth: email/password dan role dari public.profiles =====
async function hydrateProfiles(authUser) {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, target_points, status')

  if (error) throw new Error('Tidak dapat membaca profil pengguna. Periksa kebijakan SELECT pada tabel profiles.')

  const ownProfile = (profiles || []).find(profile => profile.id === authUser.id)
  if (!ownProfile) {
    throw new Error('Login berhasil, tetapi profil tidak ditemukan. Pastikan UID akun cocok dengan profiles.id.')
  }

  const users = (profiles || []).map(profile => ({
    id: profile.id,
    username: profile.id === authUser.id ? (authUser.email || profile.id) : profile.id.slice(0, 8),
    email: profile.id === authUser.id ? (authUser.email || '') : '',
    passHash: '',
    role: profile.role === 'admin' ? 'admin' : 'teknisi',
    status: profile.status || 'active',
    name: profile.full_name || 'Pengguna',
    code: '',
    team: ''
  }))

  db.value.users = users
  for (const user of users) {
    const profile = profiles.find(item => item.id === user.id)
    // Mulai kosong: data demo lokal tidak dibawa ke database baru.
    db.value.data[user.id] = datasetFor(
      { name: user.name, code: user.code, team: user.team },
      [],
      Number(profile?.target_points ?? 100)
    )
  }

  sessionId.value = authUser.id
  save()
  return ownProfile
}

function localMasterId(jobType) {
  const local = seedMasters.find(m => m.category === jobType.job_name && m.segment === jobType.segment)
  return local?.id ?? null
}

async function loadRemoteData() {
  const [{ data: jobTypes, error: typeError }, { data: tickets, error: ticketError }, { data: workers, error: workerError }] = await Promise.all([
    supabase.from('job_types').select('id, job_name, segment, points, active'),
    supabase.from('tickets').select('id, ticket_number, service_id, work_date, segment, job_type_id, created_by'),
    supabase.from('ticket_workers').select('ticket_id, technician_id, points')
  ])
  if (typeError) throw new Error('Tidak dapat membaca job_types. Periksa kebijakan SELECT tabel job_types.')
  if (ticketError) throw new Error('Tidak dapat membaca tickets. Periksa kebijakan SELECT tabel tickets.')
  if (workerError) throw new Error('Tidak dapat membaca ticket_workers. Periksa kebijakan SELECT tabel ticket_workers.')

  remoteJobTypes.value = jobTypes || []
  const activeMasters = (jobTypes || []).filter(row => row.active).map(row => {
    const seed = seedMasters.find(m => m.category === row.job_name && m.segment === row.segment)
    return {
      id: seed?.id ?? Number(row.id),
      remoteId: row.id,
      code: seed?.code ?? `${row.job_name}-${row.segment}`,
      name: `${row.job_name} ${row.segment}`,
      category: row.job_name,
      segment: row.segment,
      points: Number(row.points),
      active: row.active
    }
  })

  for (const user of db.value.users) {
    if (!db.value.data[user.id]) db.value.data[user.id] = datasetFor({ name: user.name, code: user.code, team: user.team }, [], 100)
    db.value.data[user.id].jobs = []
    db.value.data[user.id].masterJobs = [...activeMasters, ...structuredClone(legacyMasters)]
  }

  const workerRows = workers || []
  for (const ticket of tickets || []) {
    const type = (jobTypes || []).find(row => Number(row.id) === Number(ticket.job_type_id))
    const typeId = type ? localMasterId(type) : null
    if (typeId === null) continue
    const assigned = workerRows.filter(row => Number(row.ticket_id) === Number(ticket.id))
    for (const worker of assigned) {
      const data = db.value.data[worker.technician_id]
      if (!data) continue
      const partner = assigned.find(row => row.technician_id !== worker.technician_id)
      data.jobs.push({
        id: Number(ticket.id),
        date: ticket.work_date,
        typeId,
        qty: 1,
        ticketNumber: ticket.ticket_number,
        serviceId: ticket.service_id,
        segment: ticket.segment,
        partnerId: partner?.technician_id || '',
        sharedGroupId: assigned.length > 1 ? `shared-${ticket.id}` : '',
        createdBy: ticket.created_by
      })
    }
  }
  remoteDataReady.value = true
  save()
}

async function login({ email, password }) {
  loginError.value = ''
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: String(password || '')
  })

  if (error || !data.user) {
    loginError.value = 'Email atau password salah, atau akun belum dikonfirmasi.'
    return
  }

  try {
    const profile = await hydrateProfiles(data.user)
    try { await loadRemoteData() } catch (dataErr) { console.error(dataErr); note(dataErr?.message || 'Data Supabase belum dapat dimuat.') }
    managedId.value = ''
    page.value = profile.role === 'admin' ? 'admin' : 'dashboard'
    note('Selamat datang, ' + (profile.full_name || data.user.email || 'Pengguna') + (profile.role === 'admin' ? ' (Admin)' : '') + '.')
  } catch (err) {
    await supabase.auth.signOut()
    sessionId.value = ''
    loginError.value = err?.message || 'Login berhasil tetapi profil tidak dapat dimuat.'
  }
}

async function logout() {
  await supabase.auth.signOut()
  sessionId.value = ''
  loginError.value = ''
  page.value = 'dashboard'
}

onMounted(async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (!error && data.session?.user) {
      try {
        const profile = await hydrateProfiles(data.session.user)
        try { await loadRemoteData() } catch (dataErr) { console.error(dataErr); note(dataErr?.message || 'Data Supabase belum dapat dimuat.') }
        page.value = profile.role === 'admin' ? 'admin' : 'dashboard'
      } catch {
        await supabase.auth.signOut()
        sessionId.value = ''
      }
    }
  } finally {
    authReady.value = true
  }
})
async function changePassword({ oldPassword, newPassword }) {
  if (!currentUser.value) return
  const { data: sessionData } = await supabase.auth.getSession()
  const email = sessionData.session?.user?.email
  if (!email) return note('Email akun tidak ditemukan. Silakan login ulang.')
  const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: oldPassword })
  if (verifyError) return note('Password lama salah, password tidak diganti.')
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return note('Password gagal diubah: ' + error.message)
  note('Password akun Supabase berhasil diganti.')
}

// ===== Fitur data (sama seperti versi teknisi sebelumnya, kini per-teknisi aktif) =====
async function addJob(x) {
  const d = ds(); if (!d) return
  const ticket = String(x.ticketNumber || '').trim()
  const service = String(x.serviceId || '').trim()
  if (!ticket || !service) return note('Nomor tiket dan Service ID wajib diisi.')
  if (!remoteDataReady.value) return note('Data database belum siap. Muat ulang halaman dan coba lagi.')
  const allJobs = Object.values(db.value.data).flatMap(data => data.jobs)
  if (allJobs.some(j => String(j.ticketNumber || '').trim().toLowerCase() === ticket.toLowerCase())) return note('Nomor tiket ini sudah pernah dicatat. Setiap tiket hanya boleh diinput satu kali.')
  const partnerId = x.partnerId || ''
  if (partnerId && (!db.value.data[partnerId] || partnerId === activeUserId.value)) return note('Partner tidak valid.')

  const localMaster = d.masterJobs.find(m => Number(m.id) === Number(x.typeId))
  const remoteType = remoteJobTypes.value.find(row => row.job_name === localMaster?.category && row.segment === x.segment && row.active)
  if (!remoteType) return note('Jenis pekerjaan tidak ditemukan di database. Periksa job_types.')

  const basePoints = Number(remoteType.points) || 0
  const { data: insertedTicket, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      ticket_number: ticket,
      service_id: service,
      work_date: x.date,
      segment: x.segment,
      job_type_id: remoteType.id,
      created_by: currentUser.value.id
    })
    .select('id, ticket_number, service_id, work_date, segment, job_type_id, created_by')
    .single()

  if (ticketError || !insertedTicket) {
    if (ticketError?.code === '23505') return note('Nomor tiket ini sudah pernah dicatat.')
    console.error(ticketError)
    return note('Tiket gagal disimpan ke Supabase: ' + (ticketError?.message || 'kesalahan tidak diketahui'))
  }

  const workerIds = [activeUserId.value, ...(partnerId ? [partnerId] : [])]
  const perWorkerPoints = basePoints / workerIds.length
  const workerPayload = workerIds.map(technicianId => ({
    ticket_id: insertedTicket.id,
    technician_id: technicianId,
    points: perWorkerPoints
  }))
  const { error: workersError } = await supabase.from('ticket_workers').insert(workerPayload)
  if (workersError) {
    console.error(workersError)
    // Roll back tiket bila detail teknisi gagal disimpan.
    await supabase.from('tickets').delete().eq('id', insertedTicket.id)
    return note('Tiket belum lengkap karena detail teknisi gagal disimpan: ' + workersError.message)
  }

  try { await loadRemoteData() } catch (err) { console.error(err); return note('Tiket tersimpan, tetapi daftar belum dapat diperbarui. Muat ulang halaman.') }
  note(partnerId ? 'Pekerjaan bersama tersimpan di Supabase; poin dibagi untuk kedua teknisi.' : 'Pekerjaan berhasil disimpan di Supabase.')
  nav('jobs')
}

async function removeJob(id) {
  const { error } = await supabase.from('tickets').delete().eq('id', id)
  if (error) {
    console.error(error)
    return note('Tiket tidak dapat dihapus. Hanya pembuat tiket atau Admin yang diizinkan: ' + error.message)
  }
  try { await loadRemoteData() } catch (err) { console.error(err) }
  note('Tiket dan pembagian teknisinya berhasil dihapus dari Supabase.')
}
async function saveMaster(x) {
  if (!isAdmin.value) return note('Hanya Admin yang dapat mengubah master pekerjaan.')
  const existing = remoteJobTypes.value.find(row => row.job_name === x.category && row.segment === x.segment)
  const payload = { job_name: x.category, segment: x.segment, points: Number(x.points), active: x.active !== false }
  const result = existing
    ? await supabase.from('job_types').update(payload).eq('id', existing.id)
    : await supabase.from('job_types').insert(payload)
  if (result.error) return note('Master pekerjaan gagal disimpan: ' + result.error.message)
  try { await loadRemoteData() } catch (err) { console.error(err) }
  note('Master pekerjaan tersimpan di Supabase.')
}
async function delMaster(id) {
  const master = seedMasters.find(m => m.id === Number(id))
  const remote = remoteJobTypes.value.find(row => row.job_name === master?.category && row.segment === master?.segment)
  if (!remote) return note('Master pekerjaan tidak ditemukan di Supabase.')
  const used = Object.values(db.value.data).some(data => data.jobs.some(job => Number(job.typeId) === Number(id)))
  if (used) return note('Jenis pekerjaan masih dipakai pada riwayat tiket.')
  const { error } = await supabase.from('job_types').update({ active: false }).eq('id', remote.id)
  if (error) return note('Master pekerjaan gagal dinonaktifkan: ' + error.message)
  try { await loadRemoteData() } catch (err) { console.error(err) }
  note('Master pekerjaan dinonaktifkan di Supabase.')
}
async function settings(x) {
  const d = ds(); if (!d) return
  const u = activeUser.value
  const payload = { target_points: Number(x.target) || 0 }
  if (x.profile?.name) payload.full_name = x.profile.name
  const { error } = await supabase.from('profiles').update(payload).eq('id', activeUserId.value)
  if (error) return note('Pengaturan gagal disimpan ke Supabase: ' + error.message)
  d.target = Number(x.target) || 0
  d.profile = { ...d.profile, ...x.profile }
  if (u) u.name = d.profile.name
  save(); note('Pengaturan tersimpan di Supabase.')
}
function reset() {
  note('Reset data belum diaktifkan. Hapus tiket melalui riwayat atau kelola data secara terkontrol di Supabase.')
}

// ===== Pengelolaan akun Supabase melalui Edge Function =====
async function refreshAdminData() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Sesi Admin tidak ditemukan. Silakan login ulang.')
  await hydrateProfiles(data.user)
  await loadRemoteData()
}

async function callManageUsers(body) {
  const { data, error } = await supabase.functions.invoke('manage-users', { body })
  if (error) {
    const detail = data?.error || error.message || 'Permintaan ke backend gagal.'
    throw new Error(detail)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

async function addAccount(payload) {
  try {
    const result = await callManageUsers({
      action: 'create',
      email: payload.email,
      name: payload.name,
      password: payload.password,
      target: Number(payload.target) || 0
    })
    await refreshAdminData()
    note(result?.message || 'Akun teknisi berhasil dibuat.')
  } catch (err) {
    console.error(err)
    note('Akun gagal dibuat: ' + (err?.message || 'Kesalahan tidak diketahui.'))
  }
}

async function updateAccount(id, payload) {
  try {
    const result = await callManageUsers({
      action: 'update',
      userId: id,
      email: payload.email,
      name: payload.name,
      target: Number(payload.target) || 0
    })
    await refreshAdminData()
    note(result?.message || 'Profil teknisi berhasil diperbarui.')
  } catch (err) {
    console.error(err)
    note('Profil gagal diperbarui: ' + (err?.message || 'Kesalahan tidak diketahui.'))
  }
}

async function resetPassword(id, newPassword) {
  try {
    const result = await callManageUsers({
      action: 'reset_password',
      userId: id,
      password: newPassword
    })
    note(result?.message || 'Password berhasil direset.')
  } catch (err) {
    console.error(err)
    note('Reset password gagal: ' + (err?.message || 'Kesalahan tidak diketahui.'))
  }
}

async function toggleStatus(id) {
  const target = db.value.users.find(user => user.id === id)
  if (!target || target.role !== 'teknisi') return
  const status = target.status === 'active' ? 'suspended' : 'active'
  try {
    const result = await callManageUsers({ action: 'set_status', userId: id, status })
    await refreshAdminData()
    note(result?.message || 'Status akun berhasil diperbarui.')
  } catch (err) {
    console.error(err)
    note('Status akun gagal diubah: ' + (err?.message || 'Kesalahan tidak diketahui.'))
  }
}

function manage(id) {
  managedId.value = id
  nav('dashboard')
  note('Anda kini mengelola data milik ' + (db.value.users.find(u => u.id === id)?.name || '') + '.')
}
</script>
<template>
  <div v-if="!authReady" class="login-page"><div class="login-card">Memeriksa sesi login...</div></div>
  <Login v-else-if="!logged" :error="loginError" @login="login" />
  <div v-else class="app-shell">
    <Sidebar :active-page="page" :mobile-open="mobile" :is-admin="isAdmin" @navigate="nav" @logout="logout" />
    <div class="main-area">
      <Navbar :profile="ds()?.profile" :role="currentUser.role" @toggle-menu="mobile = !mobile" @logout="logout" />
      <main class="page-container">
        <div v-if="isAdmin && activeUser && page !== 'admin'" class="admin-banner">
          <span>🛡 <b>Mode Admin</b> — Anda sedang mengelola data milik <b>{{ activeUser.name }}</b> (@{{ activeUser.username }}). Semua perubahan di halaman ini berlaku ke data teknisi tersebut.</span>
          <button class="btn-secondary" @click="nav('admin')">Kelola Teknisi</button>
        </div>
        <AdminTeknisi v-if="page === 'admin' && isAdmin" :users="db.users" :stats="stats" :current-user-id="currentUser.id"
          @add="addAccount" @update="updateAccount" @reset-password="resetPassword" @toggle-status="toggleStatus" @manage="manage" />
        <Dashboard v-else-if="page === 'dashboard'" :total-points="total" :target="target" :achievement="pct" :remaining="rem" :total-qty="qty" :jobs="jobs" />
        <Jobs v-else-if="page === 'jobs'" :jobs="jobs" :master-jobs="masters" :technicians="partnerOptions" :current-user-id="currentUser.id" @add-job="addJob" @remove-job="removeJob" />
        <MasterJobs v-else-if="page === 'master'" :master-jobs="(ds()?.masterJobs || []).filter(m => m.id >= 101)" @save="saveMaster" @delete="delMaster" />
        <Reports v-else-if="page === 'reports'" :jobs="jobs" :target="target" :total-points="total" />
        <Settings v-else :profile="ds()?.profile || { name: currentUser.name, code: currentUser.code, team: currentUser.team }" :target="target" :can-manage-target="isAdmin" :can-reset="isAdmin" @save="settings" @reset="reset" @change-password="changePassword" />
      </main>
    </div>
    <Toast :show="toast.show" :message="toast.message" />
  </div>
</template>
