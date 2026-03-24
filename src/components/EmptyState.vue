<script setup lang="ts">
import Button from 'primevue/button'

defineProps<{
  icon: string
  heading: string
  description: string
  ctaLabel: string
}>()

const emit = defineEmits<{ cta: [] }>()
</script>

<template>
  <section class="empty-state">
    <span class="empty-state__icon">{{ icon }}</span>
    <h2 class="empty-state__heading">{{ heading }}</h2>
    <p class="empty-state__description">{{ description }}</p>
    <Button class="empty-state__cta" :label="ctaLabel" @click="emit('cta')" />
  </section>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-6);
  text-align: center;
  gap: var(--space-4);

  .empty-state__icon {
    font-size: 3rem;
    line-height: 1;
  }

  .empty-state__heading {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .empty-state__description {
    margin: 0;
    font-size: 0.9375rem;
    color: var(--color-text-muted);
    max-width: 28ch;
  }

  .empty-state__cta {
    margin-top: var(--space-2);
  }
}
</style>
