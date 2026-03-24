import type { ExamDB } from '@/db/db'
import { TOPIC_DEFINITIONS } from '@/data/topics'
import seedQuestionsRaw from '@/data/seed-questions.json'
import type { Question } from '@/types'

export async function seedIfNeeded(db: ExamDB): Promise<void> {
  const count = await db.questions.count()
  if (count > 0) return

  const now = Date.now()
  const questions: Omit<Question, 'id'>[] = seedQuestionsRaw.map((q) => ({
    ...q,
    source: 'seed' as const,
    errorCount: 0,
    lastSeenAt: null,
    createdAt: now,
  }))

  await db.transaction('rw', [db.questions, db.topics], async () => {
    await db.questions.bulkAdd(questions)
    await db.topics.bulkAdd(TOPIC_DEFINITIONS)
  })
}
