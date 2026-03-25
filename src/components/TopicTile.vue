<template>
  <RouterLink
    :to="`/topics/${topic.topicId}`"
    class="topic-tile"
    :style="{ backgroundColor: tileColor }"
  >
    <span class="topic-tile__name">{{ topic.name }}</span>
    <span class="topic-tile__score">{{ Math.round(topic.effectiveScore) }}%</span>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TopicWithScore } from '@/stores/topics'

const props = defineProps<{ topic: TopicWithScore }>()

const COLOR_MAP: Record<string, string> = {
  'ec2':             '#1565c0',
  's3':              '#00695c',
  'vpc':             '#6a1b9a',
  'iam':             '#c62828',
  'rds':             '#283593',
  'lambda':          '#ad1457',
  'cloudfront':      '#00838f',
  'route53':         '#4e342e',
  'elb':             '#2e7d32',
  'dynamodb':        '#4527a0',
  'sqs-sns':         '#e65100',
  'cloudwatch':      '#37474f',
  'efs-fsx':         '#0277bd',
  'glacier':         '#4a148c',
  'kms-secrets':     '#b71c1c',
  'trusted-advisor': '#1b5e20',
  'storage-gateway': '#0d47a1',
}

const tileColor = computed(() => COLOR_MAP[props.topic.topicId] ?? '#78716c')
</script>

<style scoped lang="scss">
.topic-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: #fff;
  font-weight: 600;
  min-height: 72px;
  box-shadow: var(--shadow-md);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover,
  &:focus-visible,
  &:active {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  &__name {
    font-size: 0.875rem;
    text-align: center;
  }

  &__score {
    font-size: 1.25rem;
    margin-top: 0.25rem;
    color: rgba(255, 255, 255, 0.75);
    font-weight: 700;
  }
}
</style>
