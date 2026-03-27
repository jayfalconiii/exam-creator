import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import ToastService from 'primevue/toastservice'
import { db } from '@/db/db'
import StudyView from '@/views/StudyView.vue'
import type { Topic } from '@/types'

const SEED_TOPICS: Omit<Topic, 'id'>[] = [
  { topicId: 'ec2', name: 'EC2', color: '#1565c0', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 's3', name: 'S3', color: '#00695c', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'vpc', name: 'VPC', color: '#6a1b9a', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'iam', name: 'IAM', color: '#c62828', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'rds', name: 'RDS', color: '#283593', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'lambda', name: 'Lambda', color: '#ad1457', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'cloudfront', name: 'CloudFront', color: '#00838f', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'route53', name: 'Route 53', color: '#4e342e', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'elb', name: 'ELB', color: '#2e7d32', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'dynamodb', name: 'DynamoDB', color: '#4527a0', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'sqs-sns', name: 'SQS / SNS', color: '#e65100', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'cloudwatch', name: 'CloudWatch', color: '#37474f', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'efs-fsx', name: 'EFS / FSx', color: '#0277bd', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'glacier', name: 'Glacier', color: '#4a148c', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'kms-secrets', name: 'KMS / Secrets Manager', color: '#b71c1c', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'trusted-advisor', name: 'Trusted Advisor', color: '#1b5e20', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'storage-gateway', name: 'Storage Gateway', color: '#0d47a1', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
]

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
    await db.topics.bulkAdd(SEED_TOPICS.map((t) => ({ ...t })))
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

    const input = timerToggle.find('input')
    if (input.exists()) {
      ;(input.element as HTMLInputElement).checked = true
      await input.trigger('change')
    } else {
      await timerToggle.trigger('click')
    }
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

  it('renders 12 preset timer buttons when timer is enabled', async () => {
    const wrapper = mountStudyView()
    await flushPromises()

    const timerToggle = wrapper.find('[data-testid="timer-toggle"]')
    const input = timerToggle.find('input')
    if (input.exists()) {
      ;(input.element as HTMLInputElement).checked = true
      await input.trigger('change')
    } else {
      await timerToggle.trigger('click')
    }
    await flushPromises()

    const presetBtns = wrapper.findAll('[data-testid^="timer-preset-"]')
    expect(presetBtns).toHaveLength(12)
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
