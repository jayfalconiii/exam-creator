import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { db } from '@/db/db'
import { TOPIC_DEFINITIONS } from '@/data/topics'

describe('useTopicsStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.topics.clear()
    await db.topics.bulkAdd(TOPIC_DEFINITIONS.map((t) => ({ ...t })))
  })

  it('topicsWithEffectiveScore loads 17 topics from db.topics', async () => {
    const { useTopicsStore } = await import('@/stores/topics')
    const store = useTopicsStore()
    await store.refreshTopics()
    expect(store.topicsWithEffectiveScore).toHaveLength(17)
  })

  it('each topic has effectiveScore applying SR decay at read time', async () => {
    const { useTopicsStore } = await import('@/stores/topics')
    const store = useTopicsStore()
    await db.topics.where('topicId').equals('ec2').modify({ rawScore: 80, lastReviewedAt: Date.now() })
    await store.refreshTopics()
    const ec2 = store.topicsWithEffectiveScore.find((t) => t.topicId === 'ec2')
    expect(ec2).toBeDefined()
    expect(ec2!.effectiveScore).toBeGreaterThan(0)
    expect(ec2!.effectiveScore).toBeLessThanOrEqual(80)
  })

  it('topics show score 0 and gray on first launch (never reviewed)', async () => {
    const { useTopicsStore } = await import('@/stores/topics')
    const store = useTopicsStore()
    await store.refreshTopics()
    for (const t of store.topicsWithEffectiveScore) {
      expect(t.effectiveScore).toBe(0)
      expect(t.color).toBe('gray')
    }
  })

  it('refreshTopics re-queries DB and updates state reactively', async () => {
    const { useTopicsStore } = await import('@/stores/topics')
    const store = useTopicsStore()
    await store.refreshTopics()
    expect(store.topicsWithEffectiveScore).toHaveLength(17)
    await db.topics.where('topicId').equals('s3').modify({ rawScore: 75, lastReviewedAt: Date.now() })
    await store.refreshTopics()
    const s3 = store.topicsWithEffectiveScore.find((t) => t.topicId === 's3')
    expect(s3!.effectiveScore).toBeGreaterThan(0)
  })
})
