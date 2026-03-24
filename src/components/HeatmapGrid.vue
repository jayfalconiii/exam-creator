<template>
  <section class="heatmap-grid">
    <TopicTile v-for="topic in topics" :key="topic.topicId" :topic="topic" />
  </section>
</template>

<script setup lang="ts">
import TopicTile from '@/components/TopicTile.vue'
import type { TopicWithScore } from '@/stores/topics'

defineProps<{ topics: TopicWithScore[] }>()
</script>

<style scoped>
.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--space-3);
  padding: var(--space-4);
}
</style>
