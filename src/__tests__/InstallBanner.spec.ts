import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import InstallBanner from '@/components/InstallBanner.vue'

describe('InstallBanner', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('is hidden by default (no prompt event fired)', () => {
    const wrapper = mount(InstallBanner)
    expect(wrapper.find('.install-banner').exists()).toBe(false)
  })

  it('shows banner when beforeinstallprompt fires', async () => {
    const wrapper = mount(InstallBanner)
    const event = new Event('beforeinstallprompt')
    ;(event as any).preventDefault = vi.fn()
    ;(event as any).prompt = vi.fn()
    window.dispatchEvent(event)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.install-banner').exists()).toBe(true)
  })

  it('hides banner and stores dismissal in localStorage on dismiss', async () => {
    const wrapper = mount(InstallBanner)
    const event = new Event('beforeinstallprompt')
    ;(event as any).preventDefault = vi.fn()
    ;(event as any).prompt = vi.fn()
    window.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    await wrapper.find('.install-banner__dismiss').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.install-banner').exists()).toBe(false)
    expect(localStorage.getItem('install-banner-dismissed')).toBe('true')
  })

  it('does not show banner if already dismissed', async () => {
    localStorage.setItem('install-banner-dismissed', 'true')
    const wrapper = mount(InstallBanner)
    const event = new Event('beforeinstallprompt')
    ;(event as any).preventDefault = vi.fn()
    ;(event as any).prompt = vi.fn()
    window.dispatchEvent(event)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.install-banner').exists()).toBe(false)
  })
})
