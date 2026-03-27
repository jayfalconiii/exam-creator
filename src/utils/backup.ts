import type { Question, Topic } from '@/types'

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
