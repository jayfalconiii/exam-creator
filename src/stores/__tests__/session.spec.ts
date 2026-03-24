import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { SessionConfig } from '@/types/index'

describe('useSessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initial state is idle', async () => {
    const { useSessionStore } = await import('@/stores/session')
    const store = useSessionStore()
    expect(store.status).toBe('idle')
  })

  it('configure(config) updates store state', async () => {
    const { useSessionStore } = await import('@/stores/session')
    const store = useSessionStore()
    const config: SessionConfig = {
      topicIds: ['ec2', 's3'],
      mode: 'mixed',
      questionCount: 10,
      feedbackMode: 'study',
      timerEnabled: false,
      timerSeconds: 90,
    }
    store.configure(config)
    expect(store.config).toEqual(config)
    expect(store.status).toBe('configured')
  })

  it('SessionConfig includes topics[], mode, questionCount, feedbackMode, timerEnabled, timerSeconds', async () => {
    const { useSessionStore } = await import('@/stores/session')
    const store = useSessionStore()
    const config: SessionConfig = {
      topicIds: ['vpc', 'iam', 'rds'],
      mode: 'difficult',
      questionCount: 20,
      feedbackMode: 'exam',
      timerEnabled: true,
      timerSeconds: 120,
    }
    store.configure(config)
    expect(store.config?.topicIds).toEqual(['vpc', 'iam', 'rds'])
    expect(store.config?.mode).toBe('difficult')
    expect(store.config?.questionCount).toBe(20)
    expect(store.config?.feedbackMode).toBe('exam')
    expect(store.config?.timerEnabled).toBe(true)
    expect(store.config?.timerSeconds).toBe(120)
  })
})
