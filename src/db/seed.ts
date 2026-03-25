import type { ExamDB } from '@/db/db'
import seedQuestionsRaw from '@/data/seed-questions.json'
import type { Question, Topic } from '@/types'

const SEED_TOPICS: Omit<Topic, 'id'>[] = [
  { topicId: 'ec2',             name: 'EC2',                          rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 's3',              name: 'S3',                           rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'vpc',             name: 'VPC',                          rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'iam',             name: 'IAM',                          rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'rds',             name: 'RDS',                          rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'lambda',          name: 'Lambda',                       rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'cloudfront',      name: 'CloudFront',                   rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'route53',         name: 'Route 53',                     rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'elb',             name: 'ELB',                          rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'dynamodb',        name: 'DynamoDB',                     rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'sqs-sns',         name: 'SQS / SNS',                    rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'cloudwatch',      name: 'CloudWatch',                   rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'efs-fsx',         name: 'EFS / FSx',                    rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'glacier',         name: 'Glacier',                      rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'kms-secrets',     name: 'KMS / Secrets Manager',        rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'trusted-advisor', name: 'Trusted Advisor',              rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'storage-gateway', name: 'Storage Gateway',              rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
]

export async function seedIfNeeded(db: ExamDB): Promise<void> {
  const count = await db.questions.count()
  if (count > 0) return

  const now = Date.now()
  const questions: Omit<Question, 'id'>[] = seedQuestionsRaw.map((q) => ({
    ...q,
    source: 'seed' as const,
    errorCount: 0,
    lastSeenAt: null,
    createdAt: now,
  }))

  await db.transaction('rw', [db.questions, db.topics], async () => {
    await db.questions.bulkAdd(questions)
    await db.topics.bulkAdd(SEED_TOPICS)
  })
}
