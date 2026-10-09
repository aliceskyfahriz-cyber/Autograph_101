// State Kontruang — tersimpan di localStorage browser (fase pribadi).
// Struktur data sengaja dibuat per-pengguna (wallets/transactions/budgets/bills)
// supaya nanti mudah dipindah ke backend + akun saat fase publik.
import { reactive, watch } from 'vue'
import { buildSeed } from './data/seed.js'
import { uid, monthKey } from './utils/format.js'

const STORAGE_KEY = 'kontruang-data-v1'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.transactions)) return parsed
    }
  } catch (e) {
    /* abaikan, pakai data contoh */
  }
  return buildSeed()
}

export const state = reactive(load())

watch(
  state,
  () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      /* storage penuh / privat */
    }
  },
  { deep: true }
)

// ---------- Transaksi ----------
export function addTransaction(data) {
  state.transactions.unshift({ id: uid(), ...data })
  state.transactions.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function updateTransaction(id, data) {
  const i = state.transactions.findIndex((t) => t.id === id)
  if (i >= 0) state.transactions[i] = { ...state.transactions[i], ...data }
  state.transactions.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function removeTransaction(id) {
  state.transactions = state.transactions.filter((t) => t.id !== id)
}

// ---------- Hitungan ----------
export function walletBalance(wallet) {
  const fromTx = state.transactions
    .filter((t) => t.walletId === wallet.id)
    .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
  return wallet.initialBalance + fromTx
}

export function totalsForMonth(key) {
  const list = state.transactions.filter((t) => monthKey(t.date) === key)
  const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  return { income, expense, balance: income - expense }
}

export function spentForCategory(category, key) {
  return state.transactions
    .filter((t) => t.type === 'expense' && t.category === category && monthKey(t.date) === key)
    .reduce((s, t) => s + t.amount, 0)
}

// ---------- Tagihan ----------
export function payBill(bill) {
  if (bill.paidThisMonth) return
  bill.paidThisMonth = true
  addTransaction({
    date: new Date().toISOString().slice(0, 10),
    type: 'expense',
    category: 'Tagihan',
    amount: bill.amount,
    walletId: bill.walletId,
    note: `Bayar ${bill.name}`
  })
}

// ---------- Data ----------
export function resetToSeed() {
  const fresh = buildSeed()
  state.wallets = fresh.wallets
  state.transactions = fresh.transactions
  state.budgets = fresh.budgets
  state.bills = fresh.bills
}

export function clearAllData() {
  state.transactions = []
  state.budgets = []
  state.bills = []
  state.wallets = state.wallets.map((w) => ({ ...w, initialBalance: 0 }))
}
