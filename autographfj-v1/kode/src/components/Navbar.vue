<script setup>defineProps({ profile: Object, role: String }); defineEmits(['toggle-menu', 'logout'])</script>
<template>
  <header class="topbar">
    <button class="icon-btn mobile-only" @click="$emit('toggle-menu')">☰</button>
    <div><span class="eyebrow">TECHNICIAN POINT MONITORING</span><strong>Technician Point Monitoring</strong></div>
    <div class="topbar-right">
      <span v-if="role === 'admin'" class="badge">🛡 ADMIN</span>
      <div class="profile-mini">
        <span class="avatar">{{ profile?.name?.charAt(0) || 'T' }}</span>
        <span class="profile-text"><b>{{ profile?.name }}</b><small>{{ profile?.code }}</small></span>
      </div>
      <button class="icon-btn" @click="$emit('logout')">↪</button>
    </div>
  </header>
</template>
