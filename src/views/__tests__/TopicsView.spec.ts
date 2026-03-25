import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { db } from '@/db/db'
import TopicsView from '@/views/TopicsView.vue'
import type { Topic } from '@/types'

const SEED_TOPICS: Omit<Topic, 'id'>[] = [
  { topicId: 'ec2',             name: 'EC2',                 rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 's3',              name: 'S3',                  rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'vpc',             name: 'VPC',                 rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'iam',             name: 'IAM',                 rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'rds',             name: 'RDS',                 rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'lambda',          name: 'Lambda',              rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'cloudfront',      name: 'CloudFront',          rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'route53',         name: 'Route 53',            rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'elb',             name: 'ELB',                 rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'dynamodb',        name: 'DynamoDB',            rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'sqs-sns',         name: 'SQS / SNS',           rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'cloudwatch',      name: 'CloudWatch',          rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'efs-fsx',         name: 'EFS / FSx',           rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'glacier',         name: 'Glacier',             rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'kms-secrets',     name: 'KMS / Secrets Manager', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'trusted-advisor', name: 'Trusted Advisor',     rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'storage-gateway', name: 'Storage Gateway',     rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
]

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
    await db.topics.bulkAdd(SEED_TOPICS.map((t) => ({ ...t })))
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
