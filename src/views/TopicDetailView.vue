<template>
  <main class="topic-detail-view">
    <header class="topic-detail-view__header">
      <RouterLink to="/topics" class="topic-detail-view__back">← Topics</RouterLink>
      <h1 class="topic-detail-view__title">{{ topic?.name }}</h1>
    </header>

    <section class="topic-detail-view__scores">
      <div class="topic-detail-view__score-item" data-test="effective-score">
        <span class="topic-detail-view__score-label">Effective Score</span>
        <span class="topic-detail-view__score-value">{{ Math.round(computedEffectiveScore) }}%</span>
      </div>
      <div class="topic-detail-view__score-item" data-test="raw-score">
        <span class="topic-detail-view__score-label">Raw Score</span>
        <span class="topic-detail-view__score-value">{{ Math.round(topic?.rawScore ?? 0) }}%</span>
      </div>
    </section>

    <section class="topic-detail-view__stats">
      <div class="topic-detail-view__stat" data-test="total-questions">
        <span class="topic-detail-view__stat-label">Total Questions</span>
        <span class="topic-detail-view__stat-value">{{ totalQuestions }}</span>
      </div>
      <div class="topic-detail-view__stat" data-test="difficult-count">
        <span class="topic-detail-view__stat-label">Difficult Questions</span>
        <span class="topic-detail-view__stat-value">{{ difficultCount }}</span>
      </div>
    </section>

    <section class="topic-detail-view__history">
      <h2 class="topic-detail-view__history-title">Session History</h2>
      <p v-if="sessionHistory.length === 0" class="topic-detail-view__empty">No sessions yet.</p>
      <ul v-else class="topic-detail-view__history-list">
        <li
          v-for="session in sessionHistory"
          :key="session.id"
          class="topic-detail-view__history-item"
          data-test="session-history-item"
        >
          <span class="topic-detail-view__session-date">{{ formatDate(session.startedAt) }}</span>
          <span class="topic-detail-view__session-pct">{{ sessionPct(session) }}%</span>
        </li>
      </ul>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/db/db'
import { effectiveScore } from '@/composables/useSpacedRepetition'
import type { Topic, Session } from '@/types'

const route = useRoute()
const router = useRouter()

const topic = ref<Topic | null>(null)
const totalQuestions = ref(0)
const difficultCount = ref(0)
const sessionHistory = ref<Session[]>([])

const computedEffectiveScore = computed(() =>
  topic.value ? effectiveScore(topic.value.rawScore, topic.value.lastReviewedAt) : 0,
)

function sessionPct(session: Session): number {
  if (session.totalQuestions === 0) return 0
  return Math.round((session.correctCount / session.totalQuestions) * 100)
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString()
}

onMounted(async () => {
  const topicId = route.params.id as string
  const found = await db.topics.where('topicId').equals(topicId).first()
  if (!found) {
    router.replace('/topics')
    return
  }
  topic.value = found

  const [topicQuestions, sessions] = await Promise.all([
    db.questions.where('topicId').equals(topicId).toArray(),
    db.sessions.toArray(),
  ])

  totalQuestions.value = topicQuestions.length
  difficultCount.value = topicQuestions.filter((q) => q.errorCount >= 2).length
  sessionHistory.value = sessions
    .filter((s) => s.topicIds.includes(topicId) && s.completedAt !== null)
    .sort((a, b) => b.startedAt - a.startedAt)
})
</script>

<style scoped>
.topic-detail-view {
  padding: 1rem;
  padding-bottom: 4rem;

  .topic-detail-view__back {
    display: inline-block;
    margin-bottom: 0.5rem;
    color: inherit;
    text-decoration: none;
    font-size: 0.875rem;
  }

  .topic-detail-view__title {
    margin: 0 0 1rem;
  }

  .topic-detail-view__scores {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .topic-detail-view__score-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
    border-radius: 8px;
    background: #f5f5f5;
  }

  .topic-detail-view__score-label {
    font-size: 0.75rem;
    color: #666;
  }

  .topic-detail-view__score-value {
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 0.25rem;
  }

  .topic-detail-view__stats {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .topic-detail-view__stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
    border-radius: 8px;
    background: #f5f5f5;
  }

  .topic-detail-view__stat-label {
    font-size: 0.75rem;
    color: #666;
  }

  .topic-detail-view__stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 0.25rem;
  }

  .topic-detail-view__history-title {
    font-size: 1rem;
    margin: 0 0 0.75rem;
  }

  .topic-detail-view__empty {
    color: #888;
    font-size: 0.875rem;
  }

  .topic-detail-view__history-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .topic-detail-view__history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.625rem 0.75rem;
    border-radius: 6px;
    background: #f5f5f5;
  }

  .topic-detail-view__session-date {
    font-size: 0.875rem;
    color: #444;
  }

  .topic-detail-view__session-pct {
    font-weight: 600;
  }
}
</style>
