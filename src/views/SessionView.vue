<template>
  <main class="session-view">
    <header class="session-view__header" v-if="sessionStore.status === 'active'">
      <ProgressBar :current="sessionStore.currentIndex" :total="sessionStore.queue.length" />
      <p v-if="config?.timerEnabled" class="session-view__timer">{{ formattedTime }}</p>
    </header>

    <section v-if="sessionStore.status === 'loading'" class="session-view__loading" data-testid="question-skeleton">
      <div class="question-skeleton">
        <Skeleton height="2rem" class="question-skeleton__title" />
        <Skeleton height="3rem" class="question-skeleton__option" />
        <Skeleton height="3rem" class="question-skeleton__option" />
        <Skeleton height="3rem" class="question-skeleton__option" />
        <Skeleton height="3rem" class="question-skeleton__option" />
      </div>
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
        <Button
          v-if="isStudyMode && !feedbackDismissed"
          class="session-view__btn"
          :label="isLast ? 'Finish' : 'Next'"
          @click="feedbackDismissed = true"
        />
        <Button
          v-else-if="!isStudyMode || feedbackDismissed"
          class="session-view__btn"
          :label="isLast ? 'Finish' : 'Next'"
          @click="handleAdvance"
        />
      </footer>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Skeleton from 'primevue/skeleton'
import Button from 'primevue/button'
import { useSessionStore } from '@/stores/session'
import { useTopicsStore } from '@/stores/topics'
import { buildQuestionQueue, submitAnswer, completeSession } from '@/composables/useSession'
import QuestionCard from '@/components/QuestionCard.vue'
import ProgressBar from '@/components/ProgressBar.vue'

const router = useRouter()
const sessionStore = useSessionStore()
const topicsStore = useTopicsStore()

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
  await topicsStore.refreshTopics()
  sessionStore.finishSession()
  router.replace('/study/session/review')
}

const onSelect = handleSelect

onMounted(loadQueue)
onUnmounted(() => { if (timerInterval) clearInterval(timerInterval) })
</script>

<style scoped>
.session-view {
  padding: var(--space-4);
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
    color: var(--color-text);
  }

  &__loading {
    padding: 1rem 0;
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
    min-height: 44px;
  }
}

.question-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &__title {
    border-radius: 0.5rem;
    margin-bottom: 0.25rem;
  }

  &__option {
    border-radius: 0.5rem;
  }
}
</style>
