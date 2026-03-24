<template>
  <main class="settings-view">
    <header class="settings-view__header">
      <h1>Settings</h1>
    </header>

    <section class="settings-view__section">
      <h2 class="settings-view__section-title">API Key</h2>
      <div class="settings-view__field">
        <label for="api-key-input">Anthropic API Key</label>
        <input
          id="api-key-input"
          v-model="apiKeyInput"
          type="password"
          data-testid="api-key-input"
          placeholder="sk-ant-..."
          class="settings-view__input"
        />
      </div>
      <button
        data-testid="save-api-key-btn"
        class="settings-view__btn"
        @click="handleSaveApiKey"
      >
        Save API Key
      </button>
      <p v-if="apiKeySaved" data-testid="api-key-saved-msg" class="settings-view__saved-msg">
        API key saved.
      </p>
    </section>

    <section class="settings-view__section">
      <h2 class="settings-view__section-title">Session Defaults</h2>
      <div class="settings-view__field">
        <label for="question-count-input">Default Question Count</label>
        <input
          id="question-count-input"
          v-model.number="questionCountInput"
          type="number"
          min="5"
          max="65"
          data-testid="question-count-input"
          class="settings-view__input"
        />
      </div>
      <div class="settings-view__field">
        <label for="mode-select">Default Mode</label>
        <select
          id="mode-select"
          v-model="modeInput"
          data-testid="mode-select"
          class="settings-view__select"
        >
          <option value="mixed">Mixed</option>
          <option value="review">Review</option>
          <option value="difficult">Difficult</option>
          <option value="new">New</option>
        </select>
      </div>
      <button
        data-testid="save-defaults-btn"
        class="settings-view__btn"
        @click="handleSaveDefaults"
      >
        Save Defaults
      </button>
      <p v-if="defaultsSaved" data-testid="defaults-saved-msg" class="settings-view__saved-msg">
        Defaults saved.
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import type { SessionMode } from '@/types'

const store = useSettingsStore()

const apiKeyInput = ref('')
const apiKeySaved = ref(false)
const questionCountInput = ref(store.defaultQuestionCount)
const modeInput = ref<SessionMode>(store.defaultMode)
const defaultsSaved = ref(false)

onMounted(async () => {
  await store.loadFromDB()
  apiKeyInput.value = store.apiKey
  questionCountInput.value = store.defaultQuestionCount
  modeInput.value = store.defaultMode
})

async function handleSaveApiKey() {
  await store.saveApiKey(apiKeyInput.value)
  apiKeySaved.value = true
}

async function handleSaveDefaults() {
  await store.saveDefaults(questionCountInput.value, modeInput.value)
  defaultsSaved.value = true
}
</script>

<style scoped>
.settings-view {
  padding: 1rem;

  &__header {
    margin-bottom: 1.5rem;
  }

  &__section {
    margin-bottom: 2rem;

    &-title {
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }

  &__input,
  &__select {
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  &__btn {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    cursor: pointer;
  }

  &__saved-msg {
    margin-top: 0.5rem;
    color: green;
    font-size: 0.9rem;
  }
}
</style>
