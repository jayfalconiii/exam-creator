import Dexie, { type Table } from 'dexie'
import type { Question, Topic, Session, Setting } from '@/types'

export class ExamDB extends Dexie {
  questions!: Table<Question>
  topics!: Table<Topic>
  sessions!: Table<Session>
  settings!: Table<Setting>

  constructor(name = 'ExamDB') {
    super(name)
    this.version(1).stores({
      questions: '++id, topicId, errorCount, lastSeenAt',
      topics: '++id, &topicId',
      sessions: '++id, startedAt, completedAt, mode',
      settings: '&key',
    })
  }
}

export const db = new ExamDB()
