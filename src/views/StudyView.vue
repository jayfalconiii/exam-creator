<template>
  <main class="study-view">
    <h1 class="study-view__title">Configure Session</h1>

    <form class="study-view__form" @submit.prevent="startSession">
      <section class="study-view__section">
        <h2 class="study-view__section-heading">Topics</h2>
        <label class="study-view__topic-item">
          <input
            type="checkbox"
            data-testid="topic-all"
            :checked="allSelected"
            @change="toggleAll"
          />
          All
        </label>
        <label
          v-for="topic in TOPIC_DEFINITIONS"
          :key="topic.topicId"
          class="study-view__topic-item"
        >
          <input
            type="checkbox"
            :data-testid="`topic-${topic.topicId}`"
            :value="topic.topicId"
            v-model="selectedTopics"
          />
          {{ topic.name }}
        </label>
      </section>

      <section class="study-view__section">
        <h2 class="study-view__section-heading">Mode</h2>
        <div class="study-view__mode-group">
          <label
            v-for="m in modes"
            :key="m.value"
            class="study-view__mode-option"
          >
            <input
              type="radio"
              :data-testid="`mode-${m.value}`"
              :value="m.value"
              v-model="selectedMode"
            />
            {{ m.label }}
          </label>
        </div>
      </section>

      <section class="study-view__section">
        <h2 class="study-view__section-heading">Question Count</h2>
        <input
          type="number"
          data-testid="question-count"
          min="5"
          max="65"
          v-model.number="questionCount"
        />
      </section>

      <section class="study-view__section">
        <h2 class="study-view__section-heading">Feedback Mode</h2>
        <div class="study-view__feedback-group">
          <label class="study-view__feedback-option">
            <input
              type="radio"
              data-testid="feedback-study"
              value="study"
              v-model="feedbackMode"
            />
            Study
          </label>
          <label class="study-view__feedback-option">
            <input
              type="radio"
              data-testid="feedback-exam"
              value="exam"
              v-model="feedbackMode"
            />
            Exam
          </label>
        </div>
      </section>

      <section class="study-view__section">
        <h2 class="study-view__section-heading">Timer</h2>
        <label class="study-view__timer-toggle">
          <input
            type="checkbox"
            data-testid="timer-toggle"
            v-model="timerEnabled"
          />
          Enable timer
        </label>
        <input
          v-if="timerEnabled"
          type="number"
          data-testid="timer-seconds"
          min="30"
          max="7200"
          v-model.number="timerSeconds"
        />
      </section>

      <button
        type="submit"
        data-testid="start-session"
        :disabled="selectedTopics.length === 0"
        class="study-view__start-btn"
      >
        Start Session
      </button>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { TOPIC_DEFINITIONS } from '@/data/topics'
import { useSessionStore } from '@/stores/session'
import { useSettingsStore } from '@/stores/settings'
import { useNetwork } from '@/composables/useNetwork'
import { useQuestionGenerator } from '@/composables/useQuestionGenerator'
import { db } from '@/db/db'
import type { SessionMode, FeedbackMode } from '@/types/index'

const router = useRouter()
const sessionStore = useSessionStore()
const settingsStore = useSettingsStore()
const { isOnline } = useNetwork()

const selectedTopics = ref<string[]>([])
const selectedMode = ref<SessionMode>('mixed')
const questionCount = ref(10)
const feedbackMode = ref<FeedbackMode>('study')
const timerEnabled = ref(false)
const timerSeconds = ref(90)

const allTopicIds = TOPIC_DEFINITIONS.map((t) => t.topicId)

const allSelected = computed(() => selectedTopics.value.length === allTopicIds.length)

const modes = [
  { value: 'review' as SessionMode, label: 'Review' },
  { value: 'difficult' as SessionMode, label: 'Difficult' },
  { value: 'new' as SessionMode, label: 'New' },
  { value: 'mixed' as SessionMode, label: 'Mixed' },
]

function toggleAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  selectedTopics.value = checked ? [...allTopicIds] : []
}

onMounted(async () => {
  const rows = await db.settings.where('key').startsWith('session_').toArray()
  for (const row of rows) {
    if (row.key === 'session_topicIds') selectedTopics.value = JSON.parse(row.value)
    if (row.key === 'session_mode') selectedMode.value = row.value as SessionMode
    if (row.key === 'session_questionCount') questionCount.value = Number(row.value)
    if (row.key === 'session_feedbackMode') feedbackMode.value = row.value as FeedbackMode
    if (row.key === 'session_timerEnabled') timerEnabled.value = row.value === 'true'
    if (row.key === 'session_timerSeconds') timerSeconds.value = Number(row.value)
  }
})

async function startSession() {
  const config = {
    topicIds: selectedTopics.value,
    mode: selectedMode.value,
    questionCount: questionCount.value,
    feedbackMode: feedbackMode.value,
    timerEnabled: timerEnabled.value,
    timerSeconds: timerSeconds.value,
  }

  await db.settings.bulkPut([
    { key: 'session_topicIds', value: JSON.stringify(config.topicIds) },
    { key: 'session_mode', value: config.mode },
    { key: 'session_questionCount', value: String(config.questionCount) },
    { key: 'session_feedbackMode', value: config.feedbackMode },
    { key: 'session_timerEnabled', value: String(config.timerEnabled) },
    { key: 'session_timerSeconds', value: String(config.timerSeconds) },
  ])

  sessionStore.configure(config)

  const shouldGenerate =
    isOnline.value &&
    settingsStore.hasApiKey &&
    (config.mode === 'new' || config.mode === 'mixed')

  if (shouldGenerate) {
    sessionStore.status = 'loading'
    await useQuestionGenerator({
      topicIds: config.topicIds,
      count: config.questionCount,
      apiKey: settingsStore.apiKey,
      db,
    })
    sessionStore.status = 'configured'
  }

  router.push('/study/session')
}
</script>

<style scoped>
.study-view {
  padding: 1rem;

  &__title {
    margin-bottom: 1.5rem;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__section-heading {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  &__topic-item,
  &__mode-option,
  &__feedback-option,
  &__timer-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  &__mode-group,
  &__feedback-group {
    display: flex;
    gap: 1rem;
  }

  &__start-btn {
    align-self: flex-start;
    padding: 0.75rem 1.5rem;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>
