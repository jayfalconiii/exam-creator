<template>
  <main class="study-view">
    <h1 class="study-view__title">Configure Session</h1>

    <div v-if="isGenerating" class="question-skeleton" data-testid="question-skeleton">
      <Skeleton height="2rem" class="question-skeleton__title" />
      <Skeleton height="3rem" class="question-skeleton__option" />
      <Skeleton height="3rem" class="question-skeleton__option" />
      <Skeleton height="3rem" class="question-skeleton__option" />
      <Skeleton height="3rem" class="question-skeleton__option" />
    </div>

    <form v-else class="study-view__form" @submit.prevent="startSession">
      <section class="study-view__section">
        <h2 class="study-view__section-heading">Topics</h2>
        <div class="study-view__chips">
          <Button
            rounded
            type="button"
            data-testid="topic-all"
            class="study-view__chip"
            :class="{ 'study-view__chip--selected': allSelected }"
            @click="toggleAll"
          >
            All
          </Button>
          <Button
            v-for="topic in topics"
            :key="topic.topicId"
            rounded
            type="button"
            :data-testid="`topic-${topic.topicId}`"
            class="study-view__chip"
            :class="{ 'study-view__chip--selected': selectedTopics.includes(topic.topicId) }"
            @click="toggleTopic(topic.topicId)"
          >
            {{ topic.name }}
          </Button>
        </div>
      </section>

      <section class="study-view__section">
        <h2 class="study-view__section-heading">Mode</h2>
        <ButtonGroup class="study-view__mode-group">
          <Button
            v-for="m in modes"
            :key="m.value"
            type="button"
            :label="m.label"
            :data-testid="`mode-${m.value}`"
            :outlined="selectedMode !== m.value"
            @click="selectedMode = m.value"
          />
        </ButtonGroup>
      </section>

      <section class="study-view__section">
        <h2 class="study-view__section-heading">Question Count</h2>
        <span class="study-view__count-value" data-testid="question-count">{{ questionCount }}</span>
        <Slider
          v-model="questionCount"
          :min="5"
          :max="65"
          :step="5"
          data-testid="question-count-slider"
          class="study-view__slider"
        />
      </section>

      <section class="study-view__section">
        <h2 class="study-view__section-heading">Feedback Mode</h2>
        <div class="study-view__feedback-toggle">
          <span class="study-view__feedback-label" :class="{ 'study-view__feedback-label--active': !isExamMode }">Study</span>
          <ToggleSwitch v-model="isExamMode" data-testid="feedback-toggle" />
          <span class="study-view__feedback-label" :class="{ 'study-view__feedback-label--active': isExamMode }">Exam</span>
        </div>
      </section>

      <section class="study-view__section">
        <h2 class="study-view__section-heading">Timer</h2>
        <div class="study-view__feedback-toggle">
          <ToggleSwitch v-model="timerEnabled" data-testid="timer-toggle" />
          <span class="study-view__feedback-label" :class="{ 'study-view__feedback-label--active': timerEnabled }">
            Enable timer
          </span>
        </div>
        <template v-if="timerEnabled">
          <span class="study-view__count-value" data-testid="timer-seconds">{{ formattedTimer }}</span>
          <div class="timer-presets">
            <Button
              v-for="preset in TIMER_PRESETS"
              :key="preset.seconds"
              rounded
              type="button"
              :data-testid="`timer-preset-${preset.seconds}`"
              class="timer-presets__btn"
              :class="{ 'timer-presets__btn--active': timerSeconds === preset.seconds }"
              @click="timerSeconds = preset.seconds"
            >
              {{ preset.label }}
            </Button>
          </div>
        </template>
      </section>

      <Button
        type="submit"
        data-testid="start-session"
        label="Start Session"
        :disabled="selectedTopics.length === 0"
        class="study-view__start-btn"
      />
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Skeleton from 'primevue/skeleton'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import Slider from 'primevue/slider'
import { useToast } from 'primevue/usetoast'
import { useSessionStore } from '@/stores/session'
import { useSettingsStore } from '@/stores/settings'
import { useNetwork } from '@/composables/useNetwork'
import { useQuestionGenerator } from '@/composables/useQuestionGenerator'
import { db } from '@/db/db'
import type { SessionMode, FeedbackMode, Topic } from '@/types/index'

const router = useRouter()
const sessionStore = useSessionStore()
const settingsStore = useSettingsStore()
const { isOnline } = useNetwork()
const toast = useToast()

const isGenerating = ref(false)
const topics = ref<Omit<Topic, 'id'>[]>([])
const selectedTopics = ref<string[]>([])
const selectedMode = ref<SessionMode>('mixed')
const questionCount = ref(10)
const isExamMode = ref(false)
const timerEnabled = ref(false)
const timerSeconds = ref(300)

const feedbackMode = computed<FeedbackMode>(() => (isExamMode.value ? 'exam' : 'study'))
const allTopicIds = computed(() => topics.value.map((t) => t.topicId))
const allSelected = computed(() => selectedTopics.value.length === allTopicIds.value.length)
const formattedTimer = computed(() => {
  const m = Math.floor(timerSeconds.value / 60)
  const s = timerSeconds.value % 60
  return s === 0 ? `${m}m` : `${m}m ${s}s`
})

const TIMER_PRESETS = [
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '15m', seconds: 900 },
  { label: '30m', seconds: 1800 },
  { label: '45m', seconds: 2700 },
  { label: '1h', seconds: 3600 },
  { label: '1.5h', seconds: 5400 },
  { label: '2h', seconds: 7200 },
]

const modes = [
  { value: 'review' as SessionMode, label: 'Review' },
  { value: 'difficult' as SessionMode, label: 'Difficult' },
  { value: 'new' as SessionMode, label: 'New' },
  { value: 'mixed' as SessionMode, label: 'Mixed' },
]

function toggleAll() {
  selectedTopics.value = allSelected.value ? [] : [...allTopicIds.value]
}

function toggleTopic(topicId: string) {
  const idx = selectedTopics.value.indexOf(topicId)
  if (idx === -1) {
    selectedTopics.value = [...selectedTopics.value, topicId]
  } else {
    selectedTopics.value = selectedTopics.value.filter((id) => id !== topicId)
  }
}

onMounted(async () => {
  topics.value = await db.topics.toArray()
  const rows = await db.settings.where('key').startsWith('session_').toArray()
  for (const row of rows) {
    if (row.key === 'session_topicIds') selectedTopics.value = JSON.parse(row.value)
    if (row.key === 'session_mode') selectedMode.value = row.value as SessionMode
    if (row.key === 'session_questionCount') questionCount.value = Number(row.value)
    if (row.key === 'session_feedbackMode') isExamMode.value = row.value === 'exam'
    if (row.key === 'session_timerEnabled') timerEnabled.value = row.value === 'true'
    if (row.key === 'session_timerSeconds') {
      const saved = Number(row.value)
      timerSeconds.value = TIMER_PRESETS.some((p) => p.seconds === saved) ? saved : 300
    }
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
    isGenerating.value = true
    sessionStore.status = 'loading'
    try {
      await useQuestionGenerator({
        topicIds: config.topicIds,
        count: config.questionCount,
        apiKey: settingsStore.apiKey,
        db,
      })
      toast.add({ severity: 'success', summary: 'Questions Ready', detail: 'New questions generated successfully.', life: 3000 })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate questions.'
      toast.add({ severity: 'error', summary: 'Generation Failed', detail: message, life: 5000 })
    } finally {
      isGenerating.value = false
      sessionStore.status = 'configured'
    }
  }

  router.push('/study/session')
}
</script>

<style scoped lang="scss">
.study-view {
  padding: var(--space-4);

  &__title {
    margin-bottom: 1.5rem;
    color: var(--color-text);
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
    color: var(--color-text);
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 0.25rem;
  }

  &__chip {
    min-height: 44px;
    padding: 0 var(--space-4);
    border: 1.5px solid var(--color-primary) !important;
    background: transparent !important;
    color: var(--color-primary) !important;
    font-size: 0.875rem;
    font-weight: 500;

    &--selected {
      background: var(--color-primary) !important;
      color: var(--color-text-on-primary) !important;
    }
  }

  &__mode-group {
    width: 100%;

    .p-button {
      flex: 1;
      min-height: 44px;
    }
  }

  &__count-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-primary);
  }

  &__slider {
    width: 100%;
  }

  &__feedback-toggle {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 44px;
  }

  &__feedback-label {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    font-weight: 500;
    transition: color 0.15s;

    &--active {
      color: var(--color-primary);
      font-weight: 700;
    }
  }

  &__start-btn {
    align-self: flex-start;
    min-height: 44px;
    margin-top: 1rem;
  }
}

.timer-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.25rem;

  &__btn {
    min-height: 36px;
    padding: 0 0.75rem;
    border: 1.5px solid var(--color-primary) !important;
    background: transparent !important;
    color: var(--color-primary) !important;
    font-size: 0.8125rem;
    font-weight: 500;

    &--active {
      background: var(--color-primary) !important;
      color: var(--color-text-on-primary) !important;
    }
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
