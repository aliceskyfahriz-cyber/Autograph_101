<script setup>
import { ref } from 'vue'
defineProps({ error: String })
const emit = defineEmits(['login'])
const email = ref('')
const password = ref('')
function submit() { emit('login', { email: email.value, password: password.value }) }
</script>
<template>
  <div class="login-page">
    <div class="login-grid"></div>
    <div class="login-card">
      <div class="login-logo">TP</div>
      <span class="eyebrow">TECHNICIAN POINT MONITORING</span>
      <h1>Technician<br><em>Point Monitoring</em></h1>
      <p>Masuk menggunakan email dan password akun Anda. Hak akses Admin atau Teknisi mengikuti profil akun yang terdaftar.</p>
      <form @submit.prevent="submit">
        <label>Email</label>
        <input v-model="email" type="email" placeholder="nama@contoh.com" autocomplete="email" required>
        <label>Password</label>
        <input v-model="password" type="password" placeholder="Masukkan password" autocomplete="current-password" required>
        <div v-if="error" class="login-error">{{ error }}</div>
        <button class="btn-primary" type="submit">Masuk ke Dashboard <span>→</span></button>
      </form>
      <div class="login-accounts">
        <small>Gunakan email dan password yang didaftarkan pada Supabase Authentication. Jika gagal masuk, pastikan profil akun tersedia di tabel <code>profiles</code>.</small>
      </div>
      <small class="demo-note">Technician Point Monitoring • Login Supabase</small>
    </div>
  </div>
</template>
