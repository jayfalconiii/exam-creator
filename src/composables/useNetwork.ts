import { ref, onUnmounted } from 'vue'

export function useNetwork() {
  const isOnline = ref(navigator.onLine)

  function handleOnline() { isOnline.value = true }
  function handleOffline() { isOnline.value = false }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return { isOnline }
}
