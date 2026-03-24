import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import Dexie from 'dexie'
import type { Question, Topic } from '@/types'

async function freshDb() {
  const name = `TestExamDB_${Math.random().toString(36).slice(2)}`
  class TestDB extends Dexie {
    questions!: Dexie.Table<Question>
    topics!: Dexie.Table<Topic>
    constructor() {
      super(name)
      this.version(1).stores({
        questions: '++id, topicId, errorCount, lastSeenAt',
        topics: '++id, &topicId',
      })
    }
  }
  return new TestDB()
}

describe('seed/seedIfNeeded', () => {
  it('populates questions (100-200) and topics (17) on first call', async () => {
    const db = await freshDb()
    const { seedIfNeeded } = await import('@/db/seed')
    await seedIfNeeded(db as any)

    const qCount = await db.questions.count()
    const tCount = await db.topics.count()

    expect(qCount).toBeGreaterThanOrEqual(100)
    expect(qCount).toBeLessThanOrEqual(200)
    expect(tCount).toBe(17)
  })

  it('is idempotent -- second call does not add more records', async () => {
    const db = await freshDb()
    const { seedIfNeeded } = await import('@/db/seed')
    await seedIfNeeded(db as any)
    const qAfterFirst = await db.questions.count()
    const tAfterFirst = await db.topics.count()

    await seedIfNeeded(db as any)
    const qAfterSecond = await db.questions.count()
    const tAfterSecond = await db.topics.count()

    expect(qAfterSecond).toBe(qAfterFirst)
    expect(tAfterSecond).toBe(tAfterFirst)
  })

  it('every question has source="seed", errorCount=0, lastSeenAt=null', async () => {
    const db = await freshDb()
    const { seedIfNeeded } = await import('@/db/seed')
    await seedIfNeeded(db as any)

    const questions = await db.questions.toArray()
    for (const q of questions) {
      expect(q.source).toBe('seed')
      expect(q.errorCount).toBe(0)
      expect(q.lastSeenAt).toBeNull()
    }
  })

  it('every question has a valid topicId from TOPIC_DEFINITIONS', async () => {
    const db = await freshDb()
    const { seedIfNeeded } = await import('@/db/seed')
    const { TOPIC_DEFINITIONS } = await import('@/data/topics')
    await seedIfNeeded(db as any)

    const validIds = new Set(TOPIC_DEFINITIONS.map((t) => t.topicId))
    const questions = await db.questions.toArray()
    for (const q of questions) {
      expect(validIds.has(q.topicId)).toBe(true)
    }
  })

  it('every question has required fields: text, options (array), correctIndex, explanation, createdAt', async () => {
    const db = await freshDb()
    const { seedIfNeeded } = await import('@/db/seed')
    await seedIfNeeded(db as any)

    const questions = await db.questions.toArray()
    for (const q of questions) {
      expect(typeof q.text).toBe('string')
      expect(Array.isArray(q.options)).toBe(true)
      expect(q.options.length).toBeGreaterThanOrEqual(2)
      expect(typeof q.correctIndex).toBe('number')
      expect(typeof q.explanation).toBe('string')
      expect(typeof q.createdAt).toBe('number')
    }
  })

  it('TOPIC_DEFINITIONS has exactly 17 entries', async () => {
    const { TOPIC_DEFINITIONS } = await import('@/data/topics')
    expect(TOPIC_DEFINITIONS).toHaveLength(17)
  })
})
