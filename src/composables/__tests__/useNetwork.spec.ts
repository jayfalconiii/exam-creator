import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('useNetwork', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('isOnline ref is true when navigator.onLine is true', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    const { useNetwork } = await import('@/composables/useNetwork')
    const { isOnline } = useNetwork()
    expect(isOnline.value).toBe(true)
  })

  it('isOnline updates reactively when online/offline events fire', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    const { useNetwork } = await import('@/composables/useNetwork')
    const { isOnline } = useNetwork()
    expect(isOnline.value).toBe(true)

    window.dispatchEvent(new Event('offline'))
    expect(isOnline.value).toBe(false)

    window.dispatchEvent(new Event('online'))
    expect(isOnline.value).toBe(true)
  })
})
