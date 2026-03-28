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
