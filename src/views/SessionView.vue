<template>
  <main class="session-view">
    <div v-if="sessionStore.status === 'loading'" class="session-view__loading">
      <span class="session-view__spinner" aria-label="Generating questions…"></span>
      <p class="session-view__loading-text">Generating questions…</p>
    </div>
    <h1 v-else>Session</h1>
  </main>
</template>

<script setup lang="ts">
import { useSessionStore } from '@/stores/session'

const sessionStore = useSessionStore()
</script>

<style scoped>
.session-view {
  padding: 1rem;

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 1rem;
  }

  &__spinner {
    display: block;
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
  }

  &__loading-text {
    font-size: 1rem;
    color: inherit;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
