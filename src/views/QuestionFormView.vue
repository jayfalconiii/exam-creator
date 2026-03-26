<template>
  <main class="question-form-view">
    <header class="question-form-view__header">
      <button class="question-form-view__back-btn" @click="router.push('/library')">
        ← Back
      </button>
      <h1 class="question-form-view__title">{{ isEditMode ? 'Edit Question' : 'New Question' }}</h1>
    </header>

    <form class="question-form-view__form" @submit.prevent="handleSave">
      <div class="question-form-view__field">
        <label class="question-form-view__label" for="topic-select">Topic</label>
        <Select
          id="topic-select"
          v-model="topicSelection"
          :options="topicOptions"
          option-label="label"
          option-value="value"
          placeholder="Select a topic"
          class="question-form-view__select"
          @change="onTopicSelectionChange"
        />
        <span v-if="errors.topicId" class="question-form-view__error">{{ errors.topicId }}</span>

        <div v-if="isCreatingNewTopic" class="question-form-view__new-topic">
          <InputText
            v-model="newTopicName"
            placeholder="Topic name"
            class="question-form-view__new-topic-input"
          />
          <span class="question-form-view__new-topic-preview">
            ID: <code>{{ derivedTopicId || '—' }}</code>
          </span>
          <span v-if="topicIdCollision" class="question-form-view__error">
            Topic ID already exists
          </span>
        </div>
      </div>

      <div class="question-form-view__field">
        <label class="question-form-view__label" for="question-text">Question</label>
        <Textarea
          id="question-text"
          v-model="text"
          auto-resize
          placeholder="Enter question text"
          class="question-form-view__textarea"
        />
        <span v-if="errors.text" class="question-form-view__error">{{ errors.text }}</span>
      </div>

      <fieldset class="question-form-view__options">
        <legend class="question-form-view__label">Options</legend>
        <div
          v-for="(_, i) in options"
          :key="i"
          class="question-form-view__option"
        >
          <label class="question-form-view__option-label">{{ optionLabels[i] }}</label>
          <InputText
            v-model="options[i]"
            :placeholder="`Option ${optionLabels[i]}`"
            class="question-form-view__option-input"
          />
        </div>
        <span v-if="errors.options" class="question-form-view__error">{{ errors.options }}</span>
      </fieldset>

      <fieldset class="question-form-view__correct">
        <legend class="question-form-view__label">Correct Answer</legend>
        <div class="question-form-view__radio-group">
          <div
            v-for="(_, i) in options"
            :key="i"
            class="question-form-view__radio-item"
          >
            <RadioButton
              :input-id="`correct-${i}`"
              :value="i"
              v-model="correctIndex"
            />
            <label :for="`correct-${i}`">{{ optionLabels[i] }}</label>
          </div>
        </div>
        <span v-if="errors.correctIndex" class="question-form-view__error">{{ errors.correctIndex }}</span>
      </fieldset>

      <div class="question-form-view__field">
        <label class="question-form-view__label" for="explanation">Explanation</label>
        <Textarea
          id="explanation"
          v-model="explanation"
          auto-resize
          placeholder="Enter explanation"
          class="question-form-view__textarea"
        />
        <span v-if="errors.explanation" class="question-form-view__error">{{ errors.explanation }}</span>
      </div>

      <div class="question-form-view__actions">
        <Button
          type="button"
          label="Cancel"
          outlined
          @click="router.push('/library')"
        />
        <Button
          type="submit"
          label="Save"
          :disabled="topicIdCollision"
        />
      </div>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Select, { type SelectChangeEvent } from 'primevue/select'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import RadioButton from 'primevue/radiobutton'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { db } from '@/db/db'
import { pickTopicColor } from '@/utils/topicColors'
import type { Topic } from '@/types'

const CREATE_NEW_VALUE = '__create_new__'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const isEditMode = computed(() => !!route.params.id)

const topics = ref<Topic[]>([])
const topicId = ref<string>('')
const topicSelection = ref<string>('')
const isCreatingNewTopic = ref(false)
const newTopicName = ref('')

const text = ref('')
const options = ref(['', '', '', ''])
const correctIndex = ref<number | null>(null)
const explanation = ref('')
const optionLabels = ['A', 'B', 'C', 'D']

const errors = ref<Record<string, string>>({})

const topicOptions = computed(() => {
  const existing = topics.value.map((t) => ({ label: t.name, value: t.topicId }))
  return [...existing, { label: '＋ Create new topic', value: CREATE_NEW_VALUE }]
})

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const derivedTopicId = computed(() => slugify(newTopicName.value))

const topicIdCollision = computed(() => {
  if (!isCreatingNewTopic.value || !derivedTopicId.value) return false
  return topics.value.some((t) => t.topicId === derivedTopicId.value)
})

function onTopicSelectionChange(e: SelectChangeEvent) {
  const val = e.value
  if (val === CREATE_NEW_VALUE) {
    isCreatingNewTopic.value = true
    topicId.value = ''
    newTopicName.value = ''
  } else {
    isCreatingNewTopic.value = false
    newTopicName.value = ''
    topicId.value = val
  }
}

onMounted(async () => {
  topics.value = await db.topics.toArray()

  if (isEditMode.value) {
    const id = Number(route.params.id)
    const question = await db.questions.get(id)
    if (!question) {
      toast.add({ severity: 'error', summary: 'Not found', detail: 'Question not found.', life: 3000 })
      router.push('/library')
      return
    }
    topicId.value = question.topicId
    topicSelection.value = question.topicId
    text.value = question.text
    options.value = [...question.options]
    correctIndex.value = question.correctIndex
    explanation.value = question.explanation
  }
})

function validate(): boolean {
  const e: Record<string, string> = {}
  const resolvedTopicId = isCreatingNewTopic.value ? derivedTopicId.value : topicId.value
  if (!resolvedTopicId) e.topicId = 'Topic is required.'
  if (!text.value.trim()) e.text = 'Question text is required.'
  if (options.value.some((o) => !o.trim())) e.options = 'All four options are required.'
  if (correctIndex.value === null) e.correctIndex = 'Select the correct answer.'
  if (!explanation.value.trim()) e.explanation = 'Explanation is required.'
  errors.value = e
  return Object.keys(e).length === 0
}

async function handleSave() {
  if (!validate()) return
  if (topicIdCollision.value) return

  const resolvedTopicId = isCreatingNewTopic.value ? derivedTopicId.value : topicId.value

  if (isCreatingNewTopic.value) {
    const existingColors = topics.value.map((t) => t.color)
    await db.topics.add({
      topicId: resolvedTopicId,
      name: newTopicName.value.trim(),
      color: pickTopicColor(existingColors),
      rawScore: 0,
      lastReviewedAt: null,
      totalSessions: 0,
    })
  }

  if (isEditMode.value) {
    const id = Number(route.params.id)
    await db.questions.update(id, {
      topicId: resolvedTopicId,
      text: text.value.trim(),
      options: options.value.map((o) => o.trim()),
      correctIndex: correctIndex.value as number,
      explanation: explanation.value.trim(),
    })
    toast.add({ severity: 'success', summary: 'Question updated', detail: 'Changes saved.', life: 3000 })
  } else {
    await db.questions.add({
      topicId: resolvedTopicId,
      text: text.value.trim(),
      options: options.value.map((o) => o.trim()),
      correctIndex: correctIndex.value as number,
      explanation: explanation.value.trim(),
      source: 'generated',
      errorCount: 0,
      lastSeenAt: null,
      createdAt: Date.now(),
    })
    toast.add({ severity: 'success', summary: 'Question added', detail: 'Your question has been saved.', life: 3000 })
  }

  router.push('/library')
}
</script>

<style scoped lang="scss">
.question-form-view {
  padding: var(--space-4);
  padding-bottom: 6rem;

  &__header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-5);
  }

  &__back-btn {
    background: none;
    border: none;
    color: var(--color-primary);
    cursor: pointer;
    font-size: 0.9375rem;
    padding: 0;
    flex-shrink: 0;

    &:hover {
      text-decoration: underline;
    }
  }

  &__title {
    margin: 0;
    color: var(--color-text);
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
  }

  &__select {
    width: 100%;
  }

  &__textarea {
    width: 100%;
  }

  &__new-topic {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-top: var(--space-1);

    &-input {
      width: 100%;
    }

    &-preview {
      font-size: 0.8125rem;
      color: var(--color-text-muted);

      code {
        font-family: monospace;
      }
    }
  }

  &__options {
    border: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    legend {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }
  }

  &__option {
    display: flex;
    align-items: center;
    gap: var(--space-2);

    &-label {
      font-weight: 600;
      color: var(--color-text-muted);
      width: 1.25rem;
      flex-shrink: 0;
    }

    &-input {
      flex: 1;
    }
  }

  &__correct {
    border: none;
    padding: 0;
    margin: 0;

    legend {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }
  }

  &__radio-group {
    display: flex;
    gap: var(--space-4);
  }

  &__radio-item {
    display: flex;
    align-items: center;
    gap: var(--space-1);

    label {
      font-weight: 600;
      color: var(--color-text);
      cursor: pointer;
    }
  }

  &__error {
    font-size: 0.8125rem;
    color: var(--color-danger, #e53e3e);
  }

  &__actions {
    display: flex;
    gap: var(--space-3);
    justify-content: flex-end;
    padding-top: var(--space-2);
  }
}
</style>
