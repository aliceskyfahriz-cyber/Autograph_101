<script setup>
import { reactive, watch, computed } from 'vue'
import { state } from '../store.js'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/seed.js'
import { todayISO } from '../utils/format.js'

const props = defineProps({ editing: { type: Object, default: null } })
const emit = defineEmits(['close', 'save', 'remove'])

const form = reactive({
  type: 'expense',
  amount: '',
  category: EXPENSE_CATEGORIES[0],
  walletId: state.wallets[0]?.id || '',
  date: todayISO(),
  note: ''
})

watch(
  () => props.editing,
  (tx) => {
    if (tx) {
      Object.assign(form, {
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        walletId: tx.walletId,
        date: tx.date,
        note: tx.note || ''
      })
    }
  },
  { immediate: true }
)

const categories = computed(() => (form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES))

watch(
  () => form.type,
  () => {
    if (!categories.value.includes(form.category)) form.category = categories.value[0]
  }
)

function submit() {
  const amount = Number(form.amount)
  if (!amount || amount <= 0) return
  emit('save', { ...form, amount })
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-head">
        <h3>{{ editing ? 'Ubah Transaksi' : 'Tambah Transaksi' }}</h3>
        <button class="btn-ghost" @click="emit('close')">✕</button>
      </div>

      <div class="type-toggle">
        <button :class="{ active: form.type === 'expense' }" @click="form.type = 'expense'">Pengeluaran</button>
        <button :class="{ active: form.type === 'income' }" @click="form.type = 'income'">Pemasukan</button>
      </div>

      <label>
        Nominal (Rp)
        <input v-model.number="form.amount" type="number" min="0" inputmode="numeric" placeholder="0" />
      </label>
      <label>
        Kategori
        <select v-model="form.category">
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>
      <label>
        Dompet
        <select v-model="form.walletId">
          <option v-for="w in state.wallets" :key="w.id" :value="w.id">{{ w.name }}</option>
        </select>
      </label>
      <label>
        Tanggal
        <input v-model="form.date" type="date" />
      </label>
      <label>
        Catatan
        <input v-model="form.note" type="text" placeholder="cth: makan siang, bensin, gaji..." />
      </label>

      <div class="modal-actions">
        <button v-if="editing" class="btn-danger" @click="emit('remove', editing.id)">Hapus</button>
        <span class="spacer"></span>
        <button class="btn-ghost" @click="emit('close')">Batal</button>
        <button class="btn-accent" @click="submit">Simpan</button>
      </div>
    </div>
  </div>
</template>
