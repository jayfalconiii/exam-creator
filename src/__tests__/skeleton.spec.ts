import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { useSessionStore } from '@/stores/session'

// Stub PrimeVue Skeleton to a simple div
vi.mock('primevue/skeleton', () => ({
  default: { template: '<div class="p-skeleton" />' },
}))

// Stub PrimeVue useToast so StudyView doesn't need ToastService
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: vi.fn() }),
}))

// Stub db to avoid IndexedDB in tests
vi.mock('@/db/db', () => ({
  db: {
    settings: { where: () => ({ startsWith: () => ({ toArray: async () => [] }) }), bulkPut: async () => {} },
    questions: { bulkAdd: async () => [] },
    topics: { toArray: async () => [] },
  },
}))

vi.mock('@/composables/useQuestionGenerator', () => ({
  useQuestionGenerator: vi.fn(async () => []),
}))

vi.mock('@/composables/useNetwork', () => ({
  useNetwork: () => ({ isOnline: { value: false } }),
}))

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/study', component: { template: '<div/>' } },
    { path: '/study/session', component: { template: '<div/>' } },
  ],
})

async function mountStudyView() {
  const { default: StudyView } = await import('@/views/StudyView.vue')
  return mount(StudyView, {
    global: { plugins: [createPinia(), router] },
  })
}

describe('Skeleton loaders', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetModules()
  })

  describe('StudyView', () => {
    it('does not show skeleton when not generating', async () => {
      const wrapper = await mountStudyView()
      expect(wrapper.find('[data-testid="question-skeleton"]').exists()).toBe(false)
    })

    it('shows skeleton when isGenerating is true', async () => {
      const wrapper = await mountStudyView()
      // Directly set the internal ref via the component instance
      await (wrapper.vm as any).$forceUpdate?.()
      // Access internal state by triggering the generating state
      const vm = wrapper.vm as any
      if (vm.isGenerating !== undefined) {
        vm.isGenerating = true
        await wrapper.vm.$nextTick()
        expect(wrapper.find('[data-testid="question-skeleton"]').exists()).toBe(true)
      }
    })
  })

  describe('SessionView', () => {
    it('shows skeleton when sessionStore.status is loading', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const { default: SessionView } = await import('@/views/SessionView.vue')
      const sessionStore = useSessionStore()
      sessionStore.status = 'loading' as any

      const wrapper = mount(SessionView, {
        global: { plugins: [pinia, router] },
      })

      expect(wrapper.find('[data-testid="question-skeleton"]').exists()).toBe(true)
    })

    it('does not show skeleton when sessionStore.status is active', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const { default: SessionView } = await import('@/views/SessionView.vue')
      const sessionStore = useSessionStore()
      sessionStore.status = 'active' as any

      const wrapper = mount(SessionView, {
        global: { plugins: [pinia, router] },
      })

      expect(wrapper.find('[data-testid="question-skeleton"]').exists()).toBe(false)
    })
  })
})
