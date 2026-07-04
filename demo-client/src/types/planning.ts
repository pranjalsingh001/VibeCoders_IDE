// planning.ts
// -----------
// Type definitions for planning flow components
// Defines question structure, validation, and flow configuration

import { FieldValidation } from '../utils/validation'

export interface PlanningQuestion {
  id: string
  text: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'email' | 'url'
  options?: string[]
  hint?: string
  examples?: string[]
  placeholder?: string
  required: boolean
  validation?: FieldValidation
  dependsOn?: string // Question ID that this question depends on
  showWhen?: (answers: Record<string, string>) => boolean
}

export interface PlanningFlowConfig {
  questions: PlanningQuestion[]
  title: string
  description: string
  estimatedTime?: string
}

export interface PlanningAnswer {
  questionId: string
  value: string
  answeredAt: string
}

export interface PlanningDraft {
  answers: Record<string, string>
  currentQuestionIndex: number
  lastSavedAt: string
  completionPercentage: number
}

export interface PlanningFlowState {
  currentQuestionIndex: number
  answers: Record<string, string>
  validationErrors: Record<string, string>
  isDirty: boolean
  isSubmitting: boolean
  lastSavedAt?: string
}

// Navigation direction for question flow
export type NavigationDirection = 'next' | 'previous' | 'jump'

// Question flow events
export interface QuestionFlowEvent {
  type: 'answer_changed' | 'navigation' | 'validation_error' | 'draft_saved' | 'submitted'
  questionId?: string
  value?: string
  direction?: NavigationDirection
  targetIndex?: number
  error?: string
}