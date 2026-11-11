<script setup>
import { computed } from 'vue'
const p = defineProps({ activePage: String, mobileOpen: Boolean, isAdmin: Boolean })
defineEmits(['navigate', 'logout'])
const menus = computed(() => {
  const base = [['dashboard', '⌂', 'Dashboard'], ['jobs', '＋', 'Input Pekerjaan'], ['reports', '▤', 'Laporan'], ['settings', '⚙', 'Pengaturan']]
  return p.isAdmin ? [base[0], ['admin', '🛡', 'Kelola Teknisi'], base[1], ['master', '▦', 'Master Pekerjaan'], ...base.slice(2)] : base
})
</script>
<template>
  <aside :class="['sidebar', { open: mobileOpen }]">
    <div class="brand">
      <div class="brand-mark">TP</div>
      <div><strong>Technician Point</strong><small>Monitoring</small></div>
    </div>
    <div class="side-label">MENU UTAMA</div>
    <nav>
      <button v-for="m in menus" :key="m[0]" :class="{ active: activePage === m[0] }" @click="$emit('navigate', m[0])"><span class="nav-icon">{{ m[1] }}</span>{{ m[2] }}</button>
    </nav>
    <div class="side-info">
      <span class="status-dot"></span>
      <div v-if="isAdmin"><b>Mode Admin</b><small>Kuasa penuh semua teknisi</small></div>
      <div v-else><b>Mode Prototype</b><small>Data tersimpan lokal</small></div>
    </div>
    <button class="logout-side" @click="$emit('logout')">↪ &nbsp; Keluar</button>
  </aside>
</template>
