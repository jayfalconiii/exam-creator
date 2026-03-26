import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import HeatmapGrid from '@/components/HeatmapGrid.vue'
import type { TopicWithScore } from '@/stores/topics'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/topics', component: { template: '<div/>' } },
    { path: '/topics/:id', component: { template: '<div/>' } },
  ],
})

const mockTopics: TopicWithScore[] = [
  { topicId: 'ec2',             name: 'EC2',                   rawScore: 0, lastReviewedAt: null, totalSessions: 0, color: '#1565c0', effectiveScore: 0, scoreColor: 'gray' as const },
  { topicId: 's3',              name: 'S3',                    rawScore: 0, lastReviewedAt: null, totalSessions: 0, color: '#00695c', effectiveScore: 0, scoreColor: 'gray' as const },
  { topicId: 'vpc',             name: 'VPC',                   rawScore: 0, lastReviewedAt: null, totalSessions: 0, color: '#6a1b9a', effectiveScore: 0, scoreColor: 'gray' as const },
  { topicId: 'iam',             name: 'IAM',                   rawScore: 0, lastReviewedAt: null, totalSessions: 0, color: '#c62828', effectiveScore: 0, scoreColor: 'gray' as const },
  { topicId: 'rds',             name: 'RDS',                   rawScore: 0, lastReviewedAt: null, totalSessions: 0, color: '#283593', effectiveScore: 0, scoreColor: 'gray' as const },
  { topicId: 'lambda',          name: 'Lambda',                rawScore: 0, lastReviewedAt: null, totalSessions: 0, color: '#ad1457', effectiveScore: 0, scoreColor: 'gray' as const },
  { topicId: 'cloudfront',      name: 'CloudFront',            rawScore: 0, lastReviewedAt: null, totalSessions: 0, color: '#00838f', effectiveScore: 0, scoreColor: 'gray' as const },
  { topicId: 'route53',         name: 'Route 53',              rawScore: 0, lastReviewedAt: null, totalSessions: 0, color: '#4e342e', effectiveScore: 0, scoreColor: 'gray' as const },
  { topicId: 'elb',             name: 'ELB',                   rawScore: 0, lastReviewedAt: null, totalSessions: 0, color: '#2e7d32', effectiveScore: 0, scoreColor: 'gray' as const },
  { topicId: 'dynamodb',        name: 'DynamoDB',              rawScore: 0, lastReviewedAt: null, totalSessions: 0, color: '#4527a0', effectiveScore: 0, scoreColor: 'gray' as const },
  { topicId: 'sqs-sns',         name: 'SQS / SNS',             rawScore: 0, lastReviewedAt: null, totalSessions: 0, color: '#e65100', effectiveScore: 0, scoreColor: 'gray' as const },
  { topicId: 'cloudwatch',      name: 'CloudWatch',            rawScore: 0, lastReviewedAt: null, totalSessions: 0, color: '#37474f', effectiveScore: 0, scoreColor: 'gray' as const },
  { topicId: 'efs-fsx',         name: 'EFS / FSx',             rawScore: 0, lastReviewedAt: null, totalSessions: 0, color: '#0277bd', effectiveScore: 0, scoreColor: 'gray' as const },
  { topicId: 'glacier',         name: 'Glacier',               rawScore: 0, lastReviewedAt: null, totalSessions: 0, color: '#4a148c', effectiveScore: 0, scoreColor: 'gray' as const },
  { topicId: 'kms-secrets',     name: 'KMS / Secrets Manager', rawScore: 0, lastReviewedAt: null, totalSessions: 0, color: '#b71c1c', effectiveScore: 0, scoreColor: 'gray' as const },
  { topicId: 'trusted-advisor', name: 'Trusted Advisor',       rawScore: 0, lastReviewedAt: null, totalSessions: 0, color: '#1b5e20', effectiveScore: 0, scoreColor: 'gray' as const },
  { topicId: 'storage-gateway', name: 'Storage Gateway',       rawScore: 0, lastReviewedAt: null, totalSessions: 0, color: '#0d47a1', effectiveScore: 0, scoreColor: 'gray' as const },
]

describe('HeatmapGrid', () => {
  it('renders 17 TopicTile components', async () => {
    const wrapper = mount(HeatmapGrid, {
      props: { topics: mockTopics },
      global: { plugins: [router] },
    })
    expect(wrapper.findAll('.topic-tile')).toHaveLength(17)
  })
})
