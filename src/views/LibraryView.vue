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
          <Button label="Import" outlined size="small" @click="showImportDialog = true" />
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

    <Dialog
      v-model:visible="showImportDialog"
      modal
      header="Import Questions"
      class="import-dialog"
      :style="{ width: '90vw', maxWidth: '600px' }"
      @hide="resetImportState"
    >
      <div class="import-dialog__tabs">
        <button
          class="import-dialog__tab"
          :class="{ 'import-dialog__tab--active': activeImportTab === 'json' }"
          type="button"
          @click="switchTab('json')"
        >
          JSON
        </button>
        <button
          class="import-dialog__tab"
          :class="{ 'import-dialog__tab--active': activeImportTab === 'csv' }"
          type="button"
          @click="switchTab('csv')"
        >
          CSV
        </button>
      </div>

      <div v-if="activeImportTab === 'json'" class="import-dialog__body">
        <p class="import-dialog__hint">
          Paste a JSON array of questions. Expected shape:
        </p>
        <pre class="import-dialog__example">{{ exampleShape }}</pre>

        <Textarea
          v-model="jsonInput"
          class="import-dialog__textarea"
          rows="8"
          placeholder="Paste JSON here..."
          @input="resetPreview"
        />

        <Button
          label="Preview"
          outlined
          size="small"
          class="import-dialog__preview-btn"
          @click="handlePreview"
        />

        <div v-if="parseError" class="import-dialog__parse-error">
          {{ parseError }}
        </div>

        <div v-if="previewResult" class="import-dialog__preview">
          <p class="import-dialog__preview-summary">
            <strong>{{ previewResult.valid.length }}</strong> valid,
            <strong>{{ previewResult.invalid.length }}</strong> invalid
          </p>
          <ul v-if="previewResult.invalid.length > 0" class="import-dialog__errors">
            <li
              v-for="err in previewResult.invalid"
              :key="err.index"
              class="import-dialog__error-item"
            >
              Row {{ err.index }}: {{ err.fields.join(', ') }}
            </li>
          </ul>
        </div>
      </div>

      <div v-else class="import-dialog__body">
        <p class="import-dialog__hint">
          Upload a <code>.csv</code> file. Expected columns (header row required):
        </p>
        <pre class="import-dialog__example">topicId,text,option1,option2,option3,option4,correctIndex,explanation</pre>
        <p class="import-dialog__hint import-dialog__hint--sub">
          <code>correctIndex</code> is zero-based (0 = option1, 3 = option4)
        </p>

        <input
          ref="csvFileInput"
          type="file"
          accept=".csv"
          class="import-dialog__file-input"
          @change="handleCsvFileChange"
        />

        <div v-if="csvParseError" class="import-dialog__parse-error">
          {{ csvParseError }}
        </div>

        <div v-if="csvPreviewResult" class="import-dialog__preview">
          <p class="import-dialog__preview-summary">
            <strong>{{ csvPreviewResult.valid.length }}</strong> valid,
            <strong>{{ csvPreviewResult.invalid.length }}</strong> invalid
          </p>
          <ul v-if="csvPreviewResult.invalid.length > 0" class="import-dialog__errors">
            <li
              v-for="err in csvPreviewResult.invalid"
              :key="err.index"
              class="import-dialog__error-item"
            >
              Row {{ err.index }}: {{ err.fields.join(', ') }}
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" outlined @click="closeDialog" />
        <Button
          v-if="activeImportTab === 'json'"
          :label="`Import ${previewResult?.valid.length ?? 0} question${(previewResult?.valid.length ?? 0) !== 1 ? 's' : ''}`"
          :disabled="!previewResult || previewResult.valid.length === 0"
          @click="handleImport"
        />
        <Button
          v-else
          :label="`Import ${csvPreviewResult?.valid.length ?? 0} question${(csvPreviewResult?.valid.length ?? 0) !== 1 ? 's' : ''}`"
          :disabled="!csvPreviewResult || csvPreviewResult.valid.length === 0"
          @click="handleCsvImport"
        />
      </template>
    </Dialog>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useConfirm } from 'primevue/useconfirm'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import { db } from '@/db/db'
import type { Question, Topic } from '@/types'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

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

function handleDelete(question: Question) {
  confirm.require({
    message: 'Are you sure you want to delete this question?',
    header: 'Delete Question',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    acceptProps: { severity: 'danger' },
    accept: async () => {
      await db.questions.delete(question.id)
      questions.value = questions.value.filter((q) => q.id !== question.id)
      toast.add({ severity: 'success', summary: 'Deleted', detail: 'Question removed.', life: 3000 })
    },
  })
}

// Import dialog state
const showImportDialog = ref(false)
const activeImportTab = ref<'json' | 'csv'>('json')

// JSON tab state
const jsonInput = ref('')
const parseError = ref<string | null>(null)

// CSV tab state
const csvFileInput = ref<HTMLInputElement | null>(null)
const csvParseError = ref<string | null>(null)
const csvPreviewResult = ref<PreviewResult | null>(null)

interface InvalidItem {
  index: number
  fields: string[]
}

interface PreviewResult {
  valid: Omit<Question, 'id'>[]
  invalid: InvalidItem[]
}

const previewResult = ref<PreviewResult | null>(null)

const exampleShape = `[{ "topicId": "ec2", "text": "...", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "..." }]`

function validateItem(item: unknown, index: number): { valid: Omit<Question, 'id'> | null; error: InvalidItem | null } {
  if (typeof item !== 'object' || item === null) {
    return { valid: null, error: { index, fields: ['item is not an object'] } }
  }

  const raw = item as Record<string, unknown>
  const badFields: string[] = []

  if (typeof raw.topicId !== 'string' || raw.topicId.trim() === '') badFields.push('topicId')
  if (typeof raw.text !== 'string' || raw.text.trim() === '') badFields.push('text')
  if (
    !Array.isArray(raw.options) ||
    raw.options.length !== 4 ||
    raw.options.some((o) => typeof o !== 'string' || (o as string).trim() === '')
  ) {
    badFields.push('options')
  }
  if (
    typeof raw.correctIndex !== 'number' ||
    !Number.isInteger(raw.correctIndex) ||
    raw.correctIndex < 0 ||
    raw.correctIndex > 3
  ) {
    badFields.push('correctIndex')
  }
  if (typeof raw.explanation !== 'string' || raw.explanation.trim() === '') badFields.push('explanation')

  if (badFields.length > 0) {
    return { valid: null, error: { index, fields: badFields } }
  }

  return {
    valid: {
      topicId: raw.topicId as string,
      text: raw.text as string,
      options: raw.options as string[],
      correctIndex: raw.correctIndex as number,
      explanation: raw.explanation as string,
      source: 'generated',
      errorCount: 0,
      lastSeenAt: null,
      createdAt: Date.now(),
    },
    error: null,
  }
}

function handlePreview() {
  parseError.value = null
  previewResult.value = null

  const trimmed = jsonInput.value.trim()
  if (!trimmed) {
    parseError.value = 'Input is empty. Paste a JSON array.'
    return
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    parseError.value = 'Invalid JSON. Please check the syntax and try again.'
    return
  }

  if (!Array.isArray(parsed)) {
    parseError.value = 'Expected a JSON array at the top level.'
    return
  }

  if (parsed.length === 0) {
    parseError.value = 'Array is empty.'
    return
  }

  const valid: Omit<Question, 'id'>[] = []
  const invalid: InvalidItem[] = []

  parsed.forEach((item, index) => {
    const result = validateItem(item, index)
    if (result.valid) valid.push(result.valid)
    else if (result.error) invalid.push(result.error)
  })

  previewResult.value = { valid, invalid }
}

function resetPreview() {
  parseError.value = null
  previewResult.value = null
}

function switchTab(tab: 'json' | 'csv') {
  activeImportTab.value = tab
}

function resetImportState() {
  activeImportTab.value = 'json'
  jsonInput.value = ''
  parseError.value = null
  previewResult.value = null
  csvParseError.value = null
  csvPreviewResult.value = null
  if (csvFileInput.value) csvFileInput.value.value = ''
}

function handleCsvFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  csvParseError.value = null
  csvPreviewResult.value = null

  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    const text = (event.target?.result as string) ?? ''
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')

    if (lines.length < 2) {
      csvParseError.value = 'File must contain a header row and at least one data row.'
      return
    }

    const dataLines = lines.slice(1)
    const valid: Omit<Question, 'id'>[] = []
    const invalid: InvalidItem[] = []

    dataLines.forEach((line, idx) => {
      const rowNum = idx + 2 // 1-based, row 1 = header
      const cols = line.split(',')

      if (cols.length < 8) {
        invalid.push({ index: rowNum, fields: ['not enough columns (expected 8)'] })
        return
      }

      const [topicId, text, opt1, opt2, opt3, opt4, correctIndexRaw, ...explanationParts] = cols
      const explanation = explanationParts.join(',').trim()
      const correctIndex = parseInt(correctIndexRaw.trim(), 10)

      const item: Record<string, unknown> = {
        topicId: topicId.trim(),
        text: text.trim(),
        options: [opt1.trim(), opt2.trim(), opt3.trim(), opt4.trim()],
        correctIndex,
        explanation,
      }

      const result = validateItem(item, rowNum)
      if (result.valid) valid.push(result.valid)
      else if (result.error) invalid.push(result.error)
    })

    csvPreviewResult.value = { valid, invalid }
  }

  reader.readAsText(file)
}

async function handleCsvImport() {
  if (!csvPreviewResult.value || csvPreviewResult.value.valid.length === 0) return

  const toInsert = csvPreviewResult.value.valid.map((q) => toRaw(q))
  await db.questions.bulkAdd(toInsert as Question[])

  questions.value = await db.questions.toArray()

  const count = toInsert.length
  toast.add({
    severity: 'success',
    summary: 'Import Successful',
    detail: `${count} question${count !== 1 ? 's' : ''} imported.`,
    life: 3000,
  })

  closeDialog()
}

function closeDialog() {
  showImportDialog.value = false
  resetImportState()
}

async function handleImport() {
  if (!previewResult.value || previewResult.value.valid.length === 0) return

  const toInsert = previewResult.value.valid.map((q) => toRaw(q))
  await db.questions.bulkAdd(toInsert as Question[])

  questions.value = await db.questions.toArray()

  const count = toInsert.length
  toast.add({
    severity: 'success',
    summary: 'Import Successful',
    detail: `${count} question${count !== 1 ? 's' : ''} imported.`,
    life: 3000,
  })

  closeDialog()
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

.import-dialog {
  &__tabs {
    display: flex;
    gap: var(--space-1);
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--space-4);
  }

  &__tab {
    padding: var(--space-2) var(--space-3);
    border: none;
    background: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    color: var(--color-text-muted);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color 0.15s, border-color 0.15s;

    &--active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
    }

    &--disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__hint {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.875rem;
  }

  &__example {
    margin: 0;
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    color: var(--color-text-muted);
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }

  &__textarea {
    width: 100%;
    font-size: 0.875rem;
    font-family: monospace;
  }

  &__preview-btn {
    align-self: flex-start;
  }

  &__hint--sub {
    margin-top: calc(-1 * var(--space-2));
    font-size: 0.8125rem;
  }

  &__file-input {
    font-size: 0.875rem;
    color: var(--color-text);
  }

  &__parse-error {
    padding: var(--space-2) var(--space-3);
    background: var(--color-danger-50, #fef2f2);
    border: 1px solid var(--color-danger-200, #fecaca);
    border-radius: var(--radius-md);
    color: var(--color-danger, #dc2626);
    font-size: 0.875rem;
  }

  &__preview {
    padding: var(--space-3);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);

    &-summary {
      margin: 0 0 var(--space-2);
      font-size: 0.875rem;
      color: var(--color-text);
    }
  }

  &__errors {
    margin: 0;
    padding-left: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__error-item {
    font-size: 0.8125rem;
    color: var(--color-danger, #dc2626);
  }
}
</style>
