import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { db } from '@/db/db'
import type { Topic } from '@/types'

const SEED_TOPICS: Omit<Topic, 'id'>[] = [
  { topicId: 'ec2', name: 'EC2', color: '#1565c0', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 's3', name: 'S3', color: '#00695c', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'vpc', name: 'VPC', color: '#6a1b9a', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'iam', name: 'IAM', color: '#c62828', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'rds', name: 'RDS', color: '#283593', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'lambda', name: 'Lambda', color: '#ad1457', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'cloudfront', name: 'CloudFront', color: '#00838f', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'route53', name: 'Route 53', color: '#4e342e', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'elb', name: 'ELB', color: '#2e7d32', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'dynamodb', name: 'DynamoDB', color: '#4527a0', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'sqs-sns', name: 'SQS / SNS', color: '#e65100', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'cloudwatch', name: 'CloudWatch', color: '#37474f', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'efs-fsx', name: 'EFS / FSx', color: '#0277bd', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'glacier', name: 'Glacier', color: '#4a148c', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'kms-secrets', name: 'KMS / Secrets Manager', color: '#b71c1c', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'trusted-advisor', name: 'Trusted Advisor', color: '#1b5e20', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'storage-gateway', name: 'Storage Gateway', color: '#0d47a1', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
]

describe('useTopicsStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.topics.clear()
    await db.topics.bulkAdd(SEED_TOPICS.map((t) => ({ ...t })))
  })

  it('topicsWithEffectiveScore loads 17 topics from db.topics', async () => {
    const { useTopicsStore } = await import('@/stores/topics')
    const store = useTopicsStore()
    await store.refreshTopics()
    expect(store.topicsWithEffectiveScore).toHaveLength(17)
  })

  it('each topic has effectiveScore applying SR decay at read time', async () => {
    const { useTopicsStore } = await import('@/stores/topics')
    const store = useTopicsStore()
    await db.topics.where('topicId').equals('ec2').modify({ rawScore: 80, lastReviewedAt: Date.now() })
    await store.refreshTopics()
    const ec2 = store.topicsWithEffectiveScore.find((t) => t.topicId === 'ec2')
    expect(ec2).toBeDefined()
    expect(ec2!.effectiveScore).toBeGreaterThan(0)
    expect(ec2!.effectiveScore).toBeLessThanOrEqual(80)
  })

  it('topics show score 0 and gray on first launch (never reviewed)', async () => {
    const { useTopicsStore } = await import('@/stores/topics')
    const store = useTopicsStore()
    await store.refreshTopics()
    for (const t of store.topicsWithEffectiveScore) {
      expect(t.effectiveScore).toBe(0)
      expect(t.scoreColor).toBe('gray')
    }
  })

  it('refreshTopics re-queries DB and updates state reactively', async () => {
    const { useTopicsStore } = await import('@/stores/topics')
    const store = useTopicsStore()
    await store.refreshTopics()
    expect(store.topicsWithEffectiveScore).toHaveLength(17)
    await db.topics.where('topicId').equals('s3').modify({ rawScore: 75, lastReviewedAt: Date.now() })
    await store.refreshTopics()
    const s3 = store.topicsWithEffectiveScore.find((t) => t.topicId === 's3')
    expect(s3!.effectiveScore).toBeGreaterThan(0)
  })
})
