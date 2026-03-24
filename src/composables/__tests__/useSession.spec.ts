import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { ExamDB } from '@/db/db'
import type { Question } from '@/types'

let db: ExamDB

function makeQuestion(overrides: Partial<Question> & { topicId: string }): Omit<Question, 'id'> {
  return {
    text: 'Sample question?',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    explanation: 'Because A.',
    source: 'seed',
    errorCount: 0,
    lastSeenAt: null,
    createdAt: Date.now(),
    ...overrides,
  }
}

beforeEach(async () => {
  const name = `TestDB_${Math.random().toString(36).slice(2)}`
  db = new ExamDB(name)
  await db.open()
})

describe('buildQuestionQueue', () => {
  it('new mode returns only questions with lastSeenAt = null', async () => {
    await db.questions.bulkAdd([
      makeQuestion({ topicId: 'ec2', lastSeenAt: null }),
      makeQuestion({ topicId: 'ec2', lastSeenAt: 123456 }),
      makeQuestion({ topicId: 'ec2', lastSeenAt: null }),
    ])

    const { buildQuestionQueue } = await import('@/composables/useSession')
    const queue = await buildQuestionQueue(
      { topicIds: ['ec2'], mode: 'new', questionCount: 10, feedbackMode: 'study', timerEnabled: false, timerSeconds: 0 },
      db,
    )

    expect(queue.length).toBe(2)
    expect(queue.every((q) => q.lastSeenAt === null)).toBe(true)
  })

  it('difficult mode returns only questions with errorCount >= 2', async () => {
    await db.questions.bulkAdd([
      makeQuestion({ topicId: 'ec2', errorCount: 0 }),
      makeQuestion({ topicId: 'ec2', errorCount: 1 }),
      makeQuestion({ topicId: 'ec2', errorCount: 2 }),
      makeQuestion({ topicId: 'ec2', errorCount: 3 }),
    ])

    const { buildQuestionQueue } = await import('@/composables/useSession')
    const queue = await buildQuestionQueue(
      { topicIds: ['ec2'], mode: 'difficult', questionCount: 10, feedbackMode: 'study', timerEnabled: false, timerSeconds: 0 },
      db,
    )

    expect(queue.length).toBe(2)
    expect(queue.every((q) => q.errorCount >= 2)).toBe(true)
  })

  it('review mode returns only questions with lastSeenAt not null', async () => {
    await db.questions.bulkAdd([
      makeQuestion({ topicId: 'ec2', lastSeenAt: null }),
      makeQuestion({ topicId: 'ec2', lastSeenAt: 100 }),
      makeQuestion({ topicId: 'ec2', lastSeenAt: 200 }),
    ])

    const { buildQuestionQueue } = await import('@/composables/useSession')
    const queue = await buildQuestionQueue(
      { topicIds: ['ec2'], mode: 'review', questionCount: 10, feedbackMode: 'study', timerEnabled: false, timerSeconds: 0 },
      db,
    )

    expect(queue.length).toBe(2)
    expect(queue.every((q) => q.lastSeenAt !== null)).toBe(true)
  })

  it('mixed mode returns any questions', async () => {
    await db.questions.bulkAdd([
      makeQuestion({ topicId: 'ec2', lastSeenAt: null, errorCount: 0 }),
      makeQuestion({ topicId: 'ec2', lastSeenAt: 100, errorCount: 3 }),
      makeQuestion({ topicId: 'ec2', lastSeenAt: 200, errorCount: 1 }),
    ])

    const { buildQuestionQueue } = await import('@/composables/useSession')
    const queue = await buildQuestionQueue(
      { topicIds: ['ec2'], mode: 'mixed', questionCount: 10, feedbackMode: 'study', timerEnabled: false, timerSeconds: 0 },
      db,
    )

    expect(queue.length).toBe(3)
  })

  it('topic filter: only returns questions matching given topicIds', async () => {
    await db.questions.bulkAdd([
      makeQuestion({ topicId: 'ec2' }),
      makeQuestion({ topicId: 's3' }),
      makeQuestion({ topicId: 'vpc' }),
    ])

    const { buildQuestionQueue } = await import('@/composables/useSession')
    const queue = await buildQuestionQueue(
      { topicIds: ['ec2', 's3'], mode: 'mixed', questionCount: 10, feedbackMode: 'study', timerEnabled: false, timerSeconds: 0 },
      db,
    )

    expect(queue.length).toBe(2)
    expect(queue.every((q) => ['ec2', 's3'].includes(q.topicId))).toBe(true)
  })

  it('count slice: queue length does not exceed requested count', async () => {
    await db.questions.bulkAdd(
      Array.from({ length: 20 }, (_, i) => makeQuestion({ topicId: 'ec2', text: `Question ${i}` })),
    )

    const { buildQuestionQueue } = await import('@/composables/useSession')
    const queue = await buildQuestionQueue(
      { topicIds: ['ec2'], mode: 'mixed', questionCount: 5, feedbackMode: 'study', timerEnabled: false, timerSeconds: 0 },
      db,
    )

    expect(queue.length).toBe(5)
  })

  it('topic filter combined with new mode', async () => {
    await db.questions.bulkAdd([
      makeQuestion({ topicId: 'ec2', lastSeenAt: null }),
      makeQuestion({ topicId: 'ec2', lastSeenAt: 100 }),
      makeQuestion({ topicId: 's3', lastSeenAt: null }),
      makeQuestion({ topicId: 'vpc', lastSeenAt: null }),
    ])

    const { buildQuestionQueue } = await import('@/composables/useSession')
    const queue = await buildQuestionQueue(
      { topicIds: ['ec2', 's3'], mode: 'new', questionCount: 10, feedbackMode: 'study', timerEnabled: false, timerSeconds: 0 },
      db,
    )

    expect(queue.length).toBe(2)
    expect(queue.every((q) => ['ec2', 's3'].includes(q.topicId) && q.lastSeenAt === null)).toBe(true)
  })

  it('topic filter combined with difficult mode', async () => {
    await db.questions.bulkAdd([
      makeQuestion({ topicId: 'ec2', errorCount: 2 }),
      makeQuestion({ topicId: 's3', errorCount: 2 }),
      makeQuestion({ topicId: 'vpc', errorCount: 2 }),
    ])

    const { buildQuestionQueue } = await import('@/composables/useSession')
    const queue = await buildQuestionQueue(
      { topicIds: ['ec2'], mode: 'difficult', questionCount: 10, feedbackMode: 'study', timerEnabled: false, timerSeconds: 0 },
      db,
    )

    expect(queue.length).toBe(1)
    expect(queue[0].topicId).toBe('ec2')
  })

  it('topic filter combined with review mode', async () => {
    await db.questions.bulkAdd([
      makeQuestion({ topicId: 'ec2', lastSeenAt: 100 }),
      makeQuestion({ topicId: 's3', lastSeenAt: 100 }),
      makeQuestion({ topicId: 'vpc', lastSeenAt: 100 }),
    ])

    const { buildQuestionQueue } = await import('@/composables/useSession')
    const queue = await buildQuestionQueue(
      { topicIds: ['s3', 'vpc'], mode: 'review', questionCount: 10, feedbackMode: 'study', timerEnabled: false, timerSeconds: 0 },
      db,
    )

    expect(queue.length).toBe(2)
    expect(queue.every((q) => ['s3', 'vpc'].includes(q.topicId))).toBe(true)
  })
})
