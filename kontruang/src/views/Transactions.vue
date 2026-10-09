<script setup>
import { ref, computed } from 'vue'
import { state } from '../store.js'
import { formatRupiah, formatTanggal, monthKey, monthLabel } from '../utils/format.js'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/seed.js'

const emit = defineEmits(['add', 'edit'])

const search = ref('')
const typeFilter = ref('all')
const monthFilter = ref(monthKey(new Date()))

const months = computed(() => {
  const set = new Set(state.transactions.map((t) => monthKey(t.date)))
  set.add(monthKey(new Date()))
  return [...set].sort().reverse()
})

const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]

const filtered = computed(() =>
  state.transactions.filter((t) => {
    if (monthFilter.value !== 'all' && monthKey(t.date) !== monthFilter.value) return false
    if (typeFilter.value !== 'all' && t.type !== typeFilter.value) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      const hay = `${t.note || ''} ${t.category}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
)

const sumIn = computed(() => filtered.value.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0))
const sumOut = computed(() => filtered.value.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0))

const walletName = (id) => state.wallets.find((w) => w.id === id)?.name || '-'
</script>

<template>
  <section>
    <div class="page-head">
      <div>
        <h2>Transaksi</h2>
        <p class="muted">Semua uang masuk & keluar. Klik transaksi untuk mengubah / menghapus.</p>
      </div>
      <button class="btn-accent" @click="emit('add')">+ Tambah</button>
    </div>

    <div class="card filters">
      <input v-model="search" type="search" placeholder="Cari catatan / kategori..." />
      <select v-model="typeFilter">
        <option value="all">Semua jenis</option>
        <option value="income">Pemasukan</option>
        <option value="expense">Pengeluaran</option>
      </select>
      <select v-model="monthFilter">
        <option value="all">Semua bulan</option>
        <option v-for="m in months" :key="m" :value="m">{{ monthLabel(m) }}</option>
      </select>
    </div>

    <div class="summary-strip">
      <span>Masuk: <strong class="txt-in">{{ formatRupiah(sumIn) }}</strong></span>
      <span>Keluar: <strong>{{ formatRupiah(sumOut) }}</strong></span>
      <span>Selisih: <strong :class="{ 'txt-in': sumIn - sumOut >= 0 }">{{ formatRupiah(sumIn - sumOut) }}</strong></span>
      <span class="muted">{{ filtered.length }} transaksi</span>
    </div>

    <div class="card">
      <ul class="list">
        <li v-for="t in filtered" :key="t.id" class="clickable" @click="emit('edit', t)">
          <div>
            <strong>{{ t.note || t.category }}</strong>
            <span class="muted small block">{{ t.category }} · {{ walletName(t.walletId) }} · {{ formatTanggal(t.date) }}</span>
          </div>
          <strong :class="t.type === 'income' ? 'txt-in' : ''">
            {{ t.type === 'income' ? '+' : '−' }}{{ formatRupiah(t.amount) }}
          </strong>
        </li>
        <li v-if="!filtered.length" class="muted">Tidak ada transaksi yang cocok.</li>
      </ul>
    </div>
  </section>
</template>
