import 'primeicons/primeicons.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import App from './App.vue'
import router from './router'
import { useSettingsStore } from '@/stores/settings'
import { seedIfNeeded } from '@/db/seed'
import { db } from '@/db/db'

const OrangePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407',
    },
  },
})

;(async () => {
  const app = createApp(App)
  const pinia = createPinia()

  await seedIfNeeded(db)

  app.use(pinia)
  app.use(router)
  app.use(ToastService)
  app.use(ConfirmationService)
  app.use(PrimeVue, {
    theme: {
      preset: OrangePreset,
      options: {
        cssLayer: false,
        darkModeSelector: '[data-theme="dark"]',
      },
    },
  })

  const settingsStore = useSettingsStore()
  await settingsStore.loadFromDB()

  app.mount('#app')
})()
