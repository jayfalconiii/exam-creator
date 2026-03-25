export const TOPIC_COLOR_PALETTE: string[] = [
  '#1565c0',
  '#00695c',
  '#6a1b9a',
  '#c62828',
  '#283593',
  '#ad1457',
  '#00838f',
  '#4e342e',
  '#2e7d32',
  '#4527a0',
  '#e65100',
  '#37474f',
  '#0277bd',
  '#4a148c',
  '#b71c1c',
  '#1b5e20',
  '#0d47a1',
  '#f57f17',
  '#558b2f',
  '#6d4c41',
]

export function pickTopicColor(existingColors: string[]): string {
  const counts = new Map<string, number>()
  for (const color of TOPIC_COLOR_PALETTE) {
    counts.set(color, 0)
  }
  for (const color of existingColors) {
    if (counts.has(color)) {
      counts.set(color, (counts.get(color) ?? 0) + 1)
    }
  }
  let least = Infinity
  let picked = TOPIC_COLOR_PALETTE[0]
  for (const [color, count] of counts.entries()) {
    if (count < least) {
      least = count
      picked = color
    }
  }
  return picked
}
