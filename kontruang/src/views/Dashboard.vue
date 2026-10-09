<script setup>
import { computed } from 'vue'
import { state, totalsForMonth, walletBalance, spentForCategory, payBill } from '../store.js'
import { formatRupiah, formatTanggal, monthKey, monthLabel } from '../utils/format.js'
import ChartBars from '../components/ChartBars.vue'

const emit = defineEmits(['add', 'edit', 'goto'])

const currentKey = monthKey(new Date())
const totals = computed(() => totalsForMonth(currentKey))
const totalBalance = computed(() => state.wallets.reduce((s, w) => s + walletBalance(w), 0))
const recent = computed(() => state.transactions.slice(0, 6))

const chartData = computed(() => {
  const out = []
  const now = new Date()
  for (let n = 5; n >= 0; n--) {
    const d = new Date(now.getFullYear(), now.getMonth() - n, 1)
    const t = totalsForMonth(monthKey(d))
    out.push({
      label: d.toLocaleDateString('id-ID', { month: 'short' }),
      income: t.income,
      expense: t.expense
    })
  }
  return out
})

const expenseRatio = computed(() =>
  totals.value.income > 0 ? Math.min(100, Math.round((totals.value.expense / totals.value.income) * 100)) : 0
)

const upcomingBills = computed(() =>
  [...state.bills].sort((a, b) => Number(a.paidThisMonth) - Number(b.paidThisMonth) || a.dueDay - b.dueDay)
)

const tightBudgets = computed(() =>
  state.budgets
    .map((b) => ({ ...b, spent: spentForCategory(b.category, currentKey) }))
    .map((b) => ({ ...b, pct: b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0 }))
    .filter((b) => b.pct >= 70)
    .sort((a, b) => b.pct - a.pct)
)

const walletName = (id) => state.wallets.find((w) => w.id === id)?.name || '-'
</script>

<template>
  <section>
    <div class="page-head">
      <div>
        <h2>Dashboard</h2>
        <p class="muted">Ringkasan uangmu — {{ monthLabel(currentKey) }}</p>
      </div>
      <button class="btn-accent" @click="emit('add')">+ Tambah Transaksi</button>
    </div>

    <div class="card hero">
      <span class="muted">Total Saldo Semua Dompet</span>
      <div class="hero-amount">{{ formatRupiah(totalBalance) }}</div>
      <div class="hero-row">
        <div>
          <span class="muted">Pemasukan bulan ini</span>
          <strong class="txt-in">{{ formatRupiah(totals.income) }}</strong>
        </div>
        <div>
          <span class="muted">Pengeluaran bulan ini</span>
          <strong>{{ formatRupiah(totals.expense) }}</strong>
        </div>
        <div>
          <span class="muted">Sisa bulan ini</span>
          <strong :class="{ 'txt-in': totals.balance >= 0 }">{{ formatRupiah(totals.balance) }}</strong>
        </div>
      </div>
      <div class="ratio">
        <div class="ratio-bar" :style="{ width: expenseRatio + '%' }"></div>
      </div>
      <span class="muted small">Pengeluaran memakai {{ expenseRatio }}% dari pemasukan bulan ini</span>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>Pemasukan vs Pengeluaran — 6 Bulan Terakhir</h3>
        <ChartBars :data="chartData" />
      </div>

      <div class="card">
        <div class="card-head">
          <h3>Dompet Saya</h3>
          <button class="btn-ghost" @click="emit('goto', 'dompet')">Lihat semua</button>
        </div>
        <ul class="list">
          <li v-for="w in state.wallets" :key="w.id">
            <div>
              <strong>{{ w.name }}</strong>
              <span class="muted small block">{{ w.note }}</span>
            </div>
            <strong>{{ formatRupiah(walletBalance(w)) }}</strong>
          </li>
        </ul>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head">
          <h3>Transaksi Terakhir</h3>
          <button class="btn-ghost" @click="emit('goto', 'transaksi')">Lihat semua</button>
        </div>
        <ul class="list">
          <li v-for="t in recent" :key="t.id" class="clickable" @click="emit('edit', t)">
            <div>
              <strong>{{ t.note || t.category }}</strong>
              <span class="muted small block">{{ t.category }} · {{ walletName(t.walletId) }} · {{ formatTanggal(t.date) }}</span>
            </div>
            <strong :class="t.type === 'income' ? 'txt-in' : ''">
              {{ t.type === 'income' ? '+' : '−' }}{{ formatRupiah(t.amount) }}
            </strong>
          </li>
          <li v-if="!recent.length" class="muted">Belum ada transaksi.</li>
        </ul>
      </div>

      <div>
        <div class="card">
          <h3>Tagihan Bulan Ini</h3>
          <ul class="list">
            <li v-for="b in upcomingBills" :key="b.id">
              <div>
                <strong>{{ b.name }}</strong>
                <span class="muted small block">Jatuh tempo tgl {{ b.dueDay }} · {{ b.recurring }}</span>
              </div>
              <div class="bill-side">
                <strong>{{ formatRupiah(b.amount) }}</strong>
                <button v-if="!b.paidThisMonth" class="btn-mini" @click="payBill(b)">Bayar</button>
                <span v-else class="badge">Lunas</span>
              </div>
            </li>
            <li v-if="!upcomingBills.length" class="muted">Tidak ada tagihan.</li>
          </ul>
        </div>

        <div v-if="tightBudgets.length" class="card warn">
          <h3>Anggaran Hampir Habis</h3>
          <ul class="list">
            <li v-for="b in tightBudgets" :key="b.id">
              <div>
                <strong>{{ b.category }}</strong>
                <span class="muted small block">{{ formatRupiah(b.spent) }} dari {{ formatRupiah(b.limit) }}</span>
              </div>
              <strong class="txt-glow">{{ b.pct }}%</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
