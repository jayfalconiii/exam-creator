import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { db } from '@/db/db'
import { TOPIC_DEFINITIONS } from '@/data/topics'
import TopicsView from '@/views/TopicsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/topics', component: TopicsView },
    { path: '/topics/:id', component: { template: '<div/>' } },
  ],
})

describe('TopicsView', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.topics.clear()
    await db.topics.bulkAdd(TOPIC_DEFINITIONS.map((t) => ({ ...t })))
  })

  it('route /#/topics renders HeatmapGrid', async () => {
    await router.push('/topics')
    await router.isReady()
    const wrapper = mount(TopicsView, {
      global: { plugins: [router, createPinia()] },
    })
    await flushPromises()
    expect(wrapper.find('.heatmap-grid').exists()).toBe(true)
  })

  it('all 17 tiles visible', async () => {
    await router.push('/topics')
    await router.isReady()
    const wrapper = mount(TopicsView, {
      global: { plugins: [router, createPinia()] },
    })
    await flushPromises()
    expect(wrapper.findAll('.topic-tile')).toHaveLength(17)
  })

  it('shows EmptyState when topics list is empty', async () => {
    await db.topics.clear()
    await router.push('/topics')
    await router.isReady()
    const wrapper = mount(TopicsView, {
      global: { plugins: [router, createPinia()] },
    })
    await flushPromises()
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('.heatmap-grid').exists()).toBe(false)
  })

  it('does not show EmptyState when topics exist', async () => {
    await router.push('/topics')
    await router.isReady()
    const wrapper = mount(TopicsView, {
      global: { plugins: [router, createPinia()] },
    })
    await flushPromises()
    expect(wrapper.find('.empty-state').exists()).toBe(false)
  })
})
