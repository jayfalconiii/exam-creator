<template>
  <main class="library-view">
    <header class="library-view__header">
      <div class="library-view__header-top">
        <div>
          <h1>Library</h1>
          <p class="library-view__subtitle">
            {{ filteredQuestions.length }} question{{ filteredQuestions.length !== 1 ? 's' : '' }}
            <template v-if="activeTopicId !== null">
              in {{ activeTopicName }}
            </template>
            <template v-else>
              total
            </template>
          </p>
        </div>
        <div class="library-view__header-actions">
          <Button label="Import" outlined size="small" @click="handleImport" />
          <Button label="Add question" size="small" @click="router.push('/library/new')" />
        </div>
      </div>
    </header>

    <section class="library-view__filters">
      <button
        class="library-view__chip"
        :class="{ 'library-view__chip--active': activeTopicId === null }"
        @click="activeTopicId = null"
      >
        All
      </button>
      <button
        v-for="topic in topics"
        :key="topic.topicId"
        class="library-view__chip"
        :class="{ 'library-view__chip--active': activeTopicId === topic.topicId }"
        @click="activeTopicId = topic.topicId"
      >
        {{ topic.name }}
      </button>
    </section>

    <section class="library-view__list">
      <p v-if="filteredQuestions.length === 0" class="library-view__empty">
        No questions match the selected filter.
      </p>
      <article
        v-for="question in filteredQuestions"
        :key="question.id"
        class="library-view__card"
      >
        <header class="library-view__card-header">
          <span class="library-view__badge">{{ question.topicId }}</span>
          <div class="library-view__card-actions">
            <Button
              label="Edit"
              outlined
              size="small"
              @click="router.push(`/library/${question.id}/edit`)"
            />
            <Button
              label="Delete"
              outlined
              size="small"
              severity="danger"
              @click="handleDelete(question)"
            />
          </div>
        </header>
        <p class="library-view__card-text">{{ question.text }}</p>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { db } from '@/db/db'
import type { Question, Topic } from '@/types'

const router = useRouter()

const questions = ref<Question[]>([])
const topics = ref<Topic[]>([])
const activeTopicId = ref<string | null>(null)

const filteredQuestions = computed(() =>
  activeTopicId.value === null
    ? questions.value
    : questions.value.filter((q) => q.topicId === activeTopicId.value),
)

const activeTopicName = computed(() =>
  topics.value.find((t) => t.topicId === activeTopicId.value)?.name ?? activeTopicId.value,
)

onMounted(async () => {
  ;[questions.value, topics.value] = await Promise.all([
    db.questions.toArray(),
    db.topics.toArray(),
  ])
})

function handleImport() {
  // placeholder
}

function handleDelete(question: Question) {
  console.log('delete', question)
}
</script>

<style scoped lang="scss">
.library-view {
  padding: var(--space-4);
  padding-bottom: 6rem;

  &__header {
    margin-bottom: var(--space-4);
  }

  &__header-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);

    h1 {
      margin: 0;
      color: var(--color-text);
    }
  }

  &__subtitle {
    margin: var(--space-1) 0 0;
    color: var(--color-text-muted);
    font-size: 0.875rem;
  }

  &__header-actions {
    display: flex;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }

  &__chip {
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    color: var(--color-text-muted);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    min-height: 36px;
    transition: background 0.15s, color 0.15s, border-color 0.15s;

    &--active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-text-on-primary);
    }

    &:not(&--active):hover {
      border-color: var(--color-border-strong);
      color: var(--color-text);
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__empty {
    color: var(--color-text-muted);
    text-align: center;
    padding: var(--space-8) 0;
  }

  &__card {
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    box-shadow: var(--shadow-sm);

    &-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
      margin-bottom: var(--space-2);
    }

    &-actions {
      display: flex;
      gap: var(--space-2);
      flex-shrink: 0;
    }

    &-text {
      margin: 0;
      color: var(--color-text);
      font-size: 0.9375rem;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  &__badge {
    display: inline-block;
    padding: 2px var(--space-2);
    background: var(--color-primary-100);
    color: var(--color-primary-700);
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
  }
}
</style>
