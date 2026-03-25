import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { db } from '@/db/db'
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
      expect(t.color).toBe('gray')
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
