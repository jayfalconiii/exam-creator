import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db/db'
import type { Topic } from '@/types'
import { effectiveScore, scoreToColor } from '@/composables/useSpacedRepetition'

export interface TopicWithScore extends Topic {
  effectiveScore: number
  color: 'green' | 'yellow' | 'red' | 'gray'
}

export const useTopicsStore = defineStore('topics', () => {
  const topics = ref<Topic[]>([])

  const topicsWithEffectiveScore = computed<TopicWithScore[]>(() =>
    topics.value.map((t) => {
      const score = effectiveScore(t.rawScore, t.lastReviewedAt)
      return {
        ...t,
        effectiveScore: score,
        color: scoreToColor(score, t.lastReviewedAt),
      }
    }),
  )

  async function refreshTopics() {
    topics.value = await db.topics.toArray()
  }

  return { topicsWithEffectiveScore, refreshTopics }
})
