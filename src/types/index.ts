export type ThemePreference = 'light' | 'dark' | 'auto'
export type QuestionSource = 'seed' | 'generated'
export type SessionMode = 'review' | 'difficult' | 'new' | 'mixed'
export type FeedbackMode = 'study' | 'exam'
export type SettingKey =
  | 'apiKey'
  | 'defaultQuestionCount'
  | 'defaultMode'
  | 'session_topicIds'
  | 'session_mode'
  | 'session_questionCount'
  | 'session_feedbackMode'
  | 'session_timerEnabled'
  | 'session_timerSeconds'
  | 'theme'

export interface Question {
  id?: number
  topicId: string
  text: string
  options: string[]
  correctIndex: number
  explanation: string
  source: QuestionSource
  errorCount: number
  lastSeenAt: number | null
  createdAt: number
}

export interface Topic {
  id?: number
  topicId: string
  name: string
  rawScore: number
  lastReviewedAt: number | null
  totalSessions: number
}

export interface Session {
  id?: number
  startedAt: number
  completedAt: number | null
  mode: SessionMode
  topicIds: string[]
  totalQuestions: number
  correctCount: number
  durationMs: number
}

export interface Setting {
  key: SettingKey
  value: string
}

export interface SessionConfig {
  topicIds: string[]
  mode: SessionMode
  questionCount: number
  feedbackMode: FeedbackMode
  timerEnabled: boolean
  timerSeconds: number
}

export interface GeneratedQuestion {
  topicId: string
  text: string
  options: string[]
  correctIndex: number
  explanation: string
}
