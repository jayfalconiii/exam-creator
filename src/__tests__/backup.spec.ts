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
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 0,
  explanation: 'x',
  source: 'seed' as const,
  lastSeenAt: null,
  createdAt: Date.now(),
}

const baseTopic = {
  color: '#000',
  rawScore: 0,
  lastReviewedAt: null,
  totalSessions: 0,
}

describe('mergeBackup', () => {
  beforeEach(async () => {
    const { db } = await import('@/db/db')
    await db.questions.clear()
    await db.topics.clear()
  })

  it('keeps higher errorCount for overlapping questions (questions scope)', async () => {
    const { db } = await import('@/db/db')
    await db.questions.add({ ...baseQuestion, topicId: 'ec2', text: 'What is EC2?', errorCount: 3 })

    const backup = {
      version: 1 as const,
      questions: [{ ...baseQuestion, topicId: 'ec2', text: 'What is EC2?', errorCount: 7 }],
      topics: [],
    }

    await mergeBackup(backup, 'questions')

    const all = await db.questions.toArray()
    expect(all).toHaveLength(1)
    expect(all[0].errorCount).toBe(7)
  })

  it('keeps local errorCount when it is higher', async () => {
    const { db } = await import('@/db/db')
    await db.questions.add({ ...baseQuestion, topicId: 'ec2', text: 'What is EC2?', errorCount: 10 })

    const backup = {
      version: 1 as const,
      questions: [{ ...baseQuestion, topicId: 'ec2', text: 'What is EC2?', errorCount: 2 }],
      topics: [],
    }

    await mergeBackup(backup, 'questions')

    const all = await db.questions.toArray()
    expect(all).toHaveLength(1)
    expect(all[0].errorCount).toBe(10)
  })

  it('inserts new questions that do not exist locally', async () => {
    const { db } = await import('@/db/db')

    const backup = {
      version: 1 as const,
      questions: [{ ...baseQuestion, topicId: 'ec2', text: 'New question', errorCount: 0 }],
      topics: [],
    }

    await mergeBackup(backup, 'questions')

    const all = await db.questions.toArray()
    expect(all).toHaveLength(1)
    expect(all[0].text).toBe('New question')
  })

  it('questions-only scope leaves topics table untouched', async () => {
    const { db } = await import('@/db/db')
    await db.topics.add({ ...baseTopic, topicId: 'local', name: 'Local' })

    const backup = {
      version: 1 as const,
      questions: [],
      topics: [{ ...baseTopic, topicId: 'backup-topic', name: 'Backup Topic' }],
    }

    await mergeBackup(backup, 'questions')

    const allTopics = await db.topics.toArray()
    expect(allTopics).toHaveLength(1)
    expect(allTopics[0].topicId).toBe('local')
  })

  it('questions-and-scores scope inserts new topics, keeps existing ones unchanged', async () => {
    const { db } = await import('@/db/db')
    await db.topics.add({ ...baseTopic, topicId: 'ec2', name: 'EC2 Local', rawScore: 5 })

    const backup = {
      version: 1 as const,
      questions: [],
      topics: [
        { ...baseTopic, topicId: 'ec2', name: 'EC2 Backup', rawScore: 99 },
        { ...baseTopic, topicId: 's3', name: 'S3', rawScore: 3 },
      ],
    }

    await mergeBackup(backup, 'questions-and-scores')

    const allTopics = await db.topics.toArray()
    expect(allTopics).toHaveLength(2)

    const ec2 = allTopics.find((t) => t.topicId === 'ec2')
    expect(ec2?.name).toBe('EC2 Local')
    expect(ec2?.rawScore).toBe(5)

    const s3 = allTopics.find((t) => t.topicId === 's3')
    expect(s3).toBeDefined()
    expect(s3?.name).toBe('S3')
  })

  it('no duplicate questions after merge with overlapping data', async () => {
    const { db } = await import('@/db/db')
    await db.questions.add({ ...baseQuestion, topicId: 'ec2', text: 'What is EC2?', errorCount: 1 })
    await db.questions.add({ ...baseQuestion, topicId: 'ec2', text: 'What is S3?', errorCount: 0 })

    const backup = {
      version: 1 as const,
      questions: [
        { ...baseQuestion, topicId: 'ec2', text: 'What is EC2?', errorCount: 5 },
        { ...baseQuestion, topicId: 'ec2', text: 'What is Lambda?', errorCount: 0 },
      ],
      topics: [],
    }

    await mergeBackup(backup, 'questions')

    const all = await db.questions.toArray()
    const texts = all.map((q) => q.text)
    expect(texts).toContain('What is EC2?')
    expect(texts).toContain('What is S3?')
    expect(texts).toContain('What is Lambda?')
    expect(all).toHaveLength(3)

    const ec2 = all.find((q) => q.text === 'What is EC2?')
    expect(ec2?.errorCount).toBe(5)
  })
})
