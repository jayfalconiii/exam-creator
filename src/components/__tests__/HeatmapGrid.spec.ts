import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import HeatmapGrid from '@/components/HeatmapGrid.vue'
import { TOPIC_DEFINITIONS } from '@/data/topics'
import type { TopicWithScore } from '@/stores/topics'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/topics', component: { template: '<div/>' } },
    { path: '/topics/:id', component: { template: '<div/>' } },
  ],
})

const mockTopics: TopicWithScore[] = TOPIC_DEFINITIONS.map((t) => ({
  ...t,
  effectiveScore: 0,
  color: 'gray' as const,
}))

describe('HeatmapGrid', () => {
  it('renders 17 TopicTile components', async () => {
    const wrapper = mount(HeatmapGrid, {
      props: { topics: mockTopics },
      global: { plugins: [router] },
    })
    expect(wrapper.findAll('.topic-tile')).toHaveLength(17)
  })
})
