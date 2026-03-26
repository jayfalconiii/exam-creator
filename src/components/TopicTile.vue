<template>
  <RouterLink
    :to="`/topics/${topic.topicId}`"
    class="topic-tile"
    :style="{ backgroundColor: topic.color ?? '#78716c' }"
  >
    <span class="topic-tile__name">{{ topic.name }}</span>
    <span class="topic-tile__score">{{ Math.round(topic.effectiveScore) }}%</span>
  </RouterLink>
</template>

<script setup lang="ts">
import type { TopicWithScore } from '@/stores/topics'

defineProps<{ topic: TopicWithScore }>()
</script>

<style scoped lang="scss">
.topic-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: #fff;
  font-weight: 600;
  min-height: 72px;
  box-shadow: var(--shadow-md);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover,
  &:focus-visible,
  &:active {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  &__name {
    font-size: 0.875rem;
    text-align: center;
  }

  &__score {
    font-size: 1.25rem;
    margin-top: 0.25rem;
    color: rgba(255, 255, 255, 0.75);
    font-weight: 700;
  }
}
</style>
