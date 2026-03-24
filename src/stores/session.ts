import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SessionConfig, Question } from '@/types/index'
import type { AnswerRecord } from '@/composables/useSession'

export type SessionStatus = 'idle' | 'configured' | 'loading' | 'active' | 'review'

export const useSessionStore = defineStore('session', () => {
  const status = ref<SessionStatus>('idle')
  const config = ref<SessionConfig | null>(null)
  const queue = ref<Question[]>([])
  const currentIndex = ref(0)
  const answers = ref<AnswerRecord[]>([])
  const startedAt = ref<number>(0)

  function configure(newConfig: SessionConfig) {
    config.value = newConfig
    status.value = 'configured'
  }

  function startSession(questions: Question[]) {
    queue.value = questions
    currentIndex.value = 0
    answers.value = []
    startedAt.value = Date.now()
    status.value = 'active'
  }

  function recordAnswer(answer: AnswerRecord) {
    answers.value.push(answer)
  }

  function advance() {
    currentIndex.value++
  }

  function finishSession() {
    status.value = 'review'
  }

  function reset() {
    config.value = null
    queue.value = []
    currentIndex.value = 0
    answers.value = []
    startedAt.value = 0
    status.value = 'idle'
  }

  return {
    status,
    config,
    queue,
    currentIndex,
    answers,
    startedAt,
    configure,
    startSession,
    recordAnswer,
    advance,
    finishSession,
    reset,
  }
})
