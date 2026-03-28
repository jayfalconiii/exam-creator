import type { Question, Topic } from '@/types'

export type BackupScope = 'questions' | 'questions-and-scores'

export interface BackupFile {
  version: number
  questions: Omit<Question, 'id'>[]
  topics: Omit<Topic, 'id'>[]
}

export function detectBackupFormat(input: unknown): 'backup' | 'questions' | 'unknown' {
  if (Array.isArray(input)) return 'questions'
  if (
    input !== null &&
    typeof input === 'object' &&
    'version' in input &&
    'questions' in input &&
    'topics' in input
  ) {
    if ((input as BackupFile).version !== 1) return 'unknown'
    return 'backup'
  }
  return 'unknown'
}

export async function mergeBackup(backup: BackupFile, scope: BackupScope): Promise<void> {
  const { db } = await import('@/db/db')

  // Merge questions: match on (topicId, text), keep higher errorCount, insert unmatched new
  const localQuestions = await db.questions.toArray()
  const localMap = new Map<string, Question>()
  for (const q of localQuestions) {
    localMap.set(`${q.topicId}::${q.text}`, q)
  }

  const toInsert: Omit<Question, 'id'>[] = []
  const toUpdate: { id: number; errorCount: number }[] = []

  for (const bq of backup.questions) {
    const key = `${bq.topicId}::${bq.text}`
    const local = localMap.get(key)
    if (local) {
      if (bq.errorCount > local.errorCount) {
        toUpdate.push({ id: local.id!, errorCount: bq.errorCount })
      }
    } else {
      toInsert.push(bq)
    }
  }

  for (const { id, errorCount } of toUpdate) {
    await db.questions.update(id, { errorCount })
  }

  if (toInsert.length > 0) {
    await db.questions.bulkAdd(toInsert as Question[])
  }

  // Merge topics only when scope includes scores
  if (scope === 'questions-and-scores') {
    const localTopics = await db.topics.toArray()
    const localTopicIds = new Set(localTopics.map((t) => t.topicId))

    const newTopics = backup.topics.filter((t) => !localTopicIds.has(t.topicId))
    if (newTopics.length > 0) {
      await db.topics.bulkAdd(newTopics as Topic[])
    }
  }
}

export async function buildBackup(): Promise<BackupFile> {
  const { db } = await import('@/db/db')
  const [questions, topics] = await Promise.all([
    db.questions.toArray(),
    db.topics.toArray(),
  ])

  return {
    version: 1,
    questions: questions.map(({ id: _id, ...rest }) => rest),
    topics: topics.map(({ id: _id, ...rest }) => rest),
  }
}
