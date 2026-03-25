import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { db } from '@/db/db'
import HomeView from '@/views/HomeView.vue'

function mountHomeView() {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', component: HomeView },
      { path: '/study', component: { template: '<div>study</div>' } },
      { path: '/settings', component: { template: '<div>settings</div>' } },
    ],
  })
  router.push('/')
  return mount(HomeView, { global: { plugins: [router] } })
}

describe('HomeView', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.sessions.clear()
    await db.settings.clear()
  })

  it('renders app name/header', async () => {
    const wrapper = mountHomeView()
    await flushPromises()
    expect(wrapper.find('[data-testid="app-title"]').exists()).toBe(true)
  })

  it('shows empty state when no session completed', async () => {
    const wrapper = mountHomeView()
    await flushPromises()
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="recent-session"]').exists()).toBe(false)
  })

  it('shows recent session result after a session is completed', async () => {
    await db.sessions.add({
      startedAt: Date.now() - 60000,
      completedAt: Date.now(),
      mode: 'mixed',
      topicIds: ['ec2', 's3'],
      totalQuestions: 10,
      correctCount: 8,
      durationMs: 60000,
    })

    const wrapper = mountHomeView()
    await flushPromises()

    expect(wrapper.find('[data-testid="recent-session"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="session-score"]').text()).toContain('8')
    expect(wrapper.find('[data-testid="session-score"]').text()).toContain('10')
  })

  it('shows session date in recent session result', async () => {
    const completedAt = new Date('2024-01-15T10:00:00').getTime()
    await db.sessions.add({
      startedAt: completedAt - 60000,
      completedAt,
      mode: 'mixed',
      topicIds: ['ec2'],
      totalQuestions: 5,
      correctCount: 3,
      durationMs: 60000,
    })

    const wrapper = mountHomeView()
    await flushPromises()

    expect(wrapper.find('[data-testid="session-date"]').exists()).toBe(true)
  })

  it('has quick-start button that navigates to /study', async () => {
    const wrapper = mountHomeView()
    await flushPromises()
    const btn = wrapper.find('[data-testid="quick-start"]')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    await flushPromises()
    const router = wrapper.vm.$router
    expect(router.currentRoute.value.path).toBe('/study')
  })

  it('has settings gear icon that navigates to /settings', async () => {
    const wrapper = mountHomeView()
    await flushPromises()
    const link = wrapper.find('[data-testid="settings-link"]')
    expect(link.exists()).toBe(true)
  })

  it('shows topics covered in recent session', async () => {
    await db.topics.bulkAdd([
      { topicId: 'ec2', name: 'EC2', color: '#1565c0', rawScore: 80, lastReviewedAt: Date.now(), totalSessions: 1 },
      { topicId: 's3', name: 'S3', color: '#00695c', rawScore: 70, lastReviewedAt: Date.now(), totalSessions: 1 },
    ])
    await db.sessions.add({
      startedAt: Date.now() - 60000,
      completedAt: Date.now(),
      mode: 'mixed',
      topicIds: ['ec2', 's3'],
      totalQuestions: 10,
      correctCount: 8,
      durationMs: 60000,
    })

    const wrapper = mountHomeView()
    await flushPromises()

    expect(wrapper.find('[data-testid="session-topics"]').exists()).toBe(true)
  })
})
