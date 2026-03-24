<template>
  <div class="progress-bar" role="progressbar" :aria-valuenow="current" :aria-valuemax="total">
    <div class="progress-bar__track">
      <div class="progress-bar__fill" :style="{ width: `${pct}%` }" />
    </div>
    <span class="progress-bar__label">{{ current }} / {{ total }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  current: number
  total: number
}>()

const pct = computed(() => (props.total > 0 ? (props.current / props.total) * 100 : 0))
</script>

<style scoped>
.progress-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &__track {
    flex: 1;
    height: 0.5rem;
    background: #e5e7eb;
    border-radius: 9999px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: #6366f1;
    border-radius: 9999px;
    transition: width 0.2s ease;
  }

  &__label {
    font-size: 0.875rem;
    color: #6b7280;
    white-space: nowrap;
  }
}
</style>
