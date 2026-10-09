// Helper format untuk Kontruang

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
})

export function formatRupiah(n) {
  return rupiah.format(Number(n) || 0)
}

export function formatTanggal(iso) {
  if (!iso) return '-'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// "2026-10" dari Date / string tanggal
export function monthKey(date) {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

export function todayISO() {
  const d = new Date()
  const pad = (v) => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
