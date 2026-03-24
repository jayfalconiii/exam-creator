<template>
  <nav class="bottom-nav">
    <RouterLink to="/" class="bottom-nav__tab">Home</RouterLink>
    <RouterLink to="/topics" class="bottom-nav__tab">Topics</RouterLink>
    <RouterLink to="/study" class="bottom-nav__tab">Study</RouterLink>
    <RouterLink to="/stats" class="bottom-nav__tab">Stats</RouterLink>
  </nav>
</template>

<script setup lang="ts">
</script>

<style scoped>
@keyframes nav-spring {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.2); }
  70%  { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.bottom-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.bottom-nav__tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  text-decoration: none;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  font-weight: 500;

  &.router-link-active {
    color: var(--color-primary);
    font-weight: 700;
    border-top: 3px solid var(--color-primary);
    animation: nav-spring 0.3s ease;
  }
}
</style>
