import Dexie, { type Table } from 'dexie'
import type { Question, Topic, Session, Setting } from '@/types'

const KNOWN_TOPIC_COLORS: Record<string, string> = {
  'ec2': '#1565c0',
  's3': '#00695c',
  'vpc': '#6a1b9a',
  'iam': '#c62828',
  'rds': '#283593',
  'lambda': '#ad1457',
  'cloudfront': '#00838f',
  'route53': '#4e342e',
  'elb': '#2e7d32',
  'dynamodb': '#4527a0',
  'sqs-sns': '#e65100',
  'cloudwatch': '#37474f',
  'efs-fsx': '#0277bd',
  'glacier': '#4a148c',
  'kms-secrets': '#b71c1c',
  'trusted-advisor': '#1b5e20',
  'storage-gateway': '#0d47a1',
}

const FALLBACK_COLOR = '#78716c'

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
    this.version(2).stores({
      questions: '++id, topicId, errorCount, lastSeenAt',
      topics: '++id, &topicId',
      sessions: '++id, startedAt, completedAt, mode',
      settings: '&key',
    }).upgrade(async (tx) => {
      await tx.table('topics').toCollection().modify((topic) => {
        topic.color = KNOWN_TOPIC_COLORS[topic.topicId] ?? FALLBACK_COLOR
      })
    })
    this.version(3).stores({
      questions: '++id, topicId, errorCount, lastSeenAt',
      topics: '++id, &topicId',
      sessions: '++id, startedAt, completedAt, mode',
      settings: '&key',
    }).upgrade(async (tx) => {
      await tx.table('topics').toCollection().modify((topic) => {
        if (!topic.color) {
          topic.color = KNOWN_TOPIC_COLORS[topic.topicId] ?? FALLBACK_COLOR
        }
      })
    })
  }
}

export const db = new ExamDB()
