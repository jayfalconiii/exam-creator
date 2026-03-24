<template>
  <RouterLink :to="`/topics/${topic.topicId}`" class="topic-tile" :data-color="topic.color">
    <span class="topic-tile__name">{{ topic.name }}</span>
    <span class="topic-tile__score">{{ Math.round(topic.effectiveScore) }}%</span>
  </RouterLink>
</template>

<script setup lang="ts">
import type { TopicWithScore } from '@/stores/topics'

defineProps<{ topic: TopicWithScore }>()
</script>

<style scoped>
.topic-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--color-text-inverse);
  font-weight: 600;
  min-height: 72px;
  background-color: var(--color-neutral-400);
  box-shadow: var(--shadow-md);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover,
  &:focus-visible,
  &:active {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  &[data-color='green'] {
    background-color: #2e7d32;
  }

  &[data-color='yellow'] {
    background-color: var(--color-accent-600);
  }

  &[data-color='red'] {
    background-color: #c62828;
  }

  &[data-color='gray'] {
    background-color: var(--color-neutral-400);
  }

  .topic-tile__name {
    font-size: 0.875rem;
    text-align: center;
  }

  .topic-tile__score {
    font-size: 1.25rem;
    margin-top: 0.25rem;
    color: var(--color-primary-200);
    font-weight: 700;
  }
}
</style>
