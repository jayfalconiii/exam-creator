<template>
  <main class="stats-view">
    <header class="stats-view__header">
      <h1 class="stats-view__title">Stats</h1>
      <section class="stats-view__overall" aria-label="Overall stats">
        <div class="stats-view__stat">
          <span class="stats-view__stat-label">Sessions</span>
          <span class="stats-view__stat-value" data-testid="stat-total-sessions">{{ sessions.length }}</span>
        </div>
        <div class="stats-view__stat">
          <span class="stats-view__stat-label">Questions</span>
          <span class="stats-view__stat-value" data-testid="stat-total-questions">{{ totalQuestions }}</span>
        </div>
        <div class="stats-view__stat">
          <span class="stats-view__stat-label">Correct</span>
          <span class="stats-view__stat-value" data-testid="stat-correct-pct">{{ overallPct }}%</span>
        </div>
      </section>
    </header>

    <p v-if="sessions.length === 0" class="stats-view__empty" data-testid="empty-state">
      No sessions completed yet. Start studying to see your history here.
    </p>

    <ol v-else class="stats-view__list" data-testid="session-list">
      <li
        v-for="session in sessions"
        :key="session.id"
        class="stats-view__row"
        data-testid="session-row"
        @touchstart.passive="onTouchStart($event, session.id!)"
        @touchmove.passive="onTouchMove($event, session.id!)"
        @touchend="onTouchEnd(session.id!)"
      >
        <button
          class="stats-view__delete-action"
          data-testid="delete-action"
          aria-label="Delete session"
          @click="handleDelete(session)"
        >
          Delete
        </button>
        <div
          class="stats-view__row-content"
          :style="{ transform: `translateX(${getOffset(session.id!)}px)` }"
          :class="{ 'stats-view__row-content--animating': !isDragging(session.id!) }"
        >
          <div class="stats-view__row-primary">
            <time class="stats-view__date" data-testid="session-date">{{ formatDate(session.startedAt) }}</time>
            <span class="stats-view__mode" data-testid="session-mode">{{ session.mode }}</span>
          </div>
          <div class="stats-view__row-secondary">
            <span class="stats-view__score" data-testid="session-score">{{ session.correctCount }} / {{ session.totalQuestions }}</span>
            <span class="stats-view__duration" data-testid="session-duration">{{ formatDuration(session.durationMs) }}</span>
          </div>
        </div>
      </li>
    </ol>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { db } from '@/db/db'
import { updatedRawScore } from '@/composables/useSpacedRepetition'
import type { Session } from '@/types'

const sessions = ref<Session[]>([])
const confirm = useConfirm()

onMounted(async () => {
  const all = await db.sessions.toArray()
  sessions.value = all.slice().sort((a, b) => b.startedAt - a.startedAt)
})

const totalQuestions = computed(() => sessions.value.reduce((acc, s) => acc + s.totalQuestions, 0))

const overallPct = computed(() => {
  if (totalQuestions.value === 0) return 0
  const totalCorrect = sessions.value.reduce((acc, s) => acc + s.correctCount, 0)
  return Math.round((totalCorrect / totalQuestions.value) * 100)
})

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}m ${s}s`
}

// Swipe state
const SNAP_OPEN = 80
const SNAP_THRESHOLD = 40

const openSwipeId = ref<number | null>(null)
const swipeOffsets = ref<Map<number, number>>(new Map())
const dragging = ref<Set<number>>(new Set())

interface SwipeStart { x: number; y: number; baseOffset: number }
const swipeStartMap = new Map<number, SwipeStart>()

function getOffset(id: number): number {
  return -(swipeOffsets.value.get(id) ?? 0)
}

function isDragging(id: number): boolean {
  return dragging.value.has(id)
}

function closeRow(id: number) {
  swipeOffsets.value = new Map(swipeOffsets.value).set(id, 0)
  if (openSwipeId.value === id) openSwipeId.value = null
}

function openRow(id: number) {
  swipeOffsets.value = new Map(swipeOffsets.value).set(id, SNAP_OPEN)
  openSwipeId.value = id
}

function onTouchStart(e: TouchEvent, id: number) {
  const touch = e.touches[0]
  const baseOffset = openSwipeId.value === id ? SNAP_OPEN : 0
  swipeStartMap.set(id, { x: touch.clientX, y: touch.clientY, baseOffset })
  const newDragging = new Set(dragging.value)
  newDragging.add(id)
  dragging.value = newDragging
}

function onTouchMove(e: TouchEvent, id: number) {
  const start = swipeStartMap.get(id)
  if (!start) return

  const touch = e.touches[0]
  const dx = start.x - touch.clientX
  const dy = touch.clientY - start.y

  if (Math.abs(dx) < Math.abs(dy) * 2 && swipeOffsets.value.get(id) === 0) return

  const clamped = Math.max(0, Math.min(SNAP_OPEN, start.baseOffset + dx))
  swipeOffsets.value = new Map(swipeOffsets.value).set(id, clamped)
}

function onTouchEnd(id: number) {
  const newDragging = new Set(dragging.value)
  newDragging.delete(id)
  dragging.value = newDragging

  const offset = swipeOffsets.value.get(id) ?? 0
  const prevOpen = openSwipeId.value

  if (offset >= SNAP_THRESHOLD) {
    if (prevOpen !== null && prevOpen !== id) closeRow(prevOpen)
    openRow(id)
  } else {
    closeRow(id)
  }
}

function handleDelete(session: Session) {
  confirm.require({
    message: 'Delete this session from your history?',
    header: 'Delete Session',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptProps: { severity: 'danger' },
    accept: async () => {
      await db.sessions.delete(session.id)
      sessions.value = sessions.value.filter((s) => s.id !== session.id)
      closeRow(session.id!)

      // Recompute rawScore, lastReviewedAt, totalSessions for affected topics
      const affectedTopicIds = [...new Set(session.topicIds)]
      const remaining = await db.sessions.toArray()
      for (const topicId of affectedTopicIds) {
        const topic = await db.topics.where('topicId').equals(topicId).first()
        if (!topic?.id) continue
        const topicSessions = remaining
          .filter((s) => s.topicIds.includes(topicId) && s.completedAt !== null)
          .sort((a, b) => a.startedAt - b.startedAt)
        let rawScore = 0
        for (const s of topicSessions) {
          const pct = s.totalQuestions > 0 ? s.correctCount / s.totalQuestions : 0
          rawScore = updatedRawScore(rawScore, pct)
        }
        const lastSession = topicSessions[topicSessions.length - 1]
        await db.topics.update(topic.id, {
          rawScore,
          lastReviewedAt: lastSession?.completedAt ?? null,
          totalSessions: topicSessions.length,
        })
      }
    },
  })
}
</script>

<style scoped lang="scss">
.stats-view {
  padding: var(--space-4);
  padding-bottom: 5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  &__header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text);
  }

  &__overall {
    display: flex;
    gap: 1.5rem;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  &__stat-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  &__stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-primary);
  }

  &__empty {
    color: var(--color-text-muted);
    text-align: center;
    padding: 3rem 1rem;
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__row {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius-lg);
  }

  &__delete-action {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 80px;
    background: var(--color-danger, #dc2626);
    color: #fff;
    border: none;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__row-content {
    position: relative;
    z-index: 1;
    padding: 1rem;
    border: 1px solid var(--color-border);
    border-radius: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: var(--shadow-sm);
    background: var(--color-surface);

    &--animating {
      @media not (prefers-reduced-motion: reduce) {
        transition: transform 0.25s ease;
      }
    }
  }

  &__row-primary {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__row-secondary {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
  }

  &__date {
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  &__mode {
    font-weight: 600;
    text-transform: capitalize;
    color: var(--color-text);
  }

  &__score {
    font-weight: 600;
    color: var(--color-text);
  }

  &__duration {
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }
}
</style>
