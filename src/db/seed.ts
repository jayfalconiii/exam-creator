import type { ExamDB } from '@/db/db'
import seedQuestionsRaw from '@/data/seed-questions.json'
import type { Question, Topic } from '@/types'

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
