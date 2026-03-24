<template>
  <div v-if="visible" class="install-banner">
    <p class="install-banner__text">Add to Home Screen for the best experience</p>
    <button class="install-banner__install" @click="install">Install</button>
    <button class="install-banner__dismiss" @click="dismiss">Dismiss</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  preventDefault(): void
  prompt(): Promise<void>
}

const visible = ref(false)
let deferredPrompt: BeforeInstallPromptEvent | null = null

function onBeforeInstallPrompt(e: Event) {
  const event = e as BeforeInstallPromptEvent
  event.preventDefault()
  if (localStorage.getItem('install-banner-dismissed') === 'true') return
  deferredPrompt = event
  visible.value = true
}

async function install() {
  if (!deferredPrompt) return
  await deferredPrompt.prompt()
  deferredPrompt = null
  visible.value = false
}

function dismiss() {
  localStorage.setItem('install-banner-dismissed', 'true')
  visible.value = false
  deferredPrompt = null
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
})
</script>

<style scoped>
.install-banner {
  position: fixed;
  bottom: 64px;
  left: 0;
  right: 0;
  background: #1a73e8;
  color: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.install-banner__text {
  flex: 1;
  margin: 0;
  font-size: 0.875rem;
}

.install-banner__install,
.install-banner__dismiss {
  background: transparent;
  border: 1px solid #fff;
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}
</style>
