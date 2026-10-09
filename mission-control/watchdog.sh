#!/usr/bin/env bash
# Mission Control — watchdog.sh
# Dijalankan tiap 5 menit oleh systemd timer (mission-control-watchdog.timer).
# Tugas: pastikan server lokal hidup, pastikan tunnel bore hidup,
# catat URL publik terbaru ke PUBLIC_URL.txt + riwayat ke data/watchdog-history.jsonl.
# Output baris "NEW_PUBLIC_URL <url>" dipakai untuk melaporkan URL baru ke pengguna.
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA="$DIR/data"
URL_FILE="$DIR/PUBLIC_URL.txt"
HIST="$DATA/watchdog-history.jsonl"
LAST="$DATA/watchdog-last.json"
mkdir -p "$DATA"
BORE_BIN="$DIR/bin/bore"
[ -x "$BORE_BIN" ] || BORE_BIN="$(command -v bore || echo bore)"
LOCAL_API="http://127.0.0.1:3001/api/state"

ts() { TZ=Asia/Jakarta date +%Y-%m-%dT%H:%M:%S+07:00; }
log_event() { # $1 event, $2 old_url, $3 new_url, $4 reason
  printf '{"ts":"%s","event":"%s","old_url":"%s","new_url":"%s","reason":"%s"}\n' \
    "$(ts)" "$1" "${2:-}" "${3:-}" "${4:-}" >> "$HIST"
  echo "WATCHDOG_EVENT $1 old=${2:-} new=${3:-} reason=${4:-}"
}
write_last() { printf '{"ts":"%s","status":"%s"}\n' "$(ts)" "$1" > "$LAST"; }

STATUS="ok"

# 1) Server lokal harus hidup
if ! curl -fsS --max-time 5 "$LOCAL_API" >/dev/null 2>&1; then
  if command -v systemctl >/dev/null 2>&1 && systemctl cat mission-control.service >/dev/null 2>&1; then
    systemctl restart mission-control.service 2>/dev/null || true
  else
    (cd "$DIR" && nohup node server.js >> "$DATA/server.log" 2>&1 &)
  fi
  sleep 2
  if curl -fsS --max-time 5 "$LOCAL_API" >/dev/null 2>&1; then
    log_event "server_restarted" "" "" "local_api_down"
    STATUS="server_restarted"
  else
    log_event "server_down" "" "" "local_api_still_down_after_restart"
    STATUS="server_down"
  fi
fi

# 2) Tunnel bore harus hidup dan URL publik harus merespons HTTP 200
OLD_URL="$(tr -d '[:space:]' < "$URL_FILE" 2>/dev/null || echo '')"
TUNNEL_OK=0
if [ -n "$OLD_URL" ] && pgrep -f "bore local 3001" >/dev/null 2>&1; then
  CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 "$OLD_URL" 2>/dev/null || echo 000)"
  [ "$CODE" = "200" ] && TUNNEL_OK=1
fi

if [ "$TUNNEL_OK" != "1" ]; then
  REASON="tunnel_down_or_url_dead"
  [ -z "$OLD_URL" ] && REASON="no_public_url_yet"
  pkill -f "bore local 3001" 2>/dev/null || true
  sleep 1
  : > "$DATA/bore.log"
  (nohup "$BORE_BIN" local 3001 --to bore.pub >> "$DATA/bore.log" 2>&1 &)
  NEW_PORT=""
  for _ in $(seq 1 20); do
    # HANYA pola sukses yang diterima. Baris error bore juga memuat "bore.pub:7835"
    # (itu port kontrol server bore, BUKAN port tunnel kita) — jangan sampai tertukar.
    NEW_PORT="$(grep -E 'listening at bore\.pub:[0-9]+' "$DATA/bore.log" 2>/dev/null | head -1 | grep -oE '[0-9]+$')"
    [ -z "$NEW_PORT" ] && NEW_PORT="$(grep -E 'connected to server' "$DATA/bore.log" 2>/dev/null | head -1 | grep -oE 'remote_port[= ][0-9]+' | grep -oE '[0-9]+$')"
    [ -n "$NEW_PORT" ] && break
    # bore gagal total (mis. koneksi timeout) → berhenti menunggu lebih awal
    grep -q "could not connect" "$DATA/bore.log" 2>/dev/null && break
    sleep 1
  done
  if [ -n "$NEW_PORT" ]; then
    NEW_URL="http://bore.pub:${NEW_PORT}"
    # URL hanya ditulis ke PUBLIC_URL.txt setelah lolos live-check HTTP 200 (dicoba 3x).
    CODE="000"
    for _ in 1 2 3; do
      CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 "$NEW_URL" 2>/dev/null || echo 000)"
      [ "$CODE" = "200" ] && break
      sleep 2
    done
    if [ "$CODE" != "200" ]; then
      log_event "tunnel_unverified" "$OLD_URL" "$NEW_URL" "$REASON http=$CODE url_tidak_ditulis"
      [ "$STATUS" = "ok" ] && STATUS="tunnel_unverified"
      NEW_PORT="__handled__"
    else
      echo "$NEW_URL" > "$URL_FILE"
      if [ "$NEW_URL" != "$OLD_URL" ]; then
        log_event "url_changed" "$OLD_URL" "$NEW_URL" "$REASON http=$CODE"
        echo "NEW_PUBLIC_URL $NEW_URL"
      else
        log_event "tunnel_restarted" "$OLD_URL" "$NEW_URL" "$REASON http=$CODE"
      fi
      [ "$STATUS" = "ok" ] && STATUS="tunnel_restarted"
    fi
  fi
  if [ -z "$NEW_PORT" ]; then
    ERR="$(tr '\n' ' ' < "$DATA/bore.log" 2>/dev/null | cut -c1-180)"
    log_event "tunnel_start_failed" "$OLD_URL" "" "$REASON bore_log: $ERR"
    [ "$STATUS" = "ok" ] && STATUS="tunnel_start_failed"
  fi
fi

write_last "$STATUS"
echo "watchdog status=$STATUS url=$(tr -d '[:space:]' < "$URL_FILE" 2>/dev/null)"
