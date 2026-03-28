import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { detectBackupFormat, buildBackup, mergeBackup } from '@/utils/backup'

describe('detectBackupFormat', () => {
  it("returns 'backup' for object with version:1, questions, topics", () => {
    const input = { version: 1, questions: [], topics: [] }
    expect(detectBackupFormat(input)).toBe('backup')
  })

  it("returns 'questions' for a plain array", () => {
    expect(detectBackupFormat([])).toBe('questions')
    expect(detectBackupFormat([{ text: 'q1' }])).toBe('questions')
  })

  it("returns 'unknown' for unrecognised inputs (string, null, number, partial object)", () => {
    expect(detectBackupFormat('not valid')).toBe('unknown')
    expect(detectBackupFormat(null)).toBe('unknown')
    expect(detectBackupFormat(42)).toBe('unknown')
    expect(detectBackupFormat({ version: 1 })).toBe('unknown')
    expect(detectBackupFormat({ questions: [], topics: [] })).toBe('unknown')
  })

  it("returns 'unknown' for backup-shaped object with unrecognised version", () => {
    expect(detectBackupFormat({ version: 2, questions: [], topics: [] })).toBe('unknown')
    expect(detectBackupFormat({ version: 99, questions: [], topics: [] })).toBe('unknown')
    expect(detectBackupFormat({ version: 0, questions: [], topics: [] })).toBe('unknown')
  })
})

describe('buildBackup', () => {
  beforeEach(async () => {
    const { db } = await import('@/db/db')
    await db.questions.clear()
    await db.topics.clear()
  })

  it('returns a BackupFile with version 1 and empty arrays when db is empty', async () => {
    const result = await buildBackup()
    expect(result.version).toBe(1)
    expect(result.questions).toEqual([])
    expect(result.topics).toEqual([])
  })

  it('returns a BackupFile with version 1 and populated arrays when db has data', async () => {
    const { db } = await import('@/db/db')
    await db.questions.add({
      topicId: 'ec2',
      text: 'What is EC2?',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 0,
      explanation: 'Compute.',
      source: 'seed',
      errorCount: 0,
      lastSeenAt: null,
      createdAt: Date.now(),
    })
    const result = await buildBackup()
    expect(result.questions).toHaveLength(1)
  })

  it('strips id from questions and topics', async () => {
    const { db } = await import('@/db/db')
    await db.questions.add({
      topicId: 'ec2',
      text: 'What is EC2?',
      options: ['A', 'B'],
      correctIndex: 0,
      explanation: 'EC2 is compute.',
      source: 'seed',
      errorCount: 0,
      lastSeenAt: null,
      createdAt: Date.now(),
    })
    await db.topics.add({
      topicId: 'ec2',
      name: 'EC2',
      color: '#1565c0',
      rawScore: 0,
      lastReviewedAt: null,
      totalSessions: 0,
    })

    const result = await buildBackup()
    expect(result.questions).toHaveLength(1)
    expect(result.questions[0]).not.toHaveProperty('id')
    expect(result.questions[0].text).toBe('What is EC2?')
    expect(result.topics).toHaveLength(1)
    expect(result.topics[0]).not.toHaveProperty('id')
    expect(result.topics[0].name).toBe('EC2')
  })
})

const baseQuestion = {
  topicId: 'ec2',
  text: 'What is EC2?',
  options: ['A', 'B', 'C', 'D'] as string[],
  correctIndex: 0,
  explanation: 'Compute.',
  source: 'seed' as const,
  lastSeenAt: null as number | null,
  createdAt: Date.now(),
}

describe('mergeBackup', () => {
  beforeEach(async () => {
    const { db } = await import('@/db/db')
    await db.questions.clear()
    await db.topics.clear()
  })

  it('merge (questions only): keeps higher errorCount for duplicate (topicId + text)', async () => {
    const { db } = await import('@/db/db')
    await db.questions.add({ ...baseQuestion, errorCount: 2 })

    const backup = {
      version: 1 as const,
      questions: [{ ...baseQuestion, errorCount: 5 }],
      topics: [],
    }

    await mergeBackup(backup, 'questions')

    const dbQuestions = await db.questions.toArray()
    expect(dbQuestions).toHaveLength(1)
    expect(dbQuestions[0].errorCount).toBe(5)
  })

  it('merge (questions only): inserts unmatched backup questions as new', async () => {
    const { db } = await import('@/db/db')
    await db.questions.add({ ...baseQuestion, errorCount: 0 })

    const backup = {
      version: 1 as const,
      questions: [{ ...baseQuestion, topicId: 's3', text: 'What is S3?', errorCount: 1 }],
      topics: [],
    }

    await mergeBackup(backup, 'questions')

    const dbQuestions = await db.questions.toArray()
    expect(dbQuestions).toHaveLength(2)
    expect(dbQuestions.some((q) => q.text === 'What is S3?')).toBe(true)
  })

  it('merge (questions only): leaves topics table untouched', async () => {
    const { db } = await import('@/db/db')
    await db.topics.add({ topicId: 'ec2', name: 'EC2', color: '#000', rawScore: 10, lastReviewedAt: null, totalSessions: 3 })

    const backup = {
      version: 1 as const,
      questions: [],
      topics: [{ topicId: 's3', name: 'S3', color: '#111', rawScore: 0, lastReviewedAt: null, totalSessions: 0 }],
    }

    await mergeBackup(backup, 'questions')

    const dbTopics = await db.topics.toArray()
    expect(dbTopics).toHaveLength(1)
    expect(dbTopics[0].topicId).toBe('ec2')
  })

  it('merge (questions + scores): existing topics kept as-is, new topics inserted', async () => {
    const { db } = await import('@/db/db')
    await db.topics.add({ topicId: 'ec2', name: 'EC2', color: '#aaa', rawScore: 99, lastReviewedAt: null, totalSessions: 5 })

    const backup = {
      version: 1 as const,
      questions: [],
      topics: [
        { topicId: 'ec2', name: 'EC2 backup', color: '#000', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
        { topicId: 's3', name: 'S3', color: '#111', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
      ],
    }

    await mergeBackup(backup, 'questions-and-scores')

    const dbTopics = await db.topics.toArray()
    expect(dbTopics).toHaveLength(2)
    const ec2 = dbTopics.find((t) => t.topicId === 'ec2')!
    expect(ec2.rawScore).toBe(99) // local kept
    expect(ec2.name).toBe('EC2')  // local kept
    expect(dbTopics.some((t) => t.topicId === 's3')).toBe(true)
  })

  it('after merge no duplicate questions exist (same topicId + text)', async () => {
    const { db } = await import('@/db/db')
    await db.questions.add({ ...baseQuestion, errorCount: 1 })
    await db.questions.add({ ...baseQuestion, errorCount: 3 })

    const backup = {
      version: 1 as const,
      questions: [{ ...baseQuestion, errorCount: 2 }],
      topics: [],
    }

    await mergeBackup(backup, 'questions')

    const dbQuestions = await db.questions.toArray()
    const sameKey = dbQuestions.filter((q) => q.topicId === baseQuestion.topicId && q.text === baseQuestion.text)
    expect(sameKey).toHaveLength(1)
    expect(sameKey[0].errorCount).toBe(3)
  })
})
