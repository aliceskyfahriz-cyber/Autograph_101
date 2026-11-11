<script setup>
import { computed, ref, watch } from 'vue'
const p = defineProps({ jobs: Array, masterJobs: Array, technicians: Array, currentUserId: String })
const emit = defineEmits(['add-job', 'remove-job'])
const today = () => new Date().toISOString().slice(0, 10)
const form = ref({ date: today(), ticketNumber: '', serviceId: '', segment: '', typeId: '', partnerId: '' })
const search = ref('')
const segmentOptions = ['B2C', 'B2B', 'EXBISS']
const availableJobs = computed(() => p.masterJobs.filter(m => m.segment === form.value.segment))
watch(() => form.value.segment, () => { form.value.typeId = '' })
const selectedMaster = computed(() => p.masterJobs.find(m => m.id === Number(form.value.typeId)))
const filtered = computed(() => p.jobs.filter(j => {
  const q = search.value.toLowerCase()
  return [j.ticketNumber, j.serviceId, j.segment, j.master?.name, j.master?.code, j.date, j.partnerName].some(v => String(v || '').toLowerCase().includes(q))
}))
function submit() {
  if (!form.value.date || !form.value.ticketNumber.trim() || !form.value.serviceId.trim() || !form.value.segment || !form.value.typeId) return
  if (!selectedMaster.value || selectedMaster.value.segment !== form.value.segment) return
  emit('add-job', { ...form.value, typeId: Number(form.value.typeId), qty: 1, partnerId: form.value.partnerId || '' })
  form.value = { date: today(), ticketNumber: '', serviceId: '', segment: '', typeId: '', partnerId: '' }
}
</script>
<template>
  <section class="page-head"><div><span class="eyebrow">INPUT DATA</span><h1>Pekerjaan Teknisi</h1><p>Catat satu tiket dan satu Service ID untuk setiap pekerjaan. Poin dihitung otomatis sesuai segment, jenis pekerjaan, dan pembagian partner.</p></div></section>
  <div class="content-grid">
    <section class="panel">
      <div class="panel-head"><div><span class="eyebrow">TRANSAKSI</span><h2>Tambah Pekerjaan</h2></div></div>
      <form @submit.prevent="submit" class="form-grid">
        <label>Tanggal<input v-model="form.date" type="date" required></label>
        <label>Nomor tiket<input v-model.trim="form.ticketNumber" placeholder="Contoh: INC-2026-001" required maxlength="80"></label>
        <label>Service ID<input v-model.trim="form.serviceId" placeholder="Masukkan Service ID" required maxlength="80"></label>
        <label>Segment<select v-model="form.segment" required><option value="">Pilih segment</option><option v-for="segment in segmentOptions" :key="segment" :value="segment">{{ segment }}</option></select></label>
        <label>Jenis pekerjaan<select v-model="form.typeId" required :disabled="!form.segment"><option value="">{{ form.segment ? 'Pilih jenis pekerjaan' : 'Pilih segment terlebih dahulu' }}</option><option v-for="m in availableJobs" :key="m.id" :value="m.id">{{m.name}} ({{m.points}} poin)</option></select></label>
        <label>Partner kerja <span class="muted-inline">(opsional)</span><select v-model="form.partnerId"><option value="">Kerja sendiri — poin penuh</option><option v-for="t in technicians" :key="t.id" :value="t.id">{{t.name}} ({{t.code || t.username}})</option></select></label>
        <div class="note-box full">ℹ️ <template v-if="selectedMaster">{{selectedMaster.name}} bernilai {{selectedMaster.points}} poin dasar.</template><template v-else>Pilih segment dan jenis pekerjaan untuk melihat bobot poin.</template> {{form.partnerId ? 'Pekerjaan bersama satu partner membagi poin menjadi dua dan dicatat untuk kedua teknisi.' : 'Pekerjaan mandiri mendapatkan poin penuh.'}} Satu tiket dan Service ID hanya dapat dicatat satu kali.</div>
        <button class="btn-primary full">＋ Simpan Pekerjaan</button>
      </form>
    </section>
    <section class="panel">
      <div class="panel-head"><div><span class="eyebrow">HISTORY</span><h2>Riwayat</h2></div><input class="search" v-model="search" placeholder="Cari tiket, ID, segment..."></div>
      <div class="table-wrap"><table><thead><tr><th>Tanggal</th><th>Tiket / Service ID</th><th>Segment</th><th>Pekerjaan</th><th>Partner</th><th>Poin dasar</th><th>Poin diterima</th><th></th></tr></thead><tbody>
        <tr v-for="j in filtered" :key="j.id"><td>{{j.date}}</td><td><b>{{j.ticketNumber || '-'}}</b><small class="block">{{j.serviceId || '-'}}</small></td><td>{{j.segment || j.master?.segment || '-'}}</td><td><b>{{j.master?.name || 'Jenis dihapus'}}</b><small class="block">{{j.master?.code}}</small></td><td>{{j.partnerName || (j.partnerId ? 'Partner' : 'Mandiri')}}</td><td>{{j.points}}</td><td><b class="neon">+{{Number(j.total).toLocaleString('id-ID')}}</b></td><td><button class="danger-icon" title="Hapus pekerjaan" @click="emit('remove-job',j.id)">×</button></td></tr>
        <tr v-if="!filtered.length"><td colspan="8" class="empty">Belum ada data.</td></tr>
      </tbody></table></div>
    </section>
  </div>
</template>
