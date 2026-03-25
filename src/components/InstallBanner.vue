<template>
  <div v-if="visible" class="install-banner">
    <p class="install-banner__text">Add to Home Screen for the best experience</p>
    <Button label="Install" size="small" @click="install" class="install-banner__install" />
    <Button label="Dismiss" size="small" variant="outlined" @click="dismiss" class="install-banner__dismiss" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Button from 'primevue/button'

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

<style scoped lang="scss">
.install-banner {
  position: fixed;
  bottom: 64px;
  left: 0;
  right: 0;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  box-shadow: var(--shadow-lg);
}

.install-banner__text {
  flex: 1;
  margin: 0;
  font-size: 0.875rem;
}

.install-banner__install,
.install-banner__dismiss {
  flex-shrink: 0;
}
</style>
