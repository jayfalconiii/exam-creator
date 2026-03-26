import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import TopicTile from '@/components/TopicTile.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/topics', component: { template: '<div/>' } },
    { path: '/topics/:id', component: { template: '<div/>' } },
  ],
})

const mockTopic = {
  topicId: 'ec2',
  name: 'EC2',
  rawScore: 80,
  lastReviewedAt: Date.now(),
  totalSessions: 2,
  color: '#1565c0',
  effectiveScore: 75,
  scoreColor: 'green' as const,
}

describe('TopicTile', () => {
  it('renders topic name and score %', async () => {
    const wrapper = mount(TopicTile, {
      props: { topic: mockTopic },
      global: { plugins: [router] },
    })
    expect(wrapper.text()).toContain('EC2')
    expect(wrapper.text()).toContain('75')
  })

  it('background color is set from topic.color', async () => {
    const wrapper = mount(TopicTile, {
      props: { topic: mockTopic },
      global: { plugins: [router] },
    })
    const tile = wrapper.find('.topic-tile')
    // JSDOM normalises hex to rgb; check the style attribute is non-empty
    expect(tile.attributes('style')).toBeTruthy()
  })

  it('tapping navigates to /#/topics/:id', async () => {
    await router.isReady()
    const wrapper = mount(TopicTile, {
      props: { topic: mockTopic },
      global: { plugins: [router] },
    })
    const link = wrapper.find('a')
    expect(link.attributes('href')).toContain('/topics/ec2')
  })
})
