import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import BottomNav from '@/components/BottomNav.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/topics', component: { template: '<div/>' } },
    { path: '/study', component: { template: '<div/>' } },
    { path: '/stats', component: { template: '<div/>' } },
  ],
})

describe('BottomNav', () => {
  it('renders 4 tabs', async () => {
    const wrapper = mount(BottomNav, {
      global: { plugins: [router] },
    })
    const tabs = wrapper.findAll('a')
    expect(tabs).toHaveLength(5)
  })

  it('has links to /, /topics, /study, /stats', async () => {
    const wrapper = mount(BottomNav, {
      global: { plugins: [router] },
    })
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('#/')
    expect(hrefs).toContain('#/topics')
    expect(hrefs).toContain('#/study')
    expect(hrefs).toContain('#/stats')
  })

  it('tab labels are Home, Topics, Study, Stats', async () => {
    const wrapper = mount(BottomNav, {
      global: { plugins: [router] },
    })
    const text = wrapper.text()
    expect(text).toContain('Home')
    expect(text).toContain('Topics')
    expect(text).toContain('Study')
    expect(text).toContain('Stats')
  })
})
