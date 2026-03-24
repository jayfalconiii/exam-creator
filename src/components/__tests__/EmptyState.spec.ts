import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '@/components/EmptyState.vue'

const defaultProps = {
  icon: '📚',
  heading: 'No topics yet',
  description: 'Your topics will appear here.',
  ctaLabel: 'Refresh',
}

describe('EmptyState', () => {
  it('renders icon, heading, description, and cta label from props', () => {
    const wrapper = mount(EmptyState, { props: defaultProps })
    expect(wrapper.find('.empty-state__icon').text()).toBe('📚')
    expect(wrapper.find('.empty-state__heading').text()).toBe('No topics yet')
    expect(wrapper.find('.empty-state__description').text()).toBe('Your topics will appear here.')
    expect(wrapper.find('.empty-state__cta').text()).toBe('Refresh')
  })

  it('emits cta event when CTA button is clicked', async () => {
    const wrapper = mount(EmptyState, { props: defaultProps })
    await wrapper.find('.empty-state__cta').trigger('click')
    expect(wrapper.emitted('cta')).toHaveLength(1)
  })
})
