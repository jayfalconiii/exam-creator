<template>
  <main class="session-view">
    <header class="session-view__header" v-if="sessionStore.status === 'active'">
      <ProgressBar :current="sessionStore.currentIndex" :total="sessionStore.queue.length" />
      <p v-if="config?.timerEnabled" class="session-view__timer">{{ formattedTime }}</p>
    </header>

    <section v-if="sessionStore.status === 'loading'" class="session-view__loading">
      <p>Loading questions…</p>
    </section>

    <section v-else-if="sessionStore.status === 'active' && currentQuestion" class="session-view__body">
      <QuestionCard
        :question="currentQuestion"
        :selected-index="currentAnswer"
        :disabled="currentAnswer !== null"
        :show-feedback="showFeedback"
        @select="onSelect"
      />

      <footer class="session-view__footer" v-if="currentAnswer !== null">
        <button
          v-if="isStudyMode && !feedbackDismissed"
          class="session-view__btn"
          @click="feedbackDismissed = true"
        >
          {{ isLast ? 'Finish' : 'Next' }}
        </button>
        <button
          v-else-if="!isStudyMode || feedbackDismissed"
          class="session-view__btn"
          @click="handleAdvance"
        >
          {{ isLast ? 'Finish' : 'Next' }}
        </button>
      </footer>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { buildQuestionQueue, submitAnswer, completeSession } from '@/composables/useSession'
import QuestionCard from '@/components/QuestionCard.vue'
import ProgressBar from '@/components/ProgressBar.vue'

const router = useRouter()
const sessionStore = useSessionStore()

const currentAnswer = ref<number | null>(null)
const feedbackDismissed = ref(false)
const secondsLeft = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

const config = computed(() => sessionStore.config)
const currentQuestion = computed(() => sessionStore.queue[sessionStore.currentIndex] ?? null)
const isStudyMode = computed(() => config.value?.feedbackMode === 'study')
const isLast = computed(() => sessionStore.currentIndex === sessionStore.queue.length - 1)
const showFeedback = computed(() => isStudyMode.value && currentAnswer.value !== null)

const formattedTime = computed(() => {
  const m = Math.floor(secondsLeft.value / 60)
  const s = secondsLeft.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

async function loadQueue() {
  if (!config.value) {
    router.replace('/study')
    return
  }
  sessionStore.status = 'loading' as any
  const queue = await buildQuestionQueue(config.value)
  sessionStore.startSession(queue)

  if (config.value.timerEnabled && config.value.timerSeconds > 0) {
    secondsLeft.value = config.value.timerSeconds
    timerInterval = setInterval(() => {
      secondsLeft.value--
      if (secondsLeft.value <= 0) {
        clearInterval(timerInterval!)
        finish()
      }
    }, 1000)
  }
}

async function handleSelect(index: number) {
  if (currentAnswer.value !== null) return
  currentAnswer.value = index
  feedbackDismissed.value = false

  const q = currentQuestion.value!
  const answer = await submitAnswer(q.id!, index, 0, q.correctIndex)
  sessionStore.recordAnswer(answer)

}

async function handleAdvance() {
  if (isLast.value) {
    await finish()
  } else {
    sessionStore.advance()
    currentAnswer.value = null
    feedbackDismissed.value = false
  }
}

async function finish() {
  if (timerInterval) clearInterval(timerInterval)
  await completeSession(config.value!, sessionStore.answers, sessionStore.startedAt)
  sessionStore.finishSession()
  router.replace('/study/session/review')
}

const onSelect = handleSelect

onMounted(loadQueue)
onUnmounted(() => { if (timerInterval) clearInterval(timerInterval) })
</script>

<style scoped>
.session-view {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  &__header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__timer {
    font-size: 1.25rem;
    font-weight: 600;
    text-align: right;
  }

  &__loading {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
  }

  &__btn {
    padding: 0.75rem 1.5rem;
    background: #6366f1;
    color: #fff;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;

    &:hover {
      background: #4f46e5;
    }
  }
}
</style>
