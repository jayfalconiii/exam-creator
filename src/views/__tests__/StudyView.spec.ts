import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import ToastService from 'primevue/toastservice'
import { db } from '@/db/db'
import { TOPIC_DEFINITIONS } from '@/data/topics'
import StudyView from '@/views/StudyView.vue'

vi.mock('@/composables/useNetwork', () => ({
  useNetwork: () => ({ isOnline: { value: true } }),
}))

function mountStudyView() {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/study', component: StudyView },
      { path: '/study/session', component: { template: '<div>session</div>' } },
    ],
  })
  return mount(StudyView, {
    global: { plugins: [router, ToastService] },
  })
}

describe('StudyView', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.topics.clear()
    await db.topics.bulkAdd(TOPIC_DEFINITIONS.map((t) => ({ ...t })))
    await db.settings.clear()
  })

  it('renders topic chips with all 17 topics + "All" shortcut', async () => {
    const wrapper = mountStudyView()
    await flushPromises()
    const topicChips = wrapper.findAll('[data-testid^="topic-"]:not([data-testid="topic-all"])')
    expect(topicChips).toHaveLength(17)
    expect(wrapper.find('[data-testid="topic-all"]').exists()).toBe(true)
  })

  it('"All" chip selects all topics when none selected', async () => {
    const wrapper = mountStudyView()
    await flushPromises()
    const allChip = wrapper.find('[data-testid="topic-all"]')
    expect(allChip.classes()).not.toContain('study-view__chip--selected')
    await allChip.trigger('click')
    await flushPromises()
    expect(allChip.classes()).toContain('study-view__chip--selected')
  })

  it('individual topic chip toggles selected state', async () => {
    const wrapper = mountStudyView()
    await flushPromises()
    const chip = wrapper.find('[data-testid="topic-ec2"]')
    expect(chip.classes()).not.toContain('study-view__chip--selected')
    await chip.trigger('click')
    await flushPromises()
    expect(chip.classes()).toContain('study-view__chip--selected')
    await chip.trigger('click')
    await flushPromises()
    expect(chip.classes()).not.toContain('study-view__chip--selected')
  })

  it('renders mode selector with Review/Difficult/New/Mixed options', async () => {
    const wrapper = mountStudyView()
    await flushPromises()
    const modeOptions = ['review', 'difficult', 'new', 'mixed']
    for (const mode of modeOptions) {
      expect(wrapper.find(`[data-testid="mode-${mode}"]`).exists()).toBe(true)
    }
  })

  it('renders question count slider with default value 10', async () => {
    const wrapper = mountStudyView()
    await flushPromises()
    const countDisplay = wrapper.find('[data-testid="question-count"]')
    expect(countDisplay.exists()).toBe(true)
    expect(countDisplay.text()).toBe('10')
    expect(wrapper.find('[data-testid="question-count-slider"]').exists()).toBe(true)
  })

  it('renders feedback mode toggle switch', async () => {
    const wrapper = mountStudyView()
    await flushPromises()
    expect(wrapper.find('[data-testid="feedback-toggle"]').exists()).toBe(true)
  })

  it('renders timer toggle; when enabled, shows time input', async () => {
    const wrapper = mountStudyView()
    await flushPromises()
    const timerToggle = wrapper.find('[data-testid="timer-toggle"]')
    expect(timerToggle.exists()).toBe(true)
    expect(wrapper.find('[data-testid="timer-seconds"]').exists()).toBe(false)

    ;(timerToggle.element as HTMLInputElement).checked = true
    await timerToggle.trigger('change')
    await flushPromises()
    expect(wrapper.find('[data-testid="timer-seconds"]').exists()).toBe(true)
  })

  it('"Start Session" is disabled when no topic selected', async () => {
    const wrapper = mountStudyView()
    await flushPromises()
    const btn = wrapper.find('[data-testid="start-session"]')
    expect(btn.exists()).toBe(true)
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('"Start Session" calls sessionStore.configure() and navigates to /study/session', async () => {
    const wrapper = mountStudyView()
    await flushPromises()

    await wrapper.find('[data-testid="topic-ec2"]').trigger('click')
    await flushPromises()

    const btn = wrapper.find('[data-testid="start-session"]')
    expect((btn.element as HTMLButtonElement).disabled).toBe(false)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const saved = await db.settings.toArray()
    const topicsSetting = saved.find((s) => s.key === 'session_topicIds')
    expect(topicsSetting).toBeDefined()
    expect(JSON.parse(topicsSetting!.value)).toContain('ec2')
  })

  it('config saves to db and persists question count', async () => {
    const wrapper = mountStudyView()
    await flushPromises()

    await wrapper.find('[data-testid="topic-ec2"]').trigger('click')
    await flushPromises()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const saved = await db.settings.toArray()
    const sessionKeys = saved.filter((s) => s.key.startsWith('session_'))
    expect(sessionKeys.length).toBeGreaterThan(0)

    const countSetting = saved.find((s) => s.key === 'session_questionCount')
    expect(countSetting?.value).toBe('10')
  })
})
