import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { db } from '@/db/db'
import StatsView from '@/views/StatsView.vue'
import type { Session } from '@/types'

const SESSION_A: Omit<Session, 'id'> = {
  startedAt: new Date('2024-01-10T10:00:00Z').getTime(),
  completedAt: new Date('2024-01-10T10:15:00Z').getTime(),
  mode: 'review',
  topicIds: ['ec2', 's3'],
  totalQuestions: 10,
  correctCount: 8,
  durationMs: 15 * 60 * 1000,
}

const SESSION_B: Omit<Session, 'id'> = {
  startedAt: new Date('2024-01-12T09:00:00Z').getTime(),
  completedAt: new Date('2024-01-12T09:20:00Z').getTime(),
  mode: 'difficult',
  topicIds: ['iam'],
  totalQuestions: 5,
  correctCount: 3,
  durationMs: 20 * 60 * 1000,
}

function mountStatsView() {
  return mount(StatsView)
}

describe('StatsView — empty', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.sessions.clear()
  })

  it('shows empty state when no sessions', async () => {
    const wrapper = mountStatsView()
    await flushPromises()
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="session-list"]').exists()).toBe(false)
  })
})

describe('StatsView — with sessions', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.sessions.clear()
    await db.sessions.bulkAdd([{ ...SESSION_A }, { ...SESSION_B }])
  })

  it('hides empty state and shows session list when sessions exist', async () => {
    const wrapper = mountStatsView()
    await flushPromises()
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="session-list"]').exists()).toBe(true)
  })

  it('renders one row per completed session', async () => {
    const wrapper = mountStatsView()
    await flushPromises()
    const rows = wrapper.findAll('[data-testid="session-row"]')
    expect(rows).toHaveLength(2)
  })

  it('renders sessions in reverse-chronological order', async () => {
    const wrapper = mountStatsView()
    await flushPromises()
    const rows = wrapper.findAll('[data-testid="session-row"]')
    // SESSION_B (Jan 12) should appear before SESSION_A (Jan 10)
    expect(rows[0].text()).toContain('difficult')
    expect(rows[1].text()).toContain('review')
  })

  it('each row shows score', async () => {
    const wrapper = mountStatsView()
    await flushPromises()
    const rows = wrapper.findAll('[data-testid="session-row"]')
    const firstRow = rows[0] // SESSION_B (difficult, 3/5)
    expect(firstRow.find('[data-testid="session-score"]').text()).toContain('3')
    expect(firstRow.find('[data-testid="session-score"]').text()).toContain('5')
  })

  it('each row shows date and mode', async () => {
    const wrapper = mountStatsView()
    await flushPromises()
    const row = wrapper.findAll('[data-testid="session-row"]')[0]
    expect(row.find('[data-testid="session-date"]').exists()).toBe(true)
    expect(row.find('[data-testid="session-mode"]').text()).toContain('difficult')
  })

  it('each row shows duration', async () => {
    const wrapper = mountStatsView()
    await flushPromises()
    const row = wrapper.find('[data-testid="session-row"]')
    expect(row.find('[data-testid="session-duration"]').exists()).toBe(true)
  })

  it('overall stats show total sessions count', async () => {
    const wrapper = mountStatsView()
    await flushPromises()
    expect(wrapper.find('[data-testid="stat-total-sessions"]').text()).toContain('2')
  })

  it('overall stats show total questions answered', async () => {
    const wrapper = mountStatsView()
    await flushPromises()
    // 10 + 5 = 15
    expect(wrapper.find('[data-testid="stat-total-questions"]').text()).toContain('15')
  })

  it('overall stats show overall correct %', async () => {
    const wrapper = mountStatsView()
    await flushPromises()
    // (8+3) / (10+5) = 11/15 ≈ 73%
    const pctEl = wrapper.find('[data-testid="stat-correct-pct"]')
    expect(pctEl.text()).toContain('73')
  })
})
