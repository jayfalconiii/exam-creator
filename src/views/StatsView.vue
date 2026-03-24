<template>
  <main class="stats-view">
    <header class="stats-view__header">
      <h1 class="stats-view__title">Stats</h1>
      <section class="stats-view__overall" aria-label="Overall stats">
        <div class="stats-view__stat">
          <span class="stats-view__stat-label">Sessions</span>
          <span class="stats-view__stat-value" data-testid="stat-total-sessions">{{ sessions.length }}</span>
        </div>
        <div class="stats-view__stat">
          <span class="stats-view__stat-label">Questions</span>
          <span class="stats-view__stat-value" data-testid="stat-total-questions">{{ totalQuestions }}</span>
        </div>
        <div class="stats-view__stat">
          <span class="stats-view__stat-label">Correct</span>
          <span class="stats-view__stat-value" data-testid="stat-correct-pct">{{ overallPct }}%</span>
        </div>
      </section>
    </header>

    <p v-if="sessions.length === 0" class="stats-view__empty" data-testid="empty-state">
      No sessions completed yet. Start studying to see your history here.
    </p>

    <ol v-else class="stats-view__list" data-testid="session-list">
      <li
        v-for="session in sessions"
        :key="session.id"
        class="stats-view__row"
        data-testid="session-row"
      >
        <div class="stats-view__row-primary">
          <time class="stats-view__date" data-testid="session-date">{{ formatDate(session.startedAt) }}</time>
          <span class="stats-view__mode" data-testid="session-mode">{{ session.mode }}</span>
        </div>
        <div class="stats-view__row-secondary">
          <span class="stats-view__score" data-testid="session-score">{{ session.correctCount }} / {{ session.totalQuestions }}</span>
          <span class="stats-view__duration" data-testid="session-duration">{{ formatDuration(session.durationMs) }}</span>
        </div>
      </li>
    </ol>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { db } from '@/db/db'
import type { Session } from '@/types'

const sessions = ref<Session[]>([])

onMounted(async () => {
  const all = await db.sessions.toArray()
  sessions.value = all.slice().sort((a, b) => b.startedAt - a.startedAt)
})

const totalQuestions = computed(() => sessions.value.reduce((acc, s) => acc + s.totalQuestions, 0))

const overallPct = computed(() => {
  if (totalQuestions.value === 0) return 0
  const totalCorrect = sessions.value.reduce((acc, s) => acc + s.correctCount, 0)
  return Math.round((totalCorrect / totalQuestions.value) * 100)
})

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}m ${s}s`
}
</script>

<style scoped>
.stats-view {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  &__header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
  }

  &__overall {
    display: flex;
    gap: 1.5rem;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  &__stat-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
  }

  &__stat-value {
    font-size: 1.5rem;
    font-weight: 700;
  }

  &__empty {
    color: #6b7280;
    text-align: center;
    padding: 3rem 1rem;
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__row {
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__row-primary {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__row-secondary {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
  }

  &__date {
    font-size: 0.875rem;
    color: #6b7280;
  }

  &__mode {
    font-weight: 600;
    text-transform: capitalize;
  }

  &__score {
    font-weight: 600;
  }

  &__duration {
    font-size: 0.875rem;
    color: #6b7280;
  }
}
</style>
