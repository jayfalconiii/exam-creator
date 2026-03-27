import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { detectBackupFormat, buildBackup } from '@/utils/backup'

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
