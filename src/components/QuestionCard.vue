<template>
  <article class="question-card">
    <p class="question-card__text">{{ question.text }}</p>
    <ul class="question-card__options">
      <li
        v-for="(option, index) in question.options"
        :key="index"
        class="question-card__option"
        :class="{
          'question-card__option--correct': showFeedback && index === question.correctIndex,
          'question-card__option--incorrect': showFeedback && index === selectedIndex && index !== question.correctIndex,
        }"
      >
        <label class="question-card__label">
          <input
            type="radio"
            class="question-card__radio"
            :name="`question-${question.id}`"
            :value="index"
            :checked="selectedIndex === index"
            :disabled="disabled"
            @change="emit('select', index)"
          />
          {{ option }}
        </label>
      </li>
    </ul>
    <aside v-if="showFeedback && question.explanation" class="question-card__explanation">
      {{ question.explanation }}
    </aside>
  </article>
</template>

<script setup lang="ts">
import type { Question } from '@/types'

defineProps<{
  question: Question
  selectedIndex: number | null
  disabled: boolean
  showFeedback: boolean
}>()

const emit = defineEmits<{
  select: [index: number]
}>()
</script>

<style scoped>
@keyframes pulse-correct {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.04); }
  100% { transform: scale(1); }
}

@keyframes shake-incorrect {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}

.question-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &__text {
    font-size: 1.1rem;
    font-weight: 500;
  }

  &__options {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__option {
    border: 1px solid #ccc;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    transition: background 0.15s;

    &--correct {
      border-color: var(--color-success);
      background: var(--color-success-light);
      animation: pulse-correct 0.4s ease-in-out;
    }

    &--incorrect {
      border-color: var(--color-danger);
      background: var(--color-danger-light);
      animation: shake-incorrect 0.4s ease-in-out;
    }
  }

  &__label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
  }

  &__radio {
    flex-shrink: 0;
  }

  &__explanation {
    background: #f8fafc;
    border-left: 3px solid #6366f1;
    padding: 0.75rem 1rem;
    border-radius: 0 0.5rem 0.5rem 0;
    font-size: 0.9rem;
    color: #374151;
  }
}
</style>
