import { describe, it, expect } from 'vitest'
import { effectiveScore, updatedRawScore, scoreToColor } from '@/composables/useSpacedRepetition'

describe('effectiveScore', () => {
  it('returns ~100 when reviewed just now', () => {
    expect(effectiveScore(100, Date.now())).toBeCloseTo(100, 1)
  })

  it('returns ~50 after 7 days (half-life)', () => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    expect(effectiveScore(100, sevenDaysAgo)).toBeCloseTo(50, 0)
  })

  it('returns 0 when lastReviewedAt is null', () => {
    expect(effectiveScore(100, null)).toBe(0)
  })

  it('returns 0 when lastReviewedAt is null and score is 0', () => {
    expect(effectiveScore(0, null)).toBe(0)
  })

  it('scales proportionally with rawScore', () => {
    const now = Date.now()
    expect(effectiveScore(50, now)).toBeCloseTo(50, 1)
  })

  it('decays toward 0 after many days', () => {
    const longAgo = Date.now() - 100 * 24 * 60 * 60 * 1000
    expect(effectiveScore(100, longAgo)).toBeLessThan(1)
  })
})

describe('updatedRawScore', () => {
  it('returns 30 when previousRawScore is 0 and sessionCorrectPct is 1.0', () => {
    expect(updatedRawScore(0, 1.0)).toBe(30)
  })

  it('returns 70 when previousRawScore is 100 and sessionCorrectPct is 0', () => {
    expect(updatedRawScore(100, 0)).toBe(70)
  })

  it('returns 100 when previousRawScore is 100 and sessionCorrectPct is 1.0', () => {
    expect(updatedRawScore(100, 1.0)).toBe(100)
  })

  it('returns 0 when both inputs are 0', () => {
    expect(updatedRawScore(0, 0)).toBe(0)
  })

  it('returns weighted average for 50% session with 50 raw score', () => {
    // (50 * 0.7) + (0.5 * 100 * 0.3) = 35 + 15 = 50
    expect(updatedRawScore(50, 0.5)).toBe(50)
  })
})

describe('scoreToColor', () => {
  it('returns gray when lastReviewedAt is null', () => {
    expect(scoreToColor(100, null)).toBe('gray')
  })

  it('returns gray when score is 0 and lastReviewedAt is null', () => {
    expect(scoreToColor(0, null)).toBe('gray')
  })

  it('returns red when score is 39', () => {
    expect(scoreToColor(39, Date.now())).toBe('red')
  })

  it('returns yellow when score is 40', () => {
    expect(scoreToColor(40, Date.now())).toBe('yellow')
  })

  it('returns yellow when score is 69', () => {
    expect(scoreToColor(69, Date.now())).toBe('yellow')
  })

  it('returns green when score is 70', () => {
    expect(scoreToColor(70, Date.now())).toBe('green')
  })

  it('returns green when score is 100', () => {
    expect(scoreToColor(100, Date.now())).toBe('green')
  })

  it('returns red when score is 0 with valid lastReviewedAt', () => {
    expect(scoreToColor(0, Date.now())).toBe('red')
  })
})
