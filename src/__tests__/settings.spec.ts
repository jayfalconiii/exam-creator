import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

describe('useSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('fresh store: hasApiKey is false', async () => {
    const { useSettingsStore } = await import('@/stores/settings')
    const store = useSettingsStore()
    expect(store.hasApiKey).toBe(false)
  })

  it('fresh store: defaultQuestionCount is 10', async () => {
    const { useSettingsStore } = await import('@/stores/settings')
    const store = useSettingsStore()
    expect(store.defaultQuestionCount).toBe(10)
  })

  it('fresh store: defaultMode is mixed', async () => {
    const { useSettingsStore } = await import('@/stores/settings')
    const store = useSettingsStore()
    expect(store.defaultMode).toBe('mixed')
  })

  it('saveApiKey persists and updates reactive apiKey', async () => {
    const { useSettingsStore } = await import('@/stores/settings')
    const store = useSettingsStore()
    await store.saveApiKey('sk-ant-test-123')
    expect(store.apiKey).toBe('sk-ant-test-123')
  })

  it('hasApiKey becomes true after saving a non-empty key', async () => {
    const { useSettingsStore } = await import('@/stores/settings')
    const store = useSettingsStore()
    await store.saveApiKey('sk-ant-test-123')
    expect(store.hasApiKey).toBe(true)
  })

  it('saveDefaults persists count and mode reactively', async () => {
    const { useSettingsStore } = await import('@/stores/settings')
    const store = useSettingsStore()
    await store.saveDefaults(20, 'difficult')
    expect(store.defaultQuestionCount).toBe(20)
    expect(store.defaultMode).toBe('difficult')
  })

  it('loadFromDB restores persisted apiKey', async () => {
    const { useSettingsStore } = await import('@/stores/settings')
    const store = useSettingsStore()
    await store.saveApiKey('sk-ant-restore-test')
    // simulate fresh load
    store.apiKey = ''
    await store.loadFromDB()
    expect(store.apiKey).toBe('sk-ant-restore-test')
  })

  it('loadFromDB restores persisted defaults', async () => {
    const { useSettingsStore } = await import('@/stores/settings')
    const store = useSettingsStore()
    await store.saveDefaults(65, 'new')
    store.defaultQuestionCount = 10
    store.defaultMode = 'mixed'
    await store.loadFromDB()
    expect(store.defaultQuestionCount).toBe(65)
    expect(store.defaultMode).toBe('new')
  })
})
