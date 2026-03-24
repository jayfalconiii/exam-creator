import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SessionConfig } from '@/types/index'

export type SessionStatus = 'idle' | 'configured' | 'loading' | 'active' | 'review'

export const useSessionStore = defineStore('session', () => {
  const status = ref<SessionStatus>('idle')
  const config = ref<SessionConfig | null>(null)

  function configure(newConfig: SessionConfig) {
    config.value = newConfig
    status.value = 'configured'
  }

  function reset() {
    config.value = null
    status.value = 'idle'
  }

  return { status, config, configure, reset }
})
