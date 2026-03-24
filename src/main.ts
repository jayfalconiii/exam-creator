import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useSettingsStore } from '@/stores/settings'
import { seedIfNeeded } from '@/db/seed'
import { db } from '@/db/db'

;(async () => {
  const app = createApp(App)
  const pinia = createPinia()

  await seedIfNeeded(db)

  app.use(pinia)
  app.use(router)

  const settingsStore = useSettingsStore()
  await settingsStore.loadFromDB()

  app.mount('#app')
})()
