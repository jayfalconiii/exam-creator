import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import SessionView from '@/views/SessionView.vue'
import type { SessionConfig, Question } from '@/types'

const refreshTopics = vi.hoisted(() => vi.fn(async () => {}))

vi.mock('@/composables/useSession', () => ({
  buildQuestionQueue: vi.fn(async (): Promise<Question[]> => [
    {
      id: 1,
      topicId: 'ec2',
      text: 'Q1',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 0,
      explanation: 'A is correct',
      source: 'seed',
      errorCount: 0,
      lastSeenAt: null,
      createdAt: Date.now(),
    },
  ]),
  submitAnswer: vi.fn(async (_qId: number, idx: number, _t: number, correctIdx: number) => ({
    questionId: 1,
    selectedIndex: idx,
    timeMs: 0,
    correct: idx === correctIdx,
  })),
  completeSession: vi.fn(async () => {}),
}))

vi.mock('@/stores/topics', () => ({
  useTopicsStore: vi.fn(() => ({ refreshTopics })),
}))

vi.mock('@/components/QuestionCard.vue', () => ({
  default: {
    name: 'QuestionCard',
    props: ['question', 'selectedIndex', 'disabled', 'showFeedback'],
    emits: ['select'],
    template: '<div class="question-card" @click="$emit(\'select\', 0)"></div>',
  },
}))

vi.mock('@/components/ProgressBar.vue', () => ({
  default: { name: 'ProgressBar', props: ['current', 'total'], template: '<div />' },
}))

function mountSessionView() {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/study/session', component: SessionView },
      { path: '/study/session/review', component: { template: '<div>review</div>' } },
      { path: '/study', component: { template: '<div>study</div>' } },
    ],
  })
  router.push('/study/session')

  return mount(SessionView, { global: { plugins: [router] } })
}

const baseConfig: SessionConfig = {
  topicIds: ['ec2'],
  mode: 'mixed',
  questionCount: 1,
  feedbackMode: 'exam',
  timerEnabled: false,
  timerSeconds: 0,
}

describe('SessionView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('calls topicsStore.refreshTopics() after session completes', async () => {
    const sessionStore = useSessionStore()
    sessionStore.configure(baseConfig)

    const wrapper = mountSessionView()
    await flushPromises()

    await wrapper.find('.question-card').trigger('click')
    await flushPromises()

    const btn = wrapper.find('.session-view__btn')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    await flushPromises()

    expect(refreshTopics).toHaveBeenCalledOnce()
  })

  it('sessionStore.status transitions to review after finish', async () => {
    const sessionStore = useSessionStore()
    sessionStore.configure(baseConfig)

    const wrapper = mountSessionView()
    await flushPromises()

    await wrapper.find('.question-card').trigger('click')
    await flushPromises()

    const btn = wrapper.find('.session-view__btn')
    await btn.trigger('click')
    await flushPromises()

    expect(sessionStore.status).toBe('review')
  })
})
