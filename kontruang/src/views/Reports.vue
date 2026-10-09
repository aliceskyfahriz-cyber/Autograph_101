<script setup>
import { ref, computed } from 'vue'
import { state, totalsForMonth, resetToSeed, clearAllData } from '../store.js'
import { formatRupiah, monthKey, monthLabel } from '../utils/format.js'
import ChartBars from '../components/ChartBars.vue'

const selectedMonth = ref(monthKey(new Date()))

const months = computed(() => {
  const set = new Set(state.transactions.map((t) => monthKey(t.date)))
  set.add(monthKey(new Date()))
  return [...set].sort().reverse()
})

const totals = computed(() => totalsForMonth(selectedMonth.value))

const byCategory = computed(() => {
  const map = new Map()
  state.transactions
    .filter((t) => t.type === 'expense' && monthKey(t.date) === selectedMonth.value)
    .forEach((t) => map.set(t.category, (map.get(t.category) || 0) + t.amount))
  const total = [...map.values()].reduce((s, v) => s + v, 0) || 1
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount, pct: Math.round((amount / total) * 100) }))
    .sort((a, b) => b.amount - a.amount)
})

const chartData = computed(() => {
  const out = []
  const now = new Date()
  for (let n = 5; n >= 0; n--) {
    const d = new Date(now.getFullYear(), now.getMonth() - n, 1)
    const t = totalsForMonth(monthKey(d))
    out.push({ label: d.toLocaleDateString('id-ID', { month: 'short' }), income: t.income, expense: t.expense })
  }
  return out
})

function handleClear() {
  if (window.confirm('Hapus semua transaksi, anggaran, dan tagihan?')) clearAllData()
}

function exportCSV() {
  const rows = [['Tanggal', 'Jenis', 'Kategori', 'Dompet', 'Catatan', 'Nominal']]
  const walletName = (id) => state.wallets.find((w) => w.id === id)?.name || ''
  const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`
  state.transactions.forEach((t) =>
    rows.push([t.date, t.type === 'income' ? 'Pemasukan' : 'Pengeluaran', t.category, walletName(t.walletId), t.note || '', t.amount])
  )
  const csv = rows.map((r) => r.map(esc).join(';')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'kontruang-transaksi.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <section>
    <div class="page-head">
      <div>
        <h2>Laporan</h2>
        <p class="muted">Ke mana uang pergi, dan dari mana datangnya.</p>
      </div>
      <button class="btn-accent" @click="exportCSV">Ekspor CSV</button>
    </div>

    <div class="card filters">
      <select v-model="selectedMonth">
        <option v-for="m in months" :key="m" :value="m">{{ monthLabel(m) }}</option>
      </select>
      <span class="muted">
        Masuk <strong class="txt-in">{{ formatRupiah(totals.income) }}</strong> ·
        Keluar <strong>{{ formatRupiah(totals.expense) }}</strong> ·
        Selisih <strong :class="{ 'txt-in': totals.balance >= 0 }">{{ formatRupiah(totals.balance) }}</strong>
      </span>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>Pengeluaran per Kategori — {{ monthLabel(selectedMonth) }}</h3>
        <ul class="list cat-list">
          <li v-for="c in byCategory" :key="c.category">
            <div class="cat-row">
              <div>
                <strong>{{ c.category }}</strong>
                <span class="muted small block">{{ c.pct }}% dari total pengeluaran</span>
              </div>
              <strong>{{ formatRupiah(c.amount) }}</strong>
            </div>
            <div class="ratio"><div class="ratio-bar" :style="{ width: c.pct + '%' }"></div></div>
          </li>
          <li v-if="!byCategory.length" class="muted">Tidak ada pengeluaran di bulan ini.</li>
        </ul>
      </div>

      <div class="card">
        <h3>Arus Kas 6 Bulan Terakhir</h3>
        <ChartBars :data="chartData" />
      </div>
    </div>

    <div class="card">
      <h3>Pengaturan Data</h3>
      <p class="muted">
        Data tersimpan lokal di browser ini (localStorage). Data contoh bertanda "(contoh)" hanya untuk tampilan awal —
        hapus semua untuk mulai mencatat uangmu sendiri.
      </p>
      <div class="inline-form">
        <button class="btn-ghost" @click="resetToSeed()">Kembalikan data contoh</button>
        <button class="btn-danger" @click="handleClear">Hapus semua data</button>
      </div>
    </div>
  </section>
</template>
