<template>
  <main class="settings-view">
    <header class="settings-view__header">
      <h1>Settings</h1>
    </header>

    <section class="settings-view__section">
      <h2 class="settings-view__section-title">Appearance</h2>
      <ButtonGroup class="settings-view__theme-group">
        <Button
          v-for="option in themeOptions"
          :key="option.value"
          :label="option.label"
          :outlined="settingsStore.theme !== option.value"
          @click="settingsStore.saveTheme(option.value)"
        />
      </ButtonGroup>
    </section>

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
      <h2 class="settings-view__section-title">Backup</h2>
      <Button
        data-testid="export-backup-btn"
        label="Export Backup"
        class="settings-view__export-btn"
        :loading="isExporting"
        :disabled="isExporting"
        @click="handleExportBackup"
      />
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
import ButtonGroup from 'primevue/buttongroup'
import InputText from 'primevue/inputtext'
import { useSettingsStore } from '@/stores/settings'
import { buildBackup } from '@/utils/backup'
import type { SessionMode, ThemePreference } from '@/types'

const settingsStore = useSettingsStore()

const themeOptions = [
  { label: 'Light', value: 'light' as ThemePreference },
  { label: 'Auto', value: 'auto' as ThemePreference },
  { label: 'Dark', value: 'dark' as ThemePreference },
]

const apiKeyInput = ref('')
const apiKeySaved = ref(false)
const questionCountInput = ref(settingsStore.defaultQuestionCount)
const questionCountInputStr = computed({
  get: () => String(questionCountInput.value),
  set: (v) => { questionCountInput.value = Number(v) },
})
const modeInput = ref<SessionMode>(settingsStore.defaultMode)
const defaultsSaved = ref(false)
const isExporting = ref(false)

onMounted(async () => {
  await settingsStore.loadFromDB()
  apiKeyInput.value = settingsStore.apiKey
  questionCountInput.value = settingsStore.defaultQuestionCount
  modeInput.value = settingsStore.defaultMode
})

async function handleSaveApiKey() {
  await settingsStore.saveApiKey(apiKeyInput.value)
  apiKeySaved.value = true
}

async function handleSaveDefaults() {
  await settingsStore.saveDefaults(questionCountInput.value, modeInput.value)
  defaultsSaved.value = true
}

async function handleExportBackup() {
  isExporting.value = true
  const backup = await buildBackup()
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `exam-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  isExporting.value = false
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

  &__theme-group {
    width: 100%;

    .p-button {
      flex: 1;
      min-height: 44px;
    }
  }

  &__btn {
    min-height: 44px;
  }

  &__export-btn {
    min-height: 44px;
  }

  &__saved-msg {
    margin-top: 0.5rem;
    color: var(--color-success);
    font-size: 0.9rem;
  }
}
</style>
