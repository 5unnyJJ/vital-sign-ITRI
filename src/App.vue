<template>
  <div id="app-root">
    <RouterView />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
</script>

<style>
body {
  font-family: 'Noto Sans TC', 'DM Sans', sans-serif;
  background:
    linear-gradient(rgba(243, 248, 244, .76), rgba(234, 242, 236, .82)),
    url('/vital-sign-ITRI/images/zipN-4240-00-000027-wpu.jpg');
  background-size: cover, cover;
  background-attachment: fixed;
  color: #1e2d26;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
</style>
