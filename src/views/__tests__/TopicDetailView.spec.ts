import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { db } from '@/db/db'
import { TOPIC_DEFINITIONS } from '@/data/topics'
import TopicDetailView from '@/views/TopicDetailView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/topics', component: { template: '<div/>' } },
    { path: '/topics/:id', component: TopicDetailView },
  ],
})

async function flush() {
  await flushPromises()
  await flushPromises()
}

describe('TopicDetailView', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.topics.clear()
    await db.questions.clear()
    await db.sessions.clear()
    await db.topics.bulkAdd(TOPIC_DEFINITIONS.map((t) => ({ ...t })))
    await db.questions.add({
      topicId: 'ec2',
      text: 'Default Q',
      options: ['a', 'b', 'c', 'd'],
      correctIndex: 0,
      explanation: 'e',
      source: 'seed',
      errorCount: 0,
      lastSeenAt: null,
      createdAt: Date.now(),
    })
  })

  it('shows topic name', async () => {
    await router.push('/topics/ec2')
    await router.isReady()
    const wrapper = mount(TopicDetailView, {
      global: { plugins: [router, createPinia()] },
    })
    await flush()
    expect(wrapper.text()).toContain('EC2')
  })

  it('shows effective score and raw score', async () => {
    await db.topics
      .where('topicId')
      .equals('ec2')
      .modify({ rawScore: 80, lastReviewedAt: Date.now() })
    await router.push('/topics/ec2')
    await router.isReady()
    const wrapper = mount(TopicDetailView, {
      global: { plugins: [router, createPinia()] },
    })
    await flush()
    expect(wrapper.find('[data-test="raw-score"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="effective-score"]').exists()).toBe(true)
  })

  it('shows total question count for topic', async () => {
    await db.questions.bulkAdd([
      {
        topicId: 'ec2',
        text: 'Q1',
        options: ['a', 'b', 'c', 'd'],
        correctIndex: 0,
        explanation: 'e',
        source: 'seed',
        errorCount: 0,
        lastSeenAt: null,
        createdAt: Date.now(),
      },
      {
        topicId: 'ec2',
        text: 'Q2',
        options: ['a', 'b', 'c', 'd'],
        correctIndex: 0,
        explanation: 'e',
        source: 'seed',
        errorCount: 0,
        lastSeenAt: null,
        createdAt: Date.now(),
      },
      {
        topicId: 's3',
        text: 'Q3',
        options: ['a', 'b', 'c', 'd'],
        correctIndex: 0,
        explanation: 'e',
        source: 'seed',
        errorCount: 0,
        lastSeenAt: null,
        createdAt: Date.now(),
      },
    ])
    await router.push('/topics/ec2')
    await router.isReady()
    const wrapper = mount(TopicDetailView, {
      global: { plugins: [router, createPinia()] },
    })
    await flush()
    const el = wrapper.find('[data-test="total-questions"]')
    expect(el.exists()).toBe(true)
    // beforeEach adds 1 default ec2 question; this test adds 2 more = 3 total
    expect(el.text()).toContain('3')
  })

  it('shows difficult question count (errorCount >= 2)', async () => {
    await db.questions.bulkAdd([
      {
        topicId: 'ec2',
        text: 'Q1',
        options: ['a', 'b', 'c', 'd'],
        correctIndex: 0,
        explanation: 'e',
        source: 'seed',
        errorCount: 2,
        lastSeenAt: null,
        createdAt: Date.now(),
      },
      {
        topicId: 'ec2',
        text: 'Q2',
        options: ['a', 'b', 'c', 'd'],
        correctIndex: 0,
        explanation: 'e',
        source: 'seed',
        errorCount: 3,
        lastSeenAt: null,
        createdAt: Date.now(),
      },
      {
        topicId: 'ec2',
        text: 'Q3',
        options: ['a', 'b', 'c', 'd'],
        correctIndex: 0,
        explanation: 'e',
        source: 'seed',
        errorCount: 1,
        lastSeenAt: null,
        createdAt: Date.now(),
      },
    ])
    await router.push('/topics/ec2')
    await router.isReady()
    const wrapper = mount(TopicDetailView, {
      global: { plugins: [router, createPinia()] },
    })
    await flush()
    const el = wrapper.find('[data-test="difficult-count"]')
    expect(el.exists()).toBe(true)
    expect(el.text()).toContain('2')
  })

  it('shows session history for sessions that included this topic', async () => {
    const now = Date.now()
    await db.sessions.bulkAdd([
      {
        startedAt: now - 86400000,
        completedAt: now - 86390000,
        mode: 'mixed',
        topicIds: ['ec2', 's3'],
        totalQuestions: 10,
        correctCount: 8,
        durationMs: 10000,
      },
      {
        startedAt: now - 172800000,
        completedAt: now - 172790000,
        mode: 'mixed',
        topicIds: ['s3'],
        totalQuestions: 5,
        correctCount: 3,
        durationMs: 5000,
      },
    ])
    await router.push('/topics/ec2')
    await router.isReady()
    const wrapper = mount(TopicDetailView, {
      global: { plugins: [router, createPinia()] },
    })
    await flush()
    const items = wrapper.findAll('[data-test="session-history-item"]')
    expect(items).toHaveLength(1)
  })

  it('session history shows correct percentage', async () => {
    const now = Date.now()
    await db.sessions.add({
      startedAt: now - 86400000,
      completedAt: now - 86390000,
      mode: 'mixed',
      topicIds: ['ec2'],
      totalQuestions: 10,
      correctCount: 7,
      durationMs: 10000,
    })
    await router.push('/topics/ec2')
    await router.isReady()
    const wrapper = mount(TopicDetailView, {
      global: { plugins: [router, createPinia()] },
    })
    await flush()
    const item = wrapper.find('[data-test="session-history-item"]')
    expect(item.text()).toContain('70')
  })

  it('redirects to /topics for unknown topic id', async () => {
    await router.push('/topics/nonexistent')
    await router.isReady()
    mount(TopicDetailView, {
      global: { plugins: [router, createPinia()] },
    })
    await flush()
    expect(router.currentRoute.value.path).toBe('/topics')
  })

  it('shows EmptyState when topic has no questions', async () => {
    await db.questions.clear()
    await router.push('/topics/ec2')
    await router.isReady()
    const wrapper = mount(TopicDetailView, {
      global: { plugins: [router, createPinia()] },
    })
    await flush()
    expect(wrapper.find('.empty-state').exists()).toBe(true)
  })

  it('does not show EmptyState when topic has questions', async () => {
    await router.push('/topics/ec2')
    await router.isReady()
    const wrapper = mount(TopicDetailView, {
      global: { plugins: [router, createPinia()] },
    })
    await flush()
    expect(wrapper.find('.empty-state').exists()).toBe(false)
  })
})
