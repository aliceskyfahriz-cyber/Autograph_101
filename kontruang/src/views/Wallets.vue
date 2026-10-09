<script setup>
import { ref, computed } from 'vue'
import { state, walletBalance, payBill } from '../store.js'
import { formatRupiah, uid } from '../utils/format.js'

const totalBalance = computed(() => state.wallets.reduce((s, w) => s + walletBalance(w), 0))

const newName = ref('')
const newBalance = ref('')

function addWallet() {
  if (!newName.value.trim()) return
  state.wallets.push({
    id: uid(),
    name: newName.value.trim(),
    note: 'Dompet tambahan',
    initialBalance: Number(newBalance.value) || 0
  })
  newName.value = ''
  newBalance.value = ''
}

function removeWallet(w) {
  if (state.transactions.some((t) => t.walletId === w.id)) {
    alert('Dompet ini masih punya transaksi, tidak bisa dihapus.')
    return
  }
  state.wallets = state.wallets.filter((x) => x.id !== w.id)
}

// Form tagihan baru
const billName = ref('')
const billAmount = ref('')
const billDueDay = ref(1)
const showBillForm = ref(false)

function addBill() {
  const amount = Number(billAmount.value)
  if (!billName.value.trim() || !amount) return
  state.bills.push({
    id: uid(),
    name: billName.value.trim(),
    amount,
    dueDay: Math.min(31, Math.max(1, Number(billDueDay.value) || 1)),
    walletId: state.wallets[0]?.id || '',
    recurring: 'Bulanan',
    paidThisMonth: false
  })
  billName.value = ''
  billAmount.value = ''
  showBillForm.value = false
}

function removeBill(id) {
  state.bills = state.bills.filter((b) => b.id !== id)
}

function resetBills() {
  state.bills.forEach((b) => (b.paidThisMonth = false))
}
</script>

<template>
  <section>
    <div class="page-head">
      <div>
        <h2>Dompet & Tagihan</h2>
        <p class="muted">Total saldo: <strong class="txt-glow">{{ formatRupiah(totalBalance) }}</strong></p>
      </div>
    </div>

    <div class="grid-2">
      <div v-for="w in state.wallets" :key="w.id" class="card wallet-card">
        <div class="card-head">
          <h3>{{ w.name }}</h3>
          <button class="btn-ghost" @click="removeWallet(w)">Hapus</button>
        </div>
        <div class="wallet-amount">{{ formatRupiah(walletBalance(w)) }}</div>
        <span class="muted small">{{ w.note }} · saldo awal {{ formatRupiah(w.initialBalance) }}</span>
      </div>
    </div>

    <div class="card">
      <h3>Tambah Dompet</h3>
      <div class="inline-form">
        <input v-model="newName" type="text" placeholder="Nama dompet, cth: Dana Darurat" />
        <input v-model.number="newBalance" type="number" min="0" placeholder="Saldo awal (Rp)" />
        <button class="btn-accent" @click="addWallet">Tambah</button>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Tagihan Berulang</h3>
        <div>
          <button class="btn-ghost" @click="resetBills">Reset bulan baru</button>
          <button class="btn-ghost" @click="showBillForm = !showBillForm">+ Tagihan</button>
        </div>
      </div>
      <div v-if="showBillForm" class="inline-form">
        <input v-model="billName" type="text" placeholder="Nama tagihan" />
        <input v-model.number="billAmount" type="number" min="0" placeholder="Nominal (Rp)" />
        <input v-model.number="billDueDay" type="number" min="1" max="31" placeholder="Tgl tempo" />
        <button class="btn-accent" @click="addBill">Simpan</button>
      </div>
      <ul class="list">
        <li v-for="b in state.bills" :key="b.id">
          <div>
            <strong>{{ b.name }}</strong>
            <span class="muted small block">Tempo tgl {{ b.dueDay }} tiap bulan · {{ b.recurring }}</span>
          </div>
          <div class="bill-side">
            <strong>{{ formatRupiah(b.amount) }}</strong>
            <button v-if="!b.paidThisMonth" class="btn-mini" @click="payBill(b)">Bayar</button>
            <span v-else class="badge">Lunas</span>
            <button class="btn-ghost" @click="removeBill(b.id)">✕</button>
          </div>
        </li>
        <li v-if="!state.bills.length" class="muted">Belum ada tagihan.</li>
      </ul>
      <p class="muted small">Menekan "Bayar" akan mencatat pengeluaran kategori Tagihan secara otomatis.</p>
    </div>
  </section>
</template>
