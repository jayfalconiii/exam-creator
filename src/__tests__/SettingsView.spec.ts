import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { buildBackup } from '@/utils/backup'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import type { SessionMode, ThemePreference } from '@/types'
import SettingsView from '@/views/SettingsView.vue'
import HomeView from '@/views/HomeView.vue'

const mockSaveApiKey = vi.fn().mockResolvedValue(undefined)
const mockSaveDefaults = vi.fn().mockResolvedValue(undefined)
const mockSaveTheme = vi.fn().mockResolvedValue(undefined)
const mockLoadFromDB = vi.fn().mockResolvedValue(undefined)

const mockStoreState = {
  apiKey: '',
  defaultQuestionCount: 10,
  defaultMode: 'mixed' as SessionMode,
  theme: 'auto' as ThemePreference,
  hasApiKey: false,
  saveApiKey: mockSaveApiKey,
  saveDefaults: mockSaveDefaults,
  saveTheme: mockSaveTheme,
  loadFromDB: mockLoadFromDB,
}

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => mockStoreState),
}))

vi.mock('@/utils/backup', () => ({
  buildBackup: vi.fn().mockResolvedValue({ version: 1, questions: [], topics: [] }),
}))

function makeRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', component: HomeView },
      { path: '/settings', component: SettingsView },
    ],
  })
}

describe('SettingsView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockStoreState.apiKey = ''
    mockStoreState.defaultQuestionCount = 10
    mockStoreState.defaultMode = 'mixed'
    mockStoreState.theme = 'auto'
    mockStoreState.hasApiKey = false
    mockSaveApiKey.mockResolvedValue(undefined)
    mockSaveDefaults.mockResolvedValue(undefined)
    mockSaveTheme.mockResolvedValue(undefined)
    mockLoadFromDB.mockResolvedValue(undefined)
  })

  it('API key field is type="password"', () => {
    const router = makeRouter()
    const wrapper = mount(SettingsView, { global: { plugins: [router, createPinia(), PrimeVue] } })
    const input = wrapper.find('input[data-testid="api-key-input"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('password')
  })

  it('API key field pre-fills from store on mount', async () => {
    mockStoreState.apiKey = 'sk-ant-prefill'
    const router = makeRouter()
    const wrapper = mount(SettingsView, { global: { plugins: [router, createPinia(), PrimeVue] } })
    await flushPromises()
    const input = wrapper.find('input[data-testid="api-key-input"]')
    expect((input.element as HTMLInputElement).value).toBe('sk-ant-prefill')
  })

  it('clicking save calls saveApiKey and shows confirmation', async () => {
    const router = makeRouter()
    const wrapper = mount(SettingsView, { global: { plugins: [router, createPinia(), PrimeVue] } })
    await flushPromises()
    await wrapper.find('input[data-testid="api-key-input"]').setValue('sk-ant-newkey')
    await wrapper.find('button[data-testid="save-api-key-btn"]').trigger('click')
    await flushPromises()

    expect(mockSaveApiKey).toHaveBeenCalledWith('sk-ant-newkey')
    expect(wrapper.find('[data-testid="api-key-saved-msg"]').exists()).toBe(true)
  })

  it('saving empty input clears the key', async () => {
    mockStoreState.apiKey = 'sk-ant-existing'
    const router = makeRouter()
    const wrapper = mount(SettingsView, { global: { plugins: [router, createPinia(), PrimeVue] } })
    await flushPromises()
    await wrapper.find('input[data-testid="api-key-input"]').setValue('')
    await wrapper.find('button[data-testid="save-api-key-btn"]').trigger('click')
    await flushPromises()

    expect(mockSaveApiKey).toHaveBeenCalledWith('')
  })

  it('question count field pre-fills from store defaults', async () => {
    mockStoreState.defaultQuestionCount = 25
    const router = makeRouter()
    const wrapper = mount(SettingsView, { global: { plugins: [router, createPinia(), PrimeVue] } })
    await flushPromises()
    const input = wrapper.find('input[data-testid="question-count-input"]')
    expect((input.element as HTMLInputElement).value).toBe('25')
  })

  it('mode field pre-fills from store defaults', async () => {
    mockStoreState.defaultMode = 'difficult'
    const router = makeRouter()
    const wrapper = mount(SettingsView, { global: { plugins: [router, createPinia(), PrimeVue] } })
    await flushPromises()
    const select = wrapper.find('select[data-testid="mode-select"]')
    expect((select.element as HTMLSelectElement).value).toBe('difficult')
  })

  it('save defaults calls saveDefaults and shows confirmation', async () => {
    const router = makeRouter()
    const wrapper = mount(SettingsView, { global: { plugins: [router, createPinia(), PrimeVue] } })
    await flushPromises()
    await wrapper.find('input[data-testid="question-count-input"]').setValue('30')
    await wrapper.find('select[data-testid="mode-select"]').setValue('new')
    await wrapper.find('button[data-testid="save-defaults-btn"]').trigger('click')
    await flushPromises()

    expect(mockSaveDefaults).toHaveBeenCalledWith(30, 'new')
    expect(wrapper.find('[data-testid="defaults-saved-msg"]').exists()).toBe(true)
  })

  it('clicking Light calls saveTheme with "light"', async () => {
    const router = makeRouter()
    const wrapper = mount(SettingsView, { global: { plugins: [router, createPinia(), PrimeVue] } })
    await flushPromises()
    const buttons = wrapper.findAll('button')
    const lightBtn = buttons.find(b => b.text() === 'Light')
    await lightBtn!.trigger('click')
    expect(mockSaveTheme).toHaveBeenCalledWith('light')
  })

  it('clicking Auto calls saveTheme with "auto"', async () => {
    const router = makeRouter()
    const wrapper = mount(SettingsView, { global: { plugins: [router, createPinia(), PrimeVue] } })
    await flushPromises()
    const buttons = wrapper.findAll('button')
    const autoBtn = buttons.find(b => b.text() === 'Auto')
    await autoBtn!.trigger('click')
    expect(mockSaveTheme).toHaveBeenCalledWith('auto')
  })

  it('clicking Dark calls saveTheme with "dark"', async () => {
    const router = makeRouter()
    const wrapper = mount(SettingsView, { global: { plugins: [router, createPinia(), PrimeVue] } })
    await flushPromises()
    const buttons = wrapper.findAll('button')
    const darkBtn = buttons.find(b => b.text() === 'Dark')
    await darkBtn!.trigger('click')
    expect(mockSaveTheme).toHaveBeenCalledWith('dark')
  })
})

describe('Export Backup', () => {
  it('Export Backup button is visible', () => {
    const router = makeRouter()
    const wrapper = mount(SettingsView, { global: { plugins: [router, createPinia(), PrimeVue] } })
    const btn = wrapper.find('button[data-testid="export-backup-btn"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('Export Backup')
  })

  it('clicking Export Backup calls buildBackup and triggers a download', async () => {
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock')
    URL.revokeObjectURL = vi.fn()

    const mockClick = vi.fn()
    const mockAnchor = { href: '', download: '', click: mockClick } as unknown as HTMLAnchorElement
    const originalCreate = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, ...args: unknown[]) => {
        if (tag === 'a') {
          createElementSpy.mockImplementation((t: string, ...a: unknown[]) => originalCreate(t, ...(a as [])))
          return mockAnchor
        }
        return originalCreate(tag, ...(args as []))
      },
    )

    const router = makeRouter()
    const wrapper = mount(SettingsView, { global: { plugins: [router, createPinia(), PrimeVue] } })
    await wrapper.find('button[data-testid="export-backup-btn"]').trigger('click')
    await flushPromises()

    expect(buildBackup).toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()

    createElementSpy.mockRestore()
  })
})

describe('HomeView gear icon', () => {
  it('has a link to /settings', () => {
    const router = makeRouter()
    const wrapper = mount(HomeView, { global: { plugins: [router, createPinia()] } })
    const link = wrapper.find('a[href="#/settings"]')
    expect(link.exists()).toBe(true)
  })
})
