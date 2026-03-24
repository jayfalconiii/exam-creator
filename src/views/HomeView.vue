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

    <Button
      data-testid="quick-start"
      label="Quick Start"
      class="home-view__quick-start"
      @click="quickStart"
    />
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import Button from 'primevue/button'
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
  padding: var(--space-4);
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
    color: var(--color-text);
  }

  &__settings-link {
    font-size: 1.5rem;
    text-decoration: none;
    color: var(--color-text-muted);
    min-height: 44px;
    display: flex;
    align-items: center;
  }

  &__section-title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--color-text);
  }

  &__recent {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  &__score {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-primary);
  }

  &__date {
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  &__topics {
    font-size: 0.875rem;
    color: var(--color-text);
  }

  &__empty {
    padding: 2rem 1rem;
    text-align: center;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-lg);
  }

  &__empty-message {
    color: var(--color-text-muted);
  }

  &__quick-start {
    align-self: flex-start;
    min-height: 44px;
  }
}
</style>
