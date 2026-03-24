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
})
