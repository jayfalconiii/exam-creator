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
  gap: 0.75rem;
  padding: 1rem;
}
</style>
