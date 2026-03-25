import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db/db'
import type { SessionMode, ThemePreference } from '@/types'

export const useSettingsStore = defineStore('settings', () => {
  const apiKey = ref('')
  const defaultQuestionCount = ref(10)
  const defaultMode = ref<SessionMode>('mixed')
  const theme = ref<ThemePreference>('auto')

  const hasApiKey = computed(() => apiKey.value.length > 0)

  async function loadFromDB() {
    const rows = await db.settings.toArray()
    for (const row of rows) {
      if (row.key === 'apiKey') apiKey.value = row.value
      if (row.key === 'defaultQuestionCount') defaultQuestionCount.value = Number(row.value)
      if (row.key === 'defaultMode') defaultMode.value = row.value as SessionMode
      if (row.key === 'theme') theme.value = row.value as ThemePreference
    }
  }

  async function saveApiKey(key: string) {
    apiKey.value = key
    await db.settings.put({ key: 'apiKey', value: key })
  }

  async function saveTheme(value: ThemePreference) {
    theme.value = value
    await db.settings.put({ key: 'theme', value })
  }

  async function saveDefaults(count: number, mode: SessionMode) {
    defaultQuestionCount.value = count
    defaultMode.value = mode
    await db.settings.bulkPut([
      { key: 'defaultQuestionCount', value: String(count) },
      { key: 'defaultMode', value: mode },
    ])
  }

  return { apiKey, defaultQuestionCount, defaultMode, theme, hasApiKey, loadFromDB, saveApiKey, saveDefaults, saveTheme }
})
