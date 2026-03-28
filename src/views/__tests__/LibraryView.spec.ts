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

function mockFileReader(content: string) {
  const mockReader = {
    onload: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null,
    onerror: null,
    result: content,
    readAsText() {
      if (this.onload) {
        this.onload.call(
          this as unknown as FileReader,
          { target: { result: content } } as unknown as ProgressEvent<FileReader>,
        )
      }
    },
  }
  vi.spyOn(window, 'FileReader').mockImplementation(() => mockReader as unknown as FileReader)
  return mockReader
}

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

describe('LibraryView — JSON file upload zone', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.questions.clear()
    await db.topics.clear()
    document.body.replaceChildren()
  })

  it('upload zone renders above the textarea in the JSON tab', async () => {
    mountLibraryView()
    await flushPromises()

    const importBtn = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Import',
    )
    importBtn!.click()
    await flushPromises()

    const uploadZone = document.querySelector('[data-testid="json-upload-zone"]')
    const textarea = document.querySelector('textarea')
    expect(uploadZone).not.toBeNull()
    expect(textarea).not.toBeNull()

    // upload zone must come before the textarea in the DOM
    const position = uploadZone!.compareDocumentPosition(textarea!)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('loading a valid JSON file populates the textarea and auto-runs preview', async () => {
    const content = JSON.stringify([validQuestion])
    mockFileReader(content)

    mountLibraryView()
    await flushPromises()

    const importBtn = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Import',
    )
    importBtn!.click()
    await flushPromises()

    const fileInput = document.querySelector('input[type="file"][accept=".json"]') as HTMLInputElement
    expect(fileInput).not.toBeNull()

    const file = new File([content], 'questions.json', { type: 'application/json' })
    Object.defineProperty(fileInput, 'files', { value: [file] })
    fileInput.dispatchEvent(new Event('change'))
    await flushPromises()
    await flushPromises()

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    expect(textarea.value).toBe(content)

    // preview result should be shown automatically
    const previewEl = document.querySelector('.import-dialog__preview')
    expect(previewEl).not.toBeNull()
  })

  it('uploading a non-JSON file shows inline error inside the upload zone', async () => {
    mountLibraryView()
    await flushPromises()

    const importBtn = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Import',
    )
    importBtn!.click()
    await flushPromises()

    const fileInput = document.querySelector('input[type="file"][accept=".json"]') as HTMLInputElement
    const file = new File(['some csv content'], 'data.csv', { type: 'text/csv' })
    Object.defineProperty(fileInput, 'files', { value: [file] })
    fileInput.dispatchEvent(new Event('change'))
    await flushPromises()

    const errorEl = document.querySelector('[data-testid="json-file-error"]')
    expect(errorEl).not.toBeNull()
    expect(errorEl!.textContent).toContain('.json')
  })

  it('uploading a second file resets prior preview and error state', async () => {
    // Load a valid first file to populate preview
    const content1 = JSON.stringify([validQuestion])
    mockFileReader(content1)

    mountLibraryView()
    await flushPromises()

    const importBtn = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Import',
    )
    importBtn!.click()
    await flushPromises()

    const fileInput = document.querySelector('input[type="file"][accept=".json"]') as HTMLInputElement
    const file1 = new File([content1], 'first.json', { type: 'application/json' })
    Object.defineProperty(fileInput, 'files', { value: [file1], configurable: true })
    fileInput.dispatchEvent(new Event('change'))
    await flushPromises()
    await flushPromises()

    // Confirm preview shown
    expect(document.querySelector('.import-dialog__preview')).not.toBeNull()

    // Now load a second (invalid) file — should reset preview before erroring
    const content2 = 'not valid json at all'
    mockFileReader(content2)

    const file2 = new File([content2], 'second.json', { type: 'application/json' })
    Object.defineProperty(fileInput, 'files', { value: [file2], configurable: true })
    fileInput.dispatchEvent(new Event('change'))
    await flushPromises()
    await flushPromises()

    // Old preview should be gone, parse error should show
    expect(document.querySelector('.import-dialog__preview')).toBeNull()
    expect(document.querySelector('.import-dialog__parse-error')).not.toBeNull()
  })
})

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

  it('Merge button is enabled (not disabled)', async () => {
    const wrapper = mountLibraryView()
    await flushPromises()
    await openImportAndPreview(wrapper, validBackup)

    const mergeBtn = document.querySelector('[data-testid="strategy-merge"]') as HTMLButtonElement
    expect(mergeBtn).not.toBeNull()
    expect(mergeBtn.disabled).toBe(false)
  })

  it('Merge + questions only: duplicate resolved by higher errorCount, new question inserted, topics unchanged', async () => {
    await db.questions.bulkAdd([
      { ...validQuestion, topicId: 'ec2', text: 'What is EC2?', options: ['A','B','C','D'], correctIndex: 0, explanation: 'x', source: 'generated', errorCount: 1, lastSeenAt: null, createdAt: Date.now() },
    ])
    await db.topics.bulkAdd([
      { topicId: 'old', name: 'Old', color: '#000', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
    ])

    const backupWithHigherError = {
      version: 1,
      questions: [
        { ...validQuestion, topicId: 'ec2', text: 'What is EC2?', errorCount: 7 },
        { ...validQuestion, topicId: 's3', text: 'What is S3?', errorCount: 0 },
      ],
      topics: [
        { topicId: 's3', name: 'S3', color: '#00695c', rawScore: 5, lastReviewedAt: null, totalSessions: 2 },
      ],
    }

    const wrapper = mountLibraryView()
    await flushPromises()
    await openImportAndPreview(wrapper, backupWithHigherError)

    ;(document.querySelector('[data-testid="strategy-merge"]') as HTMLButtonElement)?.click()
    await flushPromises()

    const importBtn = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Merge & import',
    )
    importBtn!.click()
    for (let i = 0; i < 20; i++) await flushPromises()

    const dbQuestions = await db.questions.toArray()
    expect(dbQuestions).toHaveLength(2)
    const ec2Q = dbQuestions.find((q) => q.topicId === 'ec2' && q.text === 'What is EC2?')
    expect(ec2Q?.errorCount).toBe(7)

    // topics unchanged (questions only scope)
    const dbTopics = await db.topics.toArray()
    expect(dbTopics).toHaveLength(1)
    expect(dbTopics[0].topicId).toBe('old')
  })

  it('Merge + questions + scores: existing topics kept; new topics inserted', async () => {
    await db.questions.bulkAdd([
      { ...validQuestion, topicId: 'ec2', text: 'What is EC2?', options: ['A','B','C','D'], correctIndex: 0, explanation: 'x', source: 'generated', errorCount: 3, lastSeenAt: null, createdAt: Date.now() },
    ])
    await db.topics.bulkAdd([
      { topicId: 'ec2', name: 'EC2', color: '#aaa', rawScore: 99, lastReviewedAt: null, totalSessions: 5 },
    ])

    const backupMergeData = {
      version: 1,
      questions: [
        { ...validQuestion, topicId: 'ec2', text: 'What is EC2?', errorCount: 1 },
        { ...validQuestion, topicId: 's3', text: 'What is S3?', errorCount: 0 },
      ],
      topics: [
        { topicId: 'ec2', name: 'EC2 backup', color: '#000', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
        { topicId: 's3', name: 'S3', color: '#111', rawScore: 0, lastReviewedAt: null, totalSessions: 0 },
      ],
    }

    const wrapper = mountLibraryView()
    await flushPromises()
    await openImportAndPreview(wrapper, backupMergeData)

    ;(document.querySelector('[data-testid="scope-questions-and-scores"]') as HTMLButtonElement)?.click()
    await flushPromises()
    ;(document.querySelector('[data-testid="strategy-merge"]') as HTMLButtonElement)?.click()
    await flushPromises()

    const importBtn = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Merge & import',
    )
    importBtn!.click()
    for (let i = 0; i < 20; i++) await flushPromises()

    const dbTopics = await db.topics.toArray()
    expect(dbTopics).toHaveLength(2)
    const ec2T = dbTopics.find((t) => t.topicId === 'ec2')!
    expect(ec2T.rawScore).toBe(99)   // local kept
    expect(ec2T.name).toBe('EC2')    // local kept
    expect(dbTopics.some((t) => t.topicId === 's3')).toBe(true)

    const dbQuestions = await db.questions.toArray()
    expect(dbQuestions).toHaveLength(2)
    const ec2Q = dbQuestions.find((q) => q.topicId === 'ec2')!
    expect(ec2Q.errorCount).toBe(3)  // local higher errorCount kept
  })
})
