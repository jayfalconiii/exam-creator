<template>
  <RouterView />
  <BottomNav />
  <InstallBanner />
</template>

<script setup lang="ts">
import '@/assets/tokens.css'
import BottomNav from '@/components/BottomNav.vue'
import InstallBanner from '@/components/InstallBanner.vue'
</script>

<style>
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  padding-bottom: 56px;
}
</style>
