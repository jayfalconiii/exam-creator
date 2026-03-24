<template>
  <main class="home-view">
    <header class="home-view__header">
      <h1 data-testid="app-title" class="home-view__title">AWS SAA-C03</h1>
      <RouterLink to="/settings" data-testid="settings-link" class="home-view__settings-link" aria-label="Settings">
        ⚙
      </RouterLink>
    </header>

    <section v-if="recentSession" data-testid="recent-session" class="home-view__recent">
      <h2 class="home-view__section-title">Last Session</h2>
      <p data-testid="session-score" class="home-view__score">
        {{ recentSession.correctCount }} / {{ recentSession.totalQuestions }} correct
      </p>
      <p data-testid="session-date" class="home-view__date">
        {{ formattedDate }}
      </p>
      <p v-if="topicNames.length" data-testid="session-topics" class="home-view__topics">
        {{ topicNames.join(', ') }}
      </p>
    </section>

    <section v-else data-testid="empty-state" class="home-view__empty">
      <p class="home-view__empty-message">No sessions yet. Start studying to track your progress!</p>
    </section>

    <button data-testid="quick-start" class="home-view__quick-start" @click="quickStart">
      Quick Start
    </button>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { db } from '@/db/db'
import type { Session, Topic } from '@/types'

const router = useRouter()

const recentSession = ref<Session | null>(null)
const topics = ref<Topic[]>([])

const formattedDate = computed(() => {
  if (!recentSession.value?.completedAt) return ''
  return new Date(recentSession.value.completedAt).toLocaleDateString()
})

const topicNames = computed(() => {
  if (!recentSession.value) return []
  return recentSession.value.topicIds.map((id) => {
    const topic = topics.value.find((t) => t.topicId === id)
    return topic?.name ?? id
  })
})

onMounted(async () => {
  const sessions = await db.sessions.orderBy('completedAt').reverse().limit(1).toArray()
  recentSession.value = sessions[0] ?? null

  if (recentSession.value?.topicIds.length) {
    topics.value = await db.topics
      .where('topicId')
      .anyOf(recentSession.value.topicIds)
      .toArray()
  }
})

function quickStart() {
  router.push('/study')
}
</script>

<style scoped>
.home-view {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
  }

  &__settings-link {
    font-size: 1.5rem;
    text-decoration: none;
    color: inherit;
  }

  &__section-title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  &__recent {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  &__score {
    font-size: 1.25rem;
    font-weight: 700;
    color: #6366f1;
  }

  &__date {
    font-size: 0.875rem;
    color: #6b7280;
  }

  &__topics {
    font-size: 0.875rem;
    color: #374151;
  }

  &__empty {
    padding: 2rem 1rem;
    text-align: center;
    border: 1px dashed #e5e7eb;
    border-radius: 0.5rem;
  }

  &__empty-message {
    color: #6b7280;
  }

  &__quick-start {
    align-self: flex-start;
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
