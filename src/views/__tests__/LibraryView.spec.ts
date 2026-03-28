import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import { db } from '@/db/db'
import LibraryView from '@/views/LibraryView.vue'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

function makeRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', component: { template: '<div>home</div>' } },
      { path: '/library', component: LibraryView },
      { path: '/library/new', component: { template: '<div>new</div>' } },
      { path: '/library/:id/edit', component: { template: '<div>edit</div>' } },
    ],
  })
}

function mountLibraryView() {
  const div = document.createElement('div')
  document.body.appendChild(div)
  const router = makeRouter()
  router.push('/library')
  return mount(LibraryView, {
    attachTo: div,
    global: {
      plugins: [router, [PrimeVue, {}], ConfirmationService, ToastService],
    },
  })
}

async function openImportAndPreview(_wrapper: ReturnType<typeof mountLibraryView>, json: unknown) {
  const importBtn = [...document.querySelectorAll('button')].find(
    (b) => b.textContent?.trim() === 'Import',
  )
  importBtn!.click()
  await flushPromises()

  const textarea = document.querySelector('textarea') as HTMLTextAreaElement
  textarea.value = JSON.stringify(json)
  textarea.dispatchEvent(new Event('input'))
  await flushPromises()

  const previewBtn = [...document.querySelectorAll('button')].find(
    (b) => b.textContent?.trim() === 'Preview',
  )
  previewBtn!.click()
  await flushPromises()
}

const validQuestion = {
  topicId: 'ec2',
  text: 'What is EC2?',
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 0,
  explanation: 'EC2 is compute.',
}

describe('LibraryView import dialog', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.questions.clear()
    await db.topics.clear()
    document.body.replaceChildren()
  })

  it('plain JSON array shows existing questions-only preview, no backup-preview', async () => {
    const wrapper = mountLibraryView()
    await flushPromises()

    await openImportAndPreview(wrapper, [validQuestion])

    const backupPreview = document.querySelector('[data-testid="backup-preview"]')
    expect(backupPreview).toBeNull()

    const previewEl = document.querySelector('.import-dialog__preview')
    expect(previewEl).not.toBeNull()
  })

  it('valid backup JSON shows backup-preview with valid count and topic count', async () => {
    const wrapper = mountLibraryView()
    await flushPromises()

    const backup = {
      version: 1,
      questions: [validQuestion, validQuestion],
      topics: [
        { topicId: 'ec2', name: 'EC2', color: '#000', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
        { topicId: 's3', name: 'S3', color: '#111', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
      ],
    }

    await openImportAndPreview(wrapper, backup)

    const backupPreview = document.querySelector('[data-testid="backup-preview"]')
    expect(backupPreview).not.toBeNull()

    const validCount = document.querySelector('[data-testid="backup-valid-count"]')
    expect(validCount?.textContent).toBe('2')

    const topicCount = document.querySelector('[data-testid="backup-topic-count"]')
    expect(topicCount?.textContent).toBe('2')
  })

  it('backup with some invalid questions shows backup-invalid-count', async () => {
    const wrapper = mountLibraryView()
    await flushPromises()

    const invalidQuestion = { topicId: '', text: '' }
    const backup = {
      version: 1,
      questions: [validQuestion, invalidQuestion],
      topics: [
        { topicId: 'ec2', name: 'EC2', color: '#000', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
      ],
    }

    await openImportAndPreview(wrapper, backup)

    const invalidCount = document.querySelector('[data-testid="backup-invalid-count"]')
    expect(invalidCount).not.toBeNull()
    expect(invalidCount?.textContent).toBe('1')
  })

  it('backup with unrecognised version shows parse error, no backup-preview', async () => {
    const wrapper = mountLibraryView()
    await flushPromises()

    const backup = {
      version: 99,
      questions: [validQuestion],
      topics: [],
    }

    await openImportAndPreview(wrapper, backup)

    const backupPreview = document.querySelector('[data-testid="backup-preview"]')
    expect(backupPreview).toBeNull()

    const parseError = document.querySelector('.import-dialog__parse-error')
    expect(parseError).not.toBeNull()
  })
})

const validTopic = {
  topicId: 'ec2',
  name: 'EC2',
  color: '#1565c0',
  rawScore: 0,
  lastReviewedAt: null,
  totalSessions: 0,
}

const validBackup = {
  version: 1,
  questions: [validQuestion, { ...validQuestion, topicId: 's3', text: 'What is S3?' }],
  topics: [
    validTopic,
    { topicId: 's3', name: 'S3', color: '#00695c', rawScore: 5, lastReviewedAt: null, totalSessions: 2 },
  ],
}

describe('LibraryView — backup import', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.questions.clear()
    await db.topics.clear()
    document.body.replaceChildren()
  })

  it('scope selector visible after backup preview', async () => {
    const wrapper = mountLibraryView()
    await flushPromises()
    await openImportAndPreview(wrapper, validBackup)

    expect(document.querySelector('[data-testid="scope-questions"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="scope-questions-and-scores"]')).not.toBeNull()
  })

  it('strategy selector visible after backup preview', async () => {
    const wrapper = mountLibraryView()
    await flushPromises()
    await openImportAndPreview(wrapper, validBackup)

    expect(document.querySelector('[data-testid="strategy-replace"]')).not.toBeNull()
    expect(document.querySelector('[data-testid="strategy-merge"]')).not.toBeNull()
  })

  it('replace warning shown by default (strategy = replace)', async () => {
    const wrapper = mountLibraryView()
    await flushPromises()
    await openImportAndPreview(wrapper, validBackup)

    expect(document.querySelector('[data-testid="replace-warning"]')).not.toBeNull()
  })

  it('Replace + questions only: clears questions, topics unchanged', async () => {
    await db.questions.bulkAdd([
      { ...validQuestion, topicId: 'old', text: 'Old question', options: ['A','B','C','D'], correctIndex: 0, explanation: 'x', source: 'generated', errorCount: 0, lastSeenAt: null, createdAt: Date.now() },
    ])
    await db.topics.bulkAdd([
      { topicId: 'old', name: 'Old', color: '#000', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
    ])

    const wrapper = mountLibraryView()
    await flushPromises()
    await openImportAndPreview(wrapper, validBackup)

    const importBtn = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Replace & import',
    )
    importBtn!.click()
    await flushPromises()
    await flushPromises()
    await flushPromises()

    const dbQuestions = await db.questions.toArray()
    expect(dbQuestions).toHaveLength(2)
    expect(dbQuestions.every((q) => q.id !== undefined)).toBe(true)
    expect(dbQuestions.map((q) => q.text)).toContain('What is EC2?')
    expect(dbQuestions.map((q) => q.text)).toContain('What is S3?')

    // topics should still have old topic (questions-only scope)
    const dbTopics = await db.topics.toArray()
    expect(dbTopics.some((t) => t.topicId === 'old')).toBe(true)
  })

  it('Replace + questions + scores: clears both tables and inserts backup data', async () => {
    await db.questions.bulkAdd([
      { ...validQuestion, topicId: 'old', text: 'Old question', options: ['A','B','C','D'], correctIndex: 0, explanation: 'x', source: 'generated', errorCount: 0, lastSeenAt: null, createdAt: Date.now() },
    ])
    await db.topics.bulkAdd([
      { topicId: 'old', name: 'Old', color: '#000', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
    ])

    const wrapper = mountLibraryView()
    await flushPromises()
    await openImportAndPreview(wrapper, validBackup)

    ;(document.querySelector('[data-testid="scope-questions-and-scores"]') as HTMLButtonElement)?.click()
    await flushPromises()

    const importBtn = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Replace & import',
    )
    importBtn!.click()
    await flushPromises()
    await flushPromises()
    await flushPromises()
    await flushPromises()

    const dbQuestions = await db.questions.toArray()
    expect(dbQuestions).toHaveLength(2)
    expect(dbQuestions.every((q) => !('id' in q) || typeof q.id === 'number')).toBe(true)

    const dbTopics = await db.topics.toArray()
    expect(dbTopics).toHaveLength(2)
    expect(dbTopics.some((t) => t.topicId === 'old')).toBe(false)
    expect(dbTopics.some((t) => t.topicId === 'ec2')).toBe(true)
    expect(dbTopics.some((t) => t.topicId === 's3')).toBe(true)
  })

  it('Merge + questions only: new questions inserted, existing topics unchanged', async () => {
    await db.questions.bulkAdd([
      { ...validQuestion, errorCount: 2, source: 'generated' as const, lastSeenAt: null, createdAt: Date.now() },
    ])
    await db.topics.bulkAdd([
      { topicId: 'existing', name: 'Existing', color: '#000', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
    ])

    const wrapper = mountLibraryView()
    await flushPromises()
    await openImportAndPreview(wrapper, validBackup)

    ;(document.querySelector('[data-testid="strategy-merge"]') as HTMLButtonElement)?.click()
    await flushPromises()

    const importBtn = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Merge & import',
    )
    importBtn!.click()
    await flushPromises()
    await flushPromises()
    await flushPromises()

    const dbQuestions = await db.questions.toArray()
    expect(dbQuestions.map((q) => q.text)).toContain('What is EC2?')
    expect(dbQuestions.map((q) => q.text)).toContain('What is S3?')

    // topics untouched (questions-only scope)
    const dbTopics = await db.topics.toArray()
    expect(dbTopics.some((t) => t.topicId === 'existing')).toBe(true)
    expect(dbTopics.some((t) => t.topicId === 'ec2')).toBe(false)
    expect(dbTopics.some((t) => t.topicId === 's3')).toBe(false)
  })

  it('Merge + questions + scores: overlapping questions keep higher errorCount; new topics inserted', async () => {
    await db.questions.bulkAdd([
      { ...validQuestion, errorCount: 10, source: 'generated' as const, lastSeenAt: null, createdAt: Date.now() },
    ])
    await db.topics.bulkAdd([
      { topicId: 'ec2', name: 'EC2 Local', color: '#000', rawScore: 99, lastReviewedAt: null, totalSessions: 0 },
    ])

    const wrapper = mountLibraryView()
    await flushPromises()
    await openImportAndPreview(wrapper, validBackup)

    ;(document.querySelector('[data-testid="strategy-merge"]') as HTMLButtonElement)?.click()
    await flushPromises()
    ;(document.querySelector('[data-testid="scope-questions-and-scores"]') as HTMLButtonElement)?.click()
    await flushPromises()

    const importBtn = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Merge & import',
    )
    importBtn!.click()
    await flushPromises()
    await flushPromises()
    await flushPromises()
    await flushPromises()

    const dbQuestions = await db.questions.toArray()
    const ec2q = dbQuestions.find((q) => q.text === 'What is EC2?')
    // backup has errorCount: 0 (validQuestion default), local has 10 — keep 10
    expect(ec2q?.errorCount).toBe(10)

    const dbTopics = await db.topics.toArray()
    const ec2t = dbTopics.find((t) => t.topicId === 'ec2')
    // local ec2 kept as-is
    expect(ec2t?.name).toBe('EC2 Local')
    expect(ec2t?.rawScore).toBe(99)
    // s3 inserted from backup
    expect(dbTopics.some((t) => t.topicId === 's3')).toBe(true)
  })
})
