<template>
  <nav class="bottom-nav">
    <RouterLink to="/" class="bottom-nav__tab">
      <i class="pi pi-home"></i>
      <span>Home</span>
    </RouterLink>
    <RouterLink to="/topics" class="bottom-nav__tab">
      <i class="pi pi-th-large"></i>
      <span>Topics</span>
    </RouterLink>
    <RouterLink to="/study" class="bottom-nav__tab">
      <i class="pi pi-pencil"></i>
      <span>Study</span>
    </RouterLink>
    <RouterLink to="/stats" class="bottom-nav__tab">
      <i class="pi pi-chart-bar"></i>
      <span>Stats</span>
    </RouterLink>
    <RouterLink to="/library" class="bottom-nav__tab">
      <i class="pi pi-book"></i>
      <span>Library</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
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
  height: calc(56px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.bottom-nav__tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 44px;
  text-decoration: none;
  color: var(--color-text-muted);
  font-weight: 500;
  border-top: 3px solid transparent;

  .pi {
    font-size: 1.25rem;
  }

  span {
    font-size: 0.625rem;
  }

  &.router-link-active {
    color: var(--color-primary);
    border-top-color: var(--color-primary);
    animation: nav-spring 0.3s ease;
  }
}
</style>
