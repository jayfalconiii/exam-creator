import type { Topic } from '@/types'

export const TOPIC_DEFINITIONS: Omit<Topic, 'id'>[] = [
  { topicId: 'ec2',             name: 'EC2',                          rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 's3',              name: 'S3',                           rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'vpc',             name: 'VPC',                          rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'iam',             name: 'IAM',                          rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'rds',             name: 'RDS',                          rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'lambda',          name: 'Lambda',                       rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'cloudfront',      name: 'CloudFront',                   rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'route53',         name: 'Route 53',                     rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'elb',             name: 'ELB / Auto Scaling',           rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'dynamodb',        name: 'DynamoDB',                     rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'sqs-sns',         name: 'SQS / SNS',                    rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'cloudwatch',      name: 'CloudWatch / CloudTrail',      rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'efs-fsx',         name: 'EFS / FSx',                    rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'glacier',         name: 'S3 Glacier / Storage Classes', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'kms-secrets',     name: 'KMS / Secrets Manager',        rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'trusted-advisor', name: 'Trusted Advisor',              rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
  { topicId: 'storage-gateway', name: 'Storage Gateway',              rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
]
