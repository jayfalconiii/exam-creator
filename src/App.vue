<template>
  <Toast />
  <Transition name="slide-fade" mode="out-in">
    <RouterView />
  </Transition>
  <BottomNav />
  <InstallBanner />
</template>

<script setup lang="ts">
import '@/assets/tokens.css'
import Toast from 'primevue/toast'
import BottomNav from '@/components/BottomNav.vue'
import InstallBanner from '@/components/InstallBanner.vue'
</script>

<style lang="scss">
*, *::before, *::after {
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  overflow: hidden;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

#app {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(56px + env(safe-area-inset-bottom));
}

/* Route slide-fade transition */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(8px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

/* Button micro-interactions */
button:active,
.p-button:active {
  transform: scale(0.97);
}

/* prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition: none;
  }

  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
