<script setup>
import { ref } from 'vue'
import Dashboard from './views/Dashboard.vue'
import Transactions from './views/Transactions.vue'
import Budgets from './views/Budgets.vue'
import Wallets from './views/Wallets.vue'
import Reports from './views/Reports.vue'
import TransactionModal from './components/TransactionModal.vue'
import { addTransaction, updateTransaction, removeTransaction } from './store.js'

const page = ref('dashboard')
const modalOpen = ref(false)
const editing = ref(null)

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'transaksi', label: 'Transaksi', icon: '⇅' },
  { id: 'anggaran', label: 'Anggaran', icon: '◎' },
  { id: 'dompet', label: 'Dompet', icon: '▤' },
  { id: 'laporan', label: 'Laporan', icon: '▥' }
]

function openAdd() {
  editing.value = null
  modalOpen.value = true
}

function openEdit(tx) {
  editing.value = tx
  modalOpen.value = true
}

function handleSave(data) {
  if (editing.value) updateTransaction(editing.value.id, data)
  else addTransaction(data)
  modalOpen.value = false
  editing.value = null
}

function handleRemove(id) {
  removeTransaction(id)
  modalOpen.value = false
  editing.value = null
}
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">K</span>
        <div>
          <strong>KONTRUANG</strong>
          <span class="muted small block">kontrol uang</span>
        </div>
      </div>
      <nav>
        <button
          v-for="n in NAV"
          :key="n.id"
          :class="{ active: page === n.id }"
          @click="page = n.id"
        >
          <span class="nav-icon">{{ n.icon }}</span> {{ n.label }}
        </button>
      </nav>
      <p class="muted small side-note">Fase 1 — Website (pribadi)<br />Fase 2 — Aplikasi mobile</p>
    </aside>

    <main class="content">
      <Dashboard v-if="page === 'dashboard'" @add="openAdd" @edit="openEdit" @goto="page = $event" />
      <Transactions v-else-if="page === 'transaksi'" @add="openAdd" @edit="openEdit" />
      <Budgets v-else-if="page === 'anggaran'" />
      <Wallets v-else-if="page === 'dompet'" />
      <Reports v-else-if="page === 'laporan'" />

      <footer class="footer muted small">
        Kontruang v0.1 — prototype. Data tersimpan lokal di browser (localStorage). Angka bertanda "(contoh)" adalah data demo.
      </footer>
    </main>

    <nav class="bottomnav">
      <button
        v-for="n in NAV"
        :key="n.id"
        :class="{ active: page === n.id }"
        @click="page = n.id"
      >
        <span class="nav-icon">{{ n.icon }}</span>
        <span>{{ n.label }}</span>
      </button>
    </nav>

    <TransactionModal
      v-if="modalOpen"
      :editing="editing"
      @close="modalOpen = false"
      @save="handleSave"
      @remove="handleRemove"
    />
  </div>
</template>
