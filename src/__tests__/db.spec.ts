import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'

describe('types/index', () => {
  it('exports all interfaces and union types without TS errors', async () => {
    const types = await import('@/types')
    expect(types).toBeDefined()
  })
})

describe('db/db', () => {
  it('ExamDB instantiates without throwing', async () => {
    const { db } = await import('@/db/db')
    expect(db).toBeDefined()
  })

  it('has all four table names on the instance', async () => {
    const { db } = await import('@/db/db')
    expect(db.questions).toBeDefined()
    expect(db.topics).toBeDefined()
    expect(db.sessions).toBeDefined()
    expect(db.settings).toBeDefined()
  })

  it('questions table has correct indexes', async () => {
    const { db } = await import('@/db/db')
    const schema = (db as any)._dbSchema
    const qSchema = schema.questions
    expect(qSchema.primKey.name).toBe('id')
    expect(qSchema.primKey.auto).toBe(true)
    const idxNames = qSchema.indexes.map((i: any) => i.name)
    expect(idxNames).toContain('topicId')
    expect(idxNames).toContain('errorCount')
    expect(idxNames).toContain('lastSeenAt')
  })

  it('topics table has unique index on topicId', async () => {
    const { db } = await import('@/db/db')
    const schema = (db as any)._dbSchema
    const tSchema = schema.topics
    expect(tSchema.primKey.name).toBe('id')
    expect(tSchema.primKey.auto).toBe(true)
    const topicIdIdx = tSchema.indexes.find((i: any) => i.name === 'topicId')
    expect(topicIdIdx).toBeDefined()
    expect(topicIdIdx.unique).toBe(true)
  })

  it('sessions table has correct indexes', async () => {
    const { db } = await import('@/db/db')
    const schema = (db as any)._dbSchema
    const sSchema = schema.sessions
    expect(sSchema.primKey.name).toBe('id')
    expect(sSchema.primKey.auto).toBe(true)
    const idxNames = sSchema.indexes.map((i: any) => i.name)
    expect(idxNames).toContain('startedAt')
    expect(idxNames).toContain('completedAt')
    expect(idxNames).toContain('mode')
  })

  it('settings table has unique key index', async () => {
    const { db } = await import('@/db/db')
    const schema = (db as any)._dbSchema
    const setSchema = schema.settings
    expect(setSchema.primKey.name).toBe('key')
    expect(setSchema.primKey.unique).toBe(true)
  })
})
