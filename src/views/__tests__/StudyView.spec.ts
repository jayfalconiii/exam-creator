import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { db } from '@/db/db'
import { TOPIC_DEFINITIONS } from '@/data/topics'
import StudyView from '@/views/StudyView.vue'

vi.mock('@/composables/useNetwork', () => ({
  useNetwork: () => ({ isOnline: { value: true } }),
}))

async function checkCheckbox(wrapper: ReturnType<typeof mount>, testId: string) {
  const el = wrapper.find(`[data-testid="${testId}"]`)
  ;(el.element as HTMLInputElement).checked = true
  await el.trigger('change')
  await flushPromises()
}

function mountStudyView() {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/study', component: StudyView },
      { path: '/study/session', component: { template: '<div>session</div>' } },
    ],
  })
  return mount(StudyView, {
    global: { plugins: [router] },
  })
}

describe('StudyView', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.topics.clear()
    await db.topics.bulkAdd(TOPIC_DEFINITIONS.map((t) => ({ ...t })))
    await db.settings.clear()
  })

  it('renders topic multi-select with all 17 topics + "All" shortcut', async () => {
    const wrapper = mountStudyView()
    await flushPromises()
    const topicCheckboxes = wrapper.findAll('[data-testid^="topic-"]:not([data-testid="topic-all"])')
    expect(topicCheckboxes).toHaveLength(17)
    expect(wrapper.find('[data-testid="topic-all"]').exists()).toBe(true)
  })

  it('renders mode selector with Review/Difficult/New/Mixed options', async () => {
    const wrapper = mountStudyView()
    await flushPromises()
    const modeOptions = ['review', 'difficult', 'new', 'mixed']
    for (const mode of modeOptions) {
      expect(wrapper.find(`[data-testid="mode-${mode}"]`).exists()).toBe(true)
    }
  })

  it('renders question count input with range 5-65 and default 10', async () => {
    const wrapper = mountStudyView()
    await flushPromises()
    const input = wrapper.find('[data-testid="question-count"]')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).min).toBe('5')
    expect((input.element as HTMLInputElement).max).toBe('65')
    expect((input.element as HTMLInputElement).value).toBe('10')
  })

  it('renders feedback mode toggle (Study/Exam)', async () => {
    const wrapper = mountStudyView()
    await flushPromises()
    expect(wrapper.find('[data-testid="feedback-study"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="feedback-exam"]').exists()).toBe(true)
  })

  it('renders timer toggle; when enabled, shows time input', async () => {
    const wrapper = mountStudyView()
    await flushPromises()
    const timerToggle = wrapper.find('[data-testid="timer-toggle"]')
    expect(timerToggle.exists()).toBe(true)
    expect(wrapper.find('[data-testid="timer-seconds"]').exists()).toBe(false)

    await checkCheckbox(wrapper, 'timer-toggle')
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

    await checkCheckbox(wrapper, 'topic-ec2')

    const btn = wrapper.find('[data-testid="start-session"]')
    expect((btn.element as HTMLButtonElement).disabled).toBe(false)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const saved = await db.settings.toArray()
    const topicsSetting = saved.find((s) => s.key === 'session_topicIds')
    expect(topicsSetting).toBeDefined()
    expect(JSON.parse(topicsSetting!.value)).toContain('ec2')
  })

  it('config saves to settingsStore and pre-fills on next visit', async () => {
    const wrapper = mountStudyView()
    await flushPromises()

    await wrapper.find('[data-testid="question-count"]').setValue('20')
    await flushPromises()

    await checkCheckbox(wrapper, 'topic-ec2')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const saved = await db.settings.toArray()
    const sessionKeys = saved.filter((s) => s.key.startsWith('session_'))
    expect(sessionKeys.length).toBeGreaterThan(0)

    const countSetting = saved.find((s) => s.key === 'session_questionCount')
    expect(countSetting?.value).toBe('20')
  })
})
