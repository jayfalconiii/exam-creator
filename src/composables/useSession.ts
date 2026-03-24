import { db as defaultDb, type ExamDB } from '@/db/db'
import type { Question, SessionConfig, Session } from '@/types'
import { updatedRawScore } from '@/composables/useSpacedRepetition'

export interface AnswerRecord {
  questionId: number
  selectedIndex: number
  timeMs: number
  correct: boolean
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function buildQuestionQueue(
  config: SessionConfig,
  db: ExamDB = defaultDb,
): Promise<Question[]> {
  let query = db.questions.where('topicId').anyOf(config.topicIds)

  let questions = await query.toArray()

  if (config.mode === 'new') {
    questions = questions.filter((q) => q.lastSeenAt === null)
  } else if (config.mode === 'difficult') {
    questions = questions.filter((q) => q.errorCount >= 2)
  } else if (config.mode === 'review') {
    questions = questions.filter((q) => q.lastSeenAt !== null)
  }

  return shuffle(questions).slice(0, config.questionCount)
}

export async function submitAnswer(
  questionId: number,
  selectedIndex: number,
  timeMs: number,
  correctIndex: number,
  db: ExamDB = defaultDb,
): Promise<AnswerRecord> {
  const correct = selectedIndex === correctIndex
  const question = await db.questions.get(questionId)
  if (question) {
    await db.questions.update(questionId, {
      errorCount: correct ? question.errorCount : question.errorCount + 1,
      lastSeenAt: Date.now(),
    })
  }
  return { questionId, selectedIndex, timeMs, correct }
}

export async function completeSession(
  config: SessionConfig,
  answers: AnswerRecord[],
  startedAt: number,
  db: ExamDB = defaultDb,
): Promise<void> {
  const completedAt = Date.now()
  const correctCount = answers.filter((a) => a.correct).length
  const durationMs = completedAt - startedAt

  const session: Omit<Session, 'id'> = {
    startedAt,
    completedAt,
    mode: config.mode,
    topicIds: config.topicIds,
    totalQuestions: answers.length,
    correctCount,
    durationMs,
  }

  await db.sessions.add(session)

  const sessionCorrectPct = answers.length > 0 ? correctCount / answers.length : 0

  const topicIds = [...new Set(config.topicIds)]
  for (const topicId of topicIds) {
    const topic = await db.topics.where('topicId').equals(topicId).first()
    if (topic?.id) {
      const newRaw = updatedRawScore(topic.rawScore, sessionCorrectPct)
      await db.topics.update(topic.id, {
        rawScore: newRaw,
        lastReviewedAt: completedAt,
        totalSessions: topic.totalSessions + 1,
      })
    }
  }
}
