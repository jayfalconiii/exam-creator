<template>
  <main class="home-view">
    <header class="home-view__header">
      <h1>Home</h1>
      <RouterLink to="/settings" class="home-view__settings-link" aria-label="Settings">
        ⚙
      </RouterLink>
    </header>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>
