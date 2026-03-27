import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { detectBackupFormat } from '@/utils/backup'

describe('detectBackupFormat', () => {
  it("returns 'backup' for object with version:1, questions, topics", () => {
    const input = { version: 1, questions: [], topics: [] }
    expect(detectBackupFormat(input)).toBe('backup')
  })
})
