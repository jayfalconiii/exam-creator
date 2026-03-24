<template>
  <main class="session-review-view">
    <header class="session-review-view__header">
      <h1 class="session-review-view__title">Session Review</h1>
      <p class="session-review-view__score">
        {{ correctCount }} / {{ sessionStore.queue.length }} correct
      </p>
    </header>

    <ol class="session-review-view__list">
      <li
        v-for="(question, i) in sessionStore.queue"
        :key="question.id"
        class="session-review-view__item"
        :class="itemClass(i)"
      >
        <p class="session-review-view__question-text">
          <strong>{{ i + 1 }}.</strong> {{ question.text }}
        </p>
        <ul class="session-review-view__options">
          <li
            v-for="(option, oi) in question.options"
            :key="oi"
            class="session-review-view__option"
            :class="{
              'session-review-view__option--correct': oi === question.correctIndex,
              'session-review-view__option--selected': oi === getSelectedIndex(i) && oi !== question.correctIndex,
            }"
          >
            {{ option }}
          </li>
        </ul>
        <aside class="session-review-view__explanation">
          {{ question.explanation }}
        </aside>
      </li>
    </ol>

    <footer class="session-review-view__footer">
      <button class="session-review-view__btn" @click="done">Done</button>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useTopicsStore } from '@/stores/topics'

const router = useRouter()
const sessionStore = useSessionStore()
const topicsStore = useTopicsStore()

const correctCount = computed(() => sessionStore.answers.filter((a) => a.correct).length)

function getSelectedIndex(questionIndex: number): number | null {
  return sessionStore.answers[questionIndex]?.selectedIndex ?? null
}

function itemClass(i: number) {
  const answer = sessionStore.answers[i]
  if (!answer) return ''
  return answer.correct ? 'session-review-view__item--correct' : 'session-review-view__item--incorrect'
}

async function done() {
  await topicsStore.refreshTopics()
  sessionStore.reset()
  router.replace('/study')
}
</script>

<style scoped>
.session-review-view {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  &__header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
  }

  &__score {
    font-size: 1.1rem;
    color: #6b7280;
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__item {
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;

    &--correct {
      border-color: #22c55e;
      background: #f0fdf4;
    }

    &--incorrect {
      border-color: #ef4444;
      background: #fef2f2;
    }
  }

  &__question-text {
    margin-bottom: 0.75rem;
  }

  &__options {
    list-style: none;
    padding: 0;
    margin: 0 0 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__option {
    padding: 0.4rem 0.75rem;
    border-radius: 0.25rem;

    &--correct {
      font-weight: 600;
      color: #15803d;
      background: #dcfce7;
    }

    &--selected {
      color: #b91c1c;
      background: #fee2e2;
    }
  }

  &__explanation {
    font-size: 0.875rem;
    color: #374151;
    border-left: 3px solid #6366f1;
    padding-left: 0.75rem;
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
