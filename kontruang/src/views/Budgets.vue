<script setup>
import { ref, computed } from 'vue'
import { state, spentForCategory } from '../store.js'
import { formatRupiah, monthKey, monthLabel, uid } from '../utils/format.js'
import { EXPENSE_CATEGORIES } from '../data/seed.js'

const currentKey = monthKey(new Date())

const rows = computed(() =>
  state.budgets.map((b) => {
    const spent = spentForCategory(b.category, currentKey)
    return { ...b, spent, left: b.limit - spent, pct: b.limit > 0 ? Math.min(100, Math.round((spent / b.limit) * 100)) : 0, rawPct: b.limit > 0 ? (spent / b.limit) * 100 : 0 }
  })
)

const newCategory = ref(EXPENSE_CATEGORIES[0])
const newLimit = ref('')

function addBudget() {
  const limit = Number(newLimit.value)
  if (!limit || limit <= 0) return
  if (state.budgets.some((b) => b.category === newCategory.value)) return
  state.budgets.push({ id: uid(), category: newCategory.value, limit })
  newLimit.value = ''
}

function removeBudget(id) {
  state.budgets = state.budgets.filter((b) => b.id !== id)
}

function updateLimit(id, value) {
  const b = state.budgets.find((x) => x.id === id)
  if (b) b.limit = Number(value) || 0
}
</script>

<template>
  <section>
    <div class="page-head">
      <div>
        <h2>Anggaran</h2>
        <p class="muted">Batas pengeluaran per kategori — {{ monthLabel(currentKey) }}</p>
      </div>
    </div>

    <div class="grid-2">
      <div v-for="b in rows" :key="b.id" class="card">
        <div class="card-head">
          <h3>{{ b.category }}</h3>
          <button class="btn-ghost" @click="removeBudget(b.id)">Hapus</button>
        </div>
        <div class="budget-nums">
          <strong>{{ formatRupiah(b.spent) }}</strong>
          <span class="muted"> dari {{ formatRupiah(b.limit) }}</span>
        </div>
        <div class="ratio" :class="{ over: b.rawPct > 100 }">
          <div class="ratio-bar" :style="{ width: b.pct + '%' }"></div>
        </div>
        <span class="muted small" v-if="b.rawPct <= 100">Terpakai {{ Math.round(b.rawPct) }}% · sisa {{ formatRupiah(b.left) }}</span>
        <span class="small txt-glow" v-else>Lewat anggaran {{ formatRupiah(-b.left) }}!</span>
        <label class="budget-edit">
          Ubah batas (Rp)
          <input type="number" min="0" :value="b.limit" @change="updateLimit(b.id, $event.target.value)" />
        </label>
      </div>
      <p v-if="!rows.length" class="muted">Belum ada anggaran. Tambahkan di bawah.</p>
    </div>

    <div class="card">
      <h3>Tambah Anggaran</h3>
      <div class="inline-form">
        <select v-model="newCategory">
          <option v-for="c in EXPENSE_CATEGORIES" :key="c" :value="c">{{ c }}</option>
        </select>
        <input v-model.number="newLimit" type="number" min="0" placeholder="Batas per bulan (Rp)" />
        <button class="btn-accent" @click="addBudget">Tambah</button>
      </div>
    </div>
  </section>
</template>
