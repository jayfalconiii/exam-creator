const DECAY_RATE = 0.1
const SCORE_GREEN = 70
const SCORE_YELLOW = 40

export function effectiveScore(rawScore: number, lastReviewedAt: number | null): number {
  if (lastReviewedAt === null) return 0
  const daysSince = (Date.now() - lastReviewedAt) / (1000 * 60 * 60 * 24)
  return rawScore * Math.exp(-DECAY_RATE * daysSince)
}

export function updatedRawScore(previousRawScore: number, sessionCorrectPct: number): number {
  return (previousRawScore * 0.7) + (sessionCorrectPct * 100 * 0.3)
}

export function scoreToColor(score: number, lastReviewedAt: number | null): 'green' | 'yellow' | 'red' | 'gray' {
  if (lastReviewedAt === null) return 'gray'
  if (score >= SCORE_GREEN) return 'green'
  if (score >= SCORE_YELLOW) return 'yellow'
  return 'red'
}
