<script setup>
import { computed, ref } from 'vue'

const p = defineProps({ users: Array, stats: Object, currentUserId: String })
const emit = defineEmits(['add', 'update', 'reset-password', 'toggle-status', 'manage'])

const mode = ref(null) // null | 'add' | 'edit' | 'reset'
const editingId = ref(null)
const form = ref({ email: '', name: '', password: '', target: 1000 })
const newPassword = ref('')

const teknisiCount = computed(() => p.users.filter(u => u.role === 'teknisi').length)
const activeCount = computed(() => p.users.filter(u => u.status === 'active').length)
const suspendedCount = computed(() => p.users.filter(u => u.status === 'suspended').length)
const totalAll = computed(() => Object.values(p.stats || {}).reduce((s, x) => s + (x.total || 0), 0))

function openAdd() {
  mode.value = 'add'
  editingId.value = null
  form.value = { email: '', name: '', password: '', target: 1000 }
}
function openEdit(u) {
  mode.value = 'edit'
  editingId.value = u.id
  form.value = {
    email: u.email || '',
    name: u.name || '',
    password: '',
    target: p.stats?.[u.id]?.target ?? 1000
  }
}
function openReset(u) {
  mode.value = 'reset'
  editingId.value = u.id
  newPassword.value = ''
}
function close() {
  mode.value = null
  editingId.value = null
}

function save() {
  const email = form.value.email.trim().toLowerCase()
  const name = form.value.name.trim()
  const target = Number(form.value.target)

  if (!email || !name) return
  if (!Number.isFinite(target) || target < 0) return
  if (mode.value === 'add') {
    if (form.value.password.length < 8) return
    emit('add', { email, name, password: form.value.password, target })
  } else {
    emit('update', editingId.value, { email, name, target })
  }
  close()
}
function saveReset() {
  if (newPassword.value.length < 8) return
  emit('reset-password', editingId.value, newPassword.value)
  close()
}
</script>

<template>
  <section class="page-head">
    <div>
      <span class="eyebrow">ADMIN</span>
      <h1>Kelola Teknisi</h1>
      <p>Admin dapat menambah akun teknisi, mengubah profil, mereset password, serta menangguhkan atau mengaktifkan akun.</p>
    </div>
    <button class="btn-primary" @click="openAdd">＋ Tambah Akun</button>
  </section>

  <div class="report-cards">
    <div><span>Total akun</span><b>{{ users.length }}</b></div>
    <div><span>Teknisi</span><b>{{ teknisiCount }}</b></div>
    <div><span>Aktif / Disuspend</span><b>{{ activeCount }} / {{ suspendedCount }}</b></div>
    <div><span>Total poin semua teknisi</span><b>{{ totalAll }}</b></div>
  </div>

  <div class="panel">
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Teknisi</th><th>Email</th><th>Role</th><th>Status</th><th>Qty</th><th>Total Poin</th><th>Target</th><th>Aksi</th></tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td><b>{{ u.name }}</b><small class="block">{{ u.id === currentUserId ? '(Anda)' : '' }}</small></td>
            <td>{{ u.email || '-' }}</td>
            <td><span :class="['status-pill', u.role === 'admin' ? 'on' : 'off']">{{ u.role === 'admin' ? 'ADMIN' : 'Teknisi' }}</span></td>
            <td><span :class="['status-pill', u.status === 'active' ? 'on' : 'off']">{{ u.status === 'active' ? 'Aktif' : 'Disuspend' }}</span></td>
            <td>{{ stats?.[u.id]?.qty ?? '-' }}</td>
            <td><b class="neon">{{ stats?.[u.id]?.total ?? '-' }}</b></td>
            <td>{{ stats?.[u.id]?.target ?? '-' }}</td>
            <td class="admin-actions">
              <button v-if="u.role === 'teknisi'" class="text-btn" @click="emit('manage', u.id)">Kelola Data</button>
              <button v-if="u.role === 'teknisi'" class="text-btn" @click="openEdit(u)">Edit</button>
              <button v-if="u.role === 'teknisi'" class="text-btn" @click="openReset(u)">Reset PW</button>
              <button v-if="u.id !== currentUserId && u.role === 'teknisi'" class="text-btn" @click="emit('toggle-status', u.id)">
                {{ u.status === 'active' ? 'Suspend' : 'Aktifkan' }}
              </button>
            </td>
          </tr>
          <tr v-if="!users.length"><td colspan="8" class="empty">Belum ada akun.</td></tr>
        </tbody>
      </table>
    </div>
    <p class="admin-note">Akun yang disuspend tidak dapat login sampai diaktifkan kembali. Akun dan riwayat pekerjaan tetap disimpan.</p>
  </div>

  <div v-if="mode === 'add' || mode === 'edit'" class="modal-backdrop" @click.self="close">
    <div class="modal">
      <div class="panel-head">
        <div><span class="eyebrow">ADMIN</span><h2>{{ mode === 'add' ? 'Tambah Akun Teknisi' : 'Edit Akun Teknisi' }}</h2></div>
        <button class="close" @click="close">×</button>
      </div>
      <div class="form-grid">
        <label>Email<input v-model="form.email" type="email" autocomplete="email" placeholder="teknisi@perusahaan.com"></label>
        <label>Nama lengkap<input v-model="form.name" autocomplete="name"></label>
        <label>Target poin<input v-model.number="form.target" type="number" min="0"></label>
        <label v-if="mode === 'add'">Password awal<input v-model="form.password" type="password" autocomplete="new-password" placeholder="Minimal 8 karakter"></label>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" @click="close">Batal</button>
        <button class="btn-primary" @click="save">Simpan</button>
      </div>
    </div>
  </div>

  <div v-if="mode === 'reset'" class="modal-backdrop" @click.self="close">
    <div class="modal">
      <div class="panel-head">
        <div><span class="eyebrow">ADMIN</span><h2>Reset Password</h2></div>
        <button class="close" @click="close">×</button>
      </div>
      <div class="form-grid">
        <label>Password baru<input v-model="newPassword" type="password" autocomplete="new-password" placeholder="Minimal 8 karakter"></label>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" @click="close">Batal</button>
        <button class="btn-primary" @click="saveReset">Reset Password</button>
      </div>
    </div>
  </div>
</template>
