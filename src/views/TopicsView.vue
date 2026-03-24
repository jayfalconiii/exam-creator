<template>
  <main class="topics-view">
    <h1 class="topics-view__title">Topics</h1>
    <EmptyState
      v-if="store.topicsWithEffectiveScore.length === 0"
      icon="📚"
      heading="No topics yet"
      description="Your topics will appear here once they've been seeded."
      cta-label="Refresh"
      @cta="store.refreshTopics()"
    />
    <HeatmapGrid v-else :topics="store.topicsWithEffectiveScore" />
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import HeatmapGrid from '@/components/HeatmapGrid.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useTopicsStore } from '@/stores/topics'

const store = useTopicsStore()

onMounted(() => {
  store.refreshTopics()
})
</script>

<style scoped>
.topics-view {
  padding-bottom: 4rem;

  .topics-view__title {
    padding: 1rem;
    margin: 0;
  }
}
</style>
