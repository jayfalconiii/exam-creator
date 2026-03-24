import Anthropic from '@anthropic-ai/sdk'
import type { GeneratedQuestion, Question } from '@/types'
import type { ExamDB } from '@/db/db'

export const QUESTION_GENERATION_PROMPT = `Generate AWS SAA-C03 exam practice questions as a JSON array.

Each question must have:
- topicId: string (AWS service/domain slug, e.g. "ec2", "s3", "vpc", "iam", "rds")
- text: string (the question text)
- options: string[] (exactly 4 answer options)
- correctIndex: number (0-based index of the correct option)
- explanation: string (why the correct answer is right)

Return ONLY a valid JSON array with no markdown, no code fences, no extra text.`

function isValidGeneratedQuestion(item: unknown): item is GeneratedQuestion {
  if (!item || typeof item !== 'object') return false
  const q = item as Record<string, unknown>
  return (
    typeof q.topicId === 'string' &&
    typeof q.text === 'string' &&
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.options.every((o) => typeof o === 'string') &&
    typeof q.correctIndex === 'number' &&
    typeof q.explanation === 'string'
  )
}

interface UseQuestionGeneratorOptions {
  topicIds: string[]
  count: number
  apiKey: string
  db: ExamDB
}

export async function useQuestionGenerator({
  topicIds,
  count,
  apiKey,
  db,
}: UseQuestionGeneratorOptions): Promise<Question[]> {
  if (!navigator.onLine) return []

  try {
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

    const topicList = topicIds.join(', ')
    const userPrompt = `Generate ${count} AWS SAA-C03 practice questions for these topics: ${topicList}. Return a JSON array of ${count} question objects.`

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${QUESTION_GENERATION_PROMPT}\n\n${userPrompt}`,
        },
      ],
    })

    const text = await stream.finalText()

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      return []
    }

    if (!Array.isArray(parsed)) return []

    const valid = parsed.filter(isValidGeneratedQuestion)
    if (valid.length === 0) return []

    const now = Date.now()
    const toInsert: Question[] = valid.map((q) => ({
      topicId: q.topicId,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      source: 'generated',
      errorCount: 0,
      lastSeenAt: null,
      createdAt: now,
    }))

    const ids = await db.questions.bulkAdd(toInsert, { allKeys: true }) as number[]

    return toInsert.map((q, i) => ({ ...q, id: ids[i] }))
  } catch {
    return []
  }
}
