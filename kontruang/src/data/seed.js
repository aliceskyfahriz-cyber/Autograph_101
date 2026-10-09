// Data contoh (DEMO) untuk tampilan awal Kontruang.
// Semua angka di file ini ilustrasi — bukan data keuangan asli.
// Data bisa direset / dihapus dari menu Laporan > Pengaturan Data.

function iso(y, m, d) {
  const pad = (v) => String(v).padStart(2, '0')
  return `${y}-${pad(m + 1)}-${pad(d)}`
}

export const EXPENSE_CATEGORIES = [
  'Makan & Minum',
  'Transportasi',
  'Belanja',
  'Tagihan',
  'Hiburan',
  'Kesehatan',
  'Pendidikan',
  'Lainnya'
]

export const INCOME_CATEGORIES = ['Gaji', 'Usaha', 'Investasi', 'Bonus', 'Lainnya']

export function buildSeed() {
  const now = new Date()
  const Y = now.getFullYear()
  const M = now.getMonth()
  const prev = (n) => {
    const d = new Date(Y, M - n, 1)
    return { y: d.getFullYear(), m: d.getMonth() }
  }

  const wallets = [
    { id: 'tunai', name: 'Tunai', note: 'Uang cash di dompet', initialBalance: 2500000 },
    { id: 'bank', name: 'Rekening Bank', note: 'Rekening utama', initialBalance: 7500000 },
    { id: 'ewallet', name: 'E-Wallet', note: 'Saldo dompet digital', initialBalance: 4200000 },
    { id: 'tabungan', name: 'Tabungan', note: 'Dana cadangan', initialBalance: 12000000 }
  ]

  let seq = 0
  const tx = (y, m, d, type, category, amount, walletId, note) => ({
    id: `seed-${++seq}`,
    date: iso(y, m, d),
    type,
    category,
    amount,
    walletId,
    note
  })

  const transactions = []

  // 5 bulan sebelumnya: pola gaji + pengeluaran rutin (untuk grafik 6 bulan)
  for (let n = 5; n >= 1; n--) {
    const { y, m } = prev(n)
    transactions.push(tx(y, m, 1, 'income', 'Gaji', 8500000, 'bank', 'Gaji bulanan (contoh)'))
    transactions.push(tx(y, m, 3, 'expense', 'Belanja', 1450000, 'bank', 'Belanja bulanan (contoh)'))
    transactions.push(tx(y, m, 8, 'expense', 'Makan & Minum', 480000, 'ewallet', 'Makan sebulan (contoh)'))
    transactions.push(tx(y, m, 12, 'expense', 'Transportasi', 320000, 'tunai', 'Bensin & parkir (contoh)'))
    transactions.push(tx(y, m, 15, 'expense', 'Tagihan', 785000, 'bank', 'Listrik + internet (contoh)'))
    transactions.push(tx(y, m, 21, 'expense', 'Hiburan', 200000, 'ewallet', 'Hiburan (contoh)'))
  }

  // Bulan berjalan
  transactions.push(tx(Y, M, 1, 'income', 'Gaji', 8500000, 'bank', 'Gaji bulanan (contoh)'))
  transactions.push(tx(Y, M, 2, 'expense', 'Belanja', 532000, 'bank', 'Belanja kebutuhan rumah (contoh)'))
  transactions.push(tx(Y, M, 3, 'expense', 'Makan & Minum', 75000, 'ewallet', 'Makan siang (contoh)'))
  transactions.push(tx(Y, M, 4, 'expense', 'Transportasi', 100000, 'tunai', 'Bensin motor (contoh)'))
  transactions.push(tx(Y, M, 5, 'income', 'Investasi', 235000, 'bank', 'Hasil investasi (contoh)'))
  transactions.push(tx(Y, M, 5, 'expense', 'Hiburan', 149000, 'ewallet', 'Langganan streaming (contoh)'))
  transactions.push(tx(Y, M, 6, 'expense', 'Makan & Minum', 118000, 'tunai', 'Kopi & jajan (contoh)'))
  transactions.sort((a, b) => (a.date < b.date ? 1 : -1))

  const budgets = [
    { id: 'b-makan', category: 'Makan & Minum', limit: 1500000 },
    { id: 'b-transport', category: 'Transportasi', limit: 800000 },
    { id: 'b-belanja', category: 'Belanja', limit: 2000000 },
    { id: 'b-tagihan', category: 'Tagihan', limit: 1200000 },
    { id: 'b-hiburan', category: 'Hiburan', limit: 500000 }
  ]

  const bills = [
    { id: 'bill-internet', name: 'Internet rumah', amount: 315000, dueDay: 15, walletId: 'bank', recurring: 'Bulanan', paidThisMonth: false },
    { id: 'bill-listrik', name: 'Listrik (PLN)', amount: 470000, dueDay: 20, walletId: 'bank', recurring: 'Bulanan', paidThisMonth: false },
    { id: 'bill-air', name: 'Air (PDAM)', amount: 95000, dueDay: 25, walletId: 'tunai', recurring: 'Bulanan', paidThisMonth: true }
  ]

  return { wallets, transactions, budgets, bills }
}
