import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Dexie from 'dexie'
import type { Question, Topic, Session, Setting } from '@/types'

const mockCreate = vi.fn()

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      stream: mockCreate,
    }
  },
}))

function freshDb() {
  const name = `TestExamDB_${Math.random().toString(36).slice(2)}`
  class TestDB extends Dexie {
    questions!: Dexie.Table<Question>
    topics!: Dexie.Table<Topic>
    sessions!: Dexie.Table<Session>
    settings!: Dexie.Table<Setting>
    constructor() {
      super(name)
      this.version(1).stores({
        questions: '++id, topicId, errorCount, lastSeenAt',
        topics: '++id, &topicId',
        sessions: '++id, startedAt, completedAt, mode',
        settings: '&key',
      })
    }
  }
  return new TestDB()
}

const validQuestions = [
  {
    topicId: 'ec2',
    text: 'What is EC2?',
    options: ['A virtual machine service', 'A storage service', 'A database service', 'A CDN service'],
    correctIndex: 0,
    explanation: 'EC2 is Amazon Elastic Compute Cloud, a virtual machine service.',
  },
]

describe('useQuestionGenerator', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('valid response → questions persisted to DB and returned with IDs', async () => {
    mockCreate.mockReturnValue({
      finalText: async () => JSON.stringify(validQuestions),
    })

    const db = freshDb() as any
    const { useQuestionGenerator } = await import('@/composables/useQuestionGenerator')
    const result = await useQuestionGenerator({ topicIds: ['ec2'], count: 1, apiKey: 'test-key', db })

    expect(result).toHaveLength(1)
    expect(result[0].id).toBeDefined()
    expect(result[0].source).toBe('generated')
    expect(result[0].topicId).toBe('ec2')

    const dbCount = await db.questions.count()
    expect(dbCount).toBe(1)
  })

  it('malformed JSON response → returns empty array, no DB writes', async () => {
    mockCreate.mockReturnValue({
      finalText: async () => 'this is not valid json {{{',
    })

    const db = freshDb() as any
    const { useQuestionGenerator } = await import('@/composables/useQuestionGenerator')
    const result = await useQuestionGenerator({ topicIds: ['ec2'], count: 1, apiKey: 'test-key', db })

    expect(result).toEqual([])
    const dbCount = await db.questions.count()
    expect(dbCount).toBe(0)
  })

  it('offline → returns empty array without calling SDK', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true, writable: true })

    const db = freshDb() as any
    const { useQuestionGenerator } = await import('@/composables/useQuestionGenerator')
    const result = await useQuestionGenerator({ topicIds: ['ec2'], count: 1, apiKey: 'test-key', db })

    expect(result).toEqual([])
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('API error → returns empty array gracefully', async () => {
    mockCreate.mockRejectedValue(new Error('API error: 401 Unauthorized'))

    const db = freshDb() as any
    const { useQuestionGenerator } = await import('@/composables/useQuestionGenerator')
    const result = await useQuestionGenerator({ topicIds: ['ec2'], count: 1, apiKey: 'bad-key', db })

    expect(result).toEqual([])
    const dbCount = await db.questions.count()
    expect(dbCount).toBe(0)
  })
})
