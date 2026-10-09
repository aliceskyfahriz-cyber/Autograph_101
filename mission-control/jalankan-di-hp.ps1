# ============================================================
#  Mission Control - Jembatan supaya bisa dibuka dari HP
#  Cara pakai:
#    1. Jalankan dulu server di Ubuntu (WSL):  HOST=0.0.0.0 node server.js
#    2. Klik kanan file ini > Run with PowerShell (sebagai Administrator)
#    3. Script menampilkan alamat yang harus dibuka di HP.
#  Ulangi script ini setiap kali WSL/Ubuntu direstart
#  (IP WSL berubah-ubah, script ini yang menyesuaikan).
# ============================================================

$wslIp = (wsl hostname -I).Trim().Split(' ')[0]
if (-not $wslIp) { Write-Host "WSL belum jalan. Buka Ubuntu dulu, lalu ulangi."; pause; exit }
Write-Host "IP WSL terdeteksi: $wslIp"

# Segarkan jembatan port 3001: Windows (LAN) -> WSL
netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0 2>$null | Out-Null
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=$wslIp | Out-Null
Write-Host "Jembatan port 3001 aktif."

# Izinkan lewat Windows Firewall (cukup sekali)
if (-not (Get-NetFirewallRule -DisplayName "Mission Control 3001" -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName "Mission Control 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow | Out-Null
    Write-Host "Aturan firewall dibuat."
}

# Cari IP LAN Windows (WiFi)
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' } | Select-Object -First 1).IPAddress
Write-Host ""
Write-Host "=================================================="
Write-Host "  Buka di HP (WiFi yang sama dengan PC):"
Write-Host "  http://$lanIp`:3001"
Write-Host "=================================================="
pause
