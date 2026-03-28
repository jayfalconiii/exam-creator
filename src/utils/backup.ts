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

  // Merge questions: match on (topicId, text), keep higher errorCount
  const localQuestions = await db.questions.toArray()

  // Build a key → id map for local questions
  const localMap = new Map<string, Question>()
  for (const q of localQuestions) {
    const key = `${q.topicId}\x00${q.text}`
    const existing = localMap.get(key)
    if (!existing || q.errorCount > existing.errorCount) {
      localMap.set(key, q)
    }
  }

  // Find duplicates to delete (lower errorCount copies)
  const localIdsByKey = new Map<string, number[]>()
  for (const q of localQuestions) {
    const key = `${q.topicId}\x00${q.text}`
    if (!localIdsByKey.has(key)) localIdsByKey.set(key, [])
    localIdsByKey.get(key)!.push(q.id!)
  }

  for (const backupQ of backup.questions) {
    const key = `${backupQ.topicId}\x00${backupQ.text}`
    const localMatch = localMap.get(key)

    if (localMatch) {
      // Keep higher errorCount
      if (backupQ.errorCount > localMatch.errorCount) {
        // Update local record with backup's errorCount
        await db.questions.update(localMatch.id!, { errorCount: backupQ.errorCount })
        localMap.set(key, { ...localMatch, errorCount: backupQ.errorCount })
      }
      // Remove any duplicate local records for this key (keep only the one in localMap)
      const allLocalIds = localIdsByKey.get(key) ?? []
      const keepId = localMap.get(key)!.id!
      const toDelete = allLocalIds.filter((id) => id !== keepId)
      for (const id of toDelete) {
        await db.questions.delete(id)
      }
    } else {
      // No local match — insert as new
      const { id: _id, ...rest } = backupQ as Question
      await db.questions.add(rest as Question)
    }
  }

  // Deduplicate any remaining local duplicates (same topicId+text from local DB)
  const allAfter = await db.questions.toArray()
  const seenKeys = new Map<string, Question>()
  for (const q of allAfter) {
    const key = `${q.topicId}\x00${q.text}`
    const existing = seenKeys.get(key)
    if (!existing) {
      seenKeys.set(key, q)
    } else if (q.errorCount > existing.errorCount) {
      await db.questions.delete(existing.id!)
      seenKeys.set(key, q)
    } else {
      await db.questions.delete(q.id!)
    }
  }

  if (scope === 'questions-and-scores') {
    // Merge topics: match on topicId; keep local if exists, insert backup if not
    const localTopics = await db.topics.toArray()
    const localTopicIds = new Set(localTopics.map((t) => t.topicId))

    for (const backupTopic of backup.topics) {
      if (!localTopicIds.has(backupTopic.topicId)) {
        const { id: _id, ...rest } = backupTopic as Topic
        await db.topics.add(rest as Topic)
      }
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
