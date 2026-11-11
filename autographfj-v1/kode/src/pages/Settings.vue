<script setup>
import { reactive, ref } from 'vue'
const p = defineProps({ profile: Object, target: Number, canManageTarget: Boolean, canReset: Boolean })
const emit = defineEmits(['save', 'reset', 'change-password'])
const form = reactive({ target: p.target, profile: { ...p.profile } })
function save() { emit('save', form) }
const pw = ref({ oldPassword: '', newPassword: '' })
function savePassword() {
  if (!pw.value.oldPassword || !pw.value.newPassword) return
  emit('change-password', { ...pw.value })
  pw.value = { oldPassword: '', newPassword: '' }
}
</script>
<template>
  <section class="page-head">
    <div><span class="eyebrow">SYSTEM</span><h1>Pengaturan</h1><p>Atur profil teknisi dan target periode.</p></div>
  </section>
  <div class="content-grid">
    <section class="panel">
      <div class="panel-head"><div><span class="eyebrow">PROFILE</span><h2>Profil Teknisi</h2></div></div>
      <div class="form-grid">
        <label>Nama<input v-model="form.profile.name"></label>
        <label>Kode teknisi<input v-model="form.profile.code"></label>
        <label>Tim/Area<input v-model="form.profile.team"></label>
        <label v-if="canManageTarget">Target poin<input v-model.number="form.target" type="number" min="0"></label>
      </div>
      <button class="btn-primary" @click="save">Simpan Pengaturan</button>
    </section>
    <section v-if="canReset" class="panel danger-panel">
      <div class="panel-head"><div><span class="eyebrow">DEMO DATA</span><h2>Reset Prototype</h2></div></div>
      <p>Semua data kembali ke data demo awal.</p>
      <button class="btn-danger" @click="emit('reset')">Reset Data Demo</button>
    </section>
  </div>
  <section class="panel">
    <div class="panel-head"><div><span class="eyebrow">KEAMANAN</span><h2>Ganti Password Saya</h2></div></div>
    <div class="form-grid">
      <label>Password lama<input v-model="pw.oldPassword" type="password" autocomplete="current-password"></label>
      <label>Password baru<input v-model="pw.newPassword" type="password" autocomplete="new-password"></label>
    </div>
    <button class="btn-primary" @click="savePassword">Ganti Password</button>
  </section>
</template>
