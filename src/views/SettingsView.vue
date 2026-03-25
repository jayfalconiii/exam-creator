<template>
  <main class="settings-view">
    <header class="settings-view__header">
      <h1>Settings</h1>
    </header>

    <section class="settings-view__section">
      <h2 class="settings-view__section-title">API Key</h2>
      <div class="settings-view__field">
        <label for="api-key-input">Anthropic API Key</label>
        <InputText
          id="api-key-input"
          v-model="apiKeyInput"
          type="password"
          data-testid="api-key-input"
          placeholder="sk-ant-..."
          class="settings-view__input"
        />
      </div>
      <Button
        data-testid="save-api-key-btn"
        label="Save API Key"
        class="settings-view__btn"
        @click="handleSaveApiKey"
      />
      <p v-if="apiKeySaved" data-testid="api-key-saved-msg" class="settings-view__saved-msg">
        API key saved.
      </p>
    </section>

    <section class="settings-view__section">
      <h2 class="settings-view__section-title">Session Defaults</h2>
      <div class="settings-view__field">
        <label for="question-count-input">Default Question Count</label>
        <InputText
          id="question-count-input"
          v-model="questionCountInputStr"
          type="number"
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
      <Button
        data-testid="save-defaults-btn"
        label="Save Defaults"
        class="settings-view__btn"
        @click="handleSaveDefaults"
      />
      <p v-if="defaultsSaved" data-testid="defaults-saved-msg" class="settings-view__saved-msg">
        Defaults saved.
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useSettingsStore } from '@/stores/settings'
import type { SessionMode } from '@/types'

const store = useSettingsStore()

const apiKeyInput = ref('')
const apiKeySaved = ref(false)
const questionCountInput = ref(store.defaultQuestionCount)
const questionCountInputStr = computed({
  get: () => String(questionCountInput.value),
  set: (v) => { questionCountInput.value = Number(v) },
})
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

<style scoped lang="scss">
.settings-view {
  padding: var(--space-4);

  &__header {
    margin-bottom: 1.5rem;
    color: var(--color-text);
  }

  &__section {
    margin-bottom: 2rem;

    &-title {
      margin-bottom: 1rem;
      font-size: 1.1rem;
      color: var(--color-text);
    }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.75rem;

    label {
      color: var(--color-text-muted);
      font-size: 0.875rem;
    }
  }

  &__input {
    width: 100%;
  }

  &__select {
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text);
    background: var(--color-surface);
    min-height: 44px;

    &:focus {
      outline: 2px solid var(--color-primary);
      outline-offset: 1px;
    }
  }

  &__btn {
    min-height: 44px;
  }

  &__saved-msg {
    margin-top: 0.5rem;
    color: var(--color-success);
    font-size: 0.9rem;
  }
}
</style>
