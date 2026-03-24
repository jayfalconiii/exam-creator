import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { useSessionStore } from '@/stores/session'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/topics', component: () => import('@/views/TopicsView.vue') },
    { path: '/topics/:id', component: () => import('@/views/TopicDetailView.vue') },
    { path: '/study', component: () => import('@/views/StudyView.vue') },
    { path: '/study/session', component: () => import('@/views/SessionView.vue') },
    { path: '/study/session/review', component: () => import('@/views/SessionReviewView.vue') },
    { path: '/stats', component: () => import('@/views/StatsView.vue') },
    { path: '/settings', component: () => import('@/views/SettingsView.vue') },
  ],
})

router.beforeEach((to) => {
  if (to.path === '/study/session' || to.path === '/study/session/review') {
    const sessionStore = useSessionStore()
    if (sessionStore.status === 'idle') {
      return '/study'
    }
  }
})

export default router
