<template>
  <main class="session-review-view">
    <header class="session-review-view__header" :class="{ 'session-review-view__header--high-score': isHighScore }">
      <h1 class="session-review-view__title">Session Review</h1>
      <p class="session-review-view__score">
        {{ correctCount }} / {{ sessionStore.queue.length }} correct
      </p>
      <p v-if="isHighScore" class="session-review-view__celebration">
        ★ Great job! You scored {{ scorePercent }}%!
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
      <Button label="Done" class="session-review-view__btn" @click="done" />
    </footer>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useSessionStore } from '@/stores/session'
import { useTopicsStore } from '@/stores/topics'

const router = useRouter()
const sessionStore = useSessionStore()
const topicsStore = useTopicsStore()

const correctCount = computed(() => sessionStore.answers.filter((a) => a.correct).length)
const scorePercent = computed(() =>
  sessionStore.queue.length > 0
    ? Math.round((correctCount.value / sessionStore.queue.length) * 100)
    : 0
)
const isHighScore = computed(() => scorePercent.value >= 80)

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

<style scoped lang="scss">
.session-review-view {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  &__header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    &--high-score {
      border: 2px solid var(--color-success);
      border-radius: var(--radius-lg);
      padding: 1rem;
      background: var(--color-success-light);
      box-shadow: 0 0 16px 0 rgb(34 197 94 / 0.25);
    }
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text);
  }

  &__score {
    font-size: 1.1rem;
    color: var(--color-text-muted);
  }

  &__celebration {
    font-size: 1rem;
    font-weight: 600;
    color: #15803d;
    margin-top: 0.25rem;
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
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);

    &--correct {
      border-color: var(--color-success);
      background: var(--color-success-light);
    }

    &--incorrect {
      border-color: var(--color-danger);
      background: var(--color-danger-light);
    }
  }

  &__question-text {
    margin-bottom: 0.75rem;
    color: var(--color-text);
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
    border-radius: var(--radius-sm);
    color: var(--color-text);

    &--correct {
      font-weight: 600;
      color: #15803d;
      background: var(--color-success-light);
    }

    &--selected {
      color: #b91c1c;
      background: var(--color-danger-light);
    }
  }

  &__explanation {
    font-size: 0.875rem;
    color: var(--color-text);
    border-left: 3px solid var(--color-primary);
    padding-left: 0.75rem;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
  }

  &__btn {
    min-height: 44px;
  }
}
</style>
