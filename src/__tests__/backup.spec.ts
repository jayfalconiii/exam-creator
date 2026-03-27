import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { detectBackupFormat, buildBackup } from '@/utils/backup'

describe('detectBackupFormat', () => {
  it("returns 'backup' for object with version:1, questions, topics", () => {
    const input = { version: 1, questions: [], topics: [] }
    expect(detectBackupFormat(input)).toBe('backup')
  })

  it("returns 'questions' for a plain array", () => {
    expect(detectBackupFormat([])).toBe('questions')
    expect(detectBackupFormat([{ text: 'q1' }])).toBe('questions')
  })

  it("returns 'unknown' for unrecognised inputs (string, null, number, partial object)", () => {
    expect(detectBackupFormat('not valid')).toBe('unknown')
    expect(detectBackupFormat(null)).toBe('unknown')
    expect(detectBackupFormat(42)).toBe('unknown')
    expect(detectBackupFormat({ version: 1 })).toBe('unknown')
    expect(detectBackupFormat({ questions: [], topics: [] })).toBe('unknown')
  })
})
