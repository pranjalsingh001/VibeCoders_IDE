// usePlanningFlow.ts
// -----------------
// Custom hook for managing planning flow state and logic
// Handles navigation, validation, auto-save, and form state

import { useState, useEffect, useCallback, useRef } from 'react'
import { PlanningFlowState, NavigationDirection } from '../types/planning'
import { validateField, ValidationResult } from '../utils/validation'
import { planningFlowConfig, getNextQuestionIndex, getPreviousQuestionIndex, calculateCompletionPercentage } from '../config/planningQuestions'
import useWorkflowStore from '../stores/workflowStore'

interface UsePlanningFlowOptions {
  autoSaveDelay?: number
  onDraftSaved?: (answers: Record<string, string>) => void
  onSubmit?: (answers: Record<string, string>) => void
}

export function usePlanningFlow(options: UsePlanningFlowOptions = {}) {
  const { autoSaveDelay = 2000, onDraftSaved, onSubmit } = options
  const { savePlanningDraft, submitPlanning, loading } = useWorkflowStore()
  
  // Auto-save timer ref
  const autoSaveTimer = useRef<number>()
  
  // Initialize state
  const [state, setState] = useState<PlanningFlowState>({
    currentQuestionIndex: 0,
    answers: {},
    validationErrors: {},
    isDirty: false,
    isSubmitting: false
  })
  
  const questions = planningFlowConfig.questions
  const currentQuestion = questions[state.currentQuestionIndex]
  const isLastQuestion = state.currentQuestionIndex === questions.length - 1
  const isFirstQuestion = state.currentQuestionIndex === 0
  const completionPercentage = calculateCompletionPercentage(state.answers)
  
  // Clear auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
    }
  }, [])
  
  // Auto-save functionality
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
    }
    
    autoSaveTimer.current = setTimeout(() => {
      if (state.isDirty && Object.keys(state.answers).length > 0) {
        savePlanningDraft(state.answers)
        onDraftSaved?.(state.answers)
        setState(prev => ({ 
          ...prev, 
          isDirty: false, 
          lastSavedAt: new Date().toISOString() 
        }))
      }
    }, autoSaveDelay)
  }, [state.isDirty, state.answers, autoSaveDelay, savePlanningDraft, onDraftSaved])
  
  // Trigger auto-save when answers change
  useEffect(() => {
    if (state.isDirty) {
      scheduleAutoSave()
    }
  }, [state.isDirty, scheduleAutoSave])
  
  // Update answer for current question
  const updateAnswer = useCallback((value: string) => {
    const questionId = currentQuestion.id
    
    setState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: value
      },
      isDirty: true,
      validationErrors: {
        ...prev.validationErrors,
        [questionId]: '' // Clear validation error when user types
      }
    }))
  }, [currentQuestion.id])
  
  // Validate current question
  const validateCurrentQuestion = useCallback((): ValidationResult => {
    if (!currentQuestion) return { isValid: true }
    
    const value = state.answers[currentQuestion.id] || ''
    const validation = currentQuestion.validation
    
    if (!validation) return { isValid: true }
    
    return validateField(value, validation)
  }, [currentQuestion, state.answers])
  
  // Navigate to specific question index
  const navigateToQuestion = useCallback((index: number, direction: NavigationDirection = 'jump') => {
    if (index < 0 || index >= questions.length) return false
    
    // Validate current question before navigation (except when going back)
    if (direction === 'next' || direction === 'jump') {
      const validation = validateCurrentQuestion()
      if (!validation.isValid) {
        setState(prev => ({
          ...prev,
          validationErrors: {
            ...prev.validationErrors,
            [currentQuestion.id]: validation.error || 'Invalid answer'
          }
        }))
        return false
      }
    }
    
    setState(prev => ({
      ...prev,
      currentQuestionIndex: index,
      validationErrors: {} // Clear validation errors when navigating
    }))
    
    return true
  }, [questions.length, validateCurrentQuestion, currentQuestion])
  
  // Navigate to next question
  const goToNext = useCallback(() => {
    const nextIndex = getNextQuestionIndex(state.currentQuestionIndex, state.answers)
    if (nextIndex < questions.length) {
      return navigateToQuestion(nextIndex, 'next')
    }
    return false
  }, [state.currentQuestionIndex, state.answers, questions.length, navigateToQuestion])
  
  // Navigate to previous question
  const goToPrevious = useCallback(() => {
    const prevIndex = getPreviousQuestionIndex(state.currentQuestionIndex, state.answers)
    if (prevIndex >= 0) {
      return navigateToQuestion(prevIndex, 'previous')
    }
    return false
  }, [state.currentQuestionIndex, state.answers, navigateToQuestion])
  
  // Save draft manually
  const saveDraft = useCallback(async () => {
    if (Object.keys(state.answers).length === 0) return
    
    try {
      await savePlanningDraft(state.answers)
      onDraftSaved?.(state.answers)
      setState(prev => ({ 
        ...prev, 
        isDirty: false, 
        lastSavedAt: new Date().toISOString() 
      }))
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }, [state.answers, savePlanningDraft, onDraftSaved])
  
  // Submit planning answers
  const submit = useCallback(async () => {
    // Validate all required questions are answered
    const requiredQuestions = questions.filter(q => q.required)
    const missingAnswers = requiredQuestions.filter(q => {
      const answer = state.answers[q.id]
      return !answer || answer.trim().length === 0
    })
    
    if (missingAnswers.length > 0) {
      // Navigate to first missing question
      const firstMissingIndex = questions.findIndex(q => q.id === missingAnswers[0].id)
      navigateToQuestion(firstMissingIndex)
      return false
    }
    
    // Validate current question
    const validation = validateCurrentQuestion()
    if (!validation.isValid) {
      setState(prev => ({
        ...prev,
        validationErrors: {
          ...prev.validationErrors,
          [currentQuestion.id]: validation.error || 'Invalid answer'
        }
      }))
      return false
    }
    
    setState(prev => ({ ...prev, isSubmitting: true }))
    
    try {
      await submitPlanning(state.answers)
      onSubmit?.(state.answers)
      return true
    } catch (error) {
      console.error('Failed to submit planning:', error)
      return false
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }))
    }
  }, [questions, state.answers, validateCurrentQuestion, currentQuestion, navigateToQuestion, submitPlanning, onSubmit])
  
  // Load existing answers (for editing)
  const loadAnswers = useCallback((answers: Record<string, string>) => {
    setState(prev => ({
      ...prev,
      answers,
      isDirty: false
    }))
  }, [])
  
  // Reset form
  const reset = useCallback(() => {
    setState({
      currentQuestionIndex: 0,
      answers: {},
      validationErrors: {},
      isDirty: false,
      isSubmitting: false
    })
  }, [])
  
  // Get current question's validation error
  const getCurrentError = useCallback(() => {
    return state.validationErrors[currentQuestion?.id] || ''
  }, [state.validationErrors, currentQuestion])
  
  // Check if current question has an answer
  const hasCurrentAnswer = useCallback(() => {
    const answer = state.answers[currentQuestion?.id]
    return answer && answer.trim().length > 0
  }, [state.answers, currentQuestion])
  
  return {
    // State
    currentQuestion,
    currentQuestionIndex: state.currentQuestionIndex,
    answers: state.answers,
    validationErrors: state.validationErrors,
    isDirty: state.isDirty,
    isSubmitting: state.isSubmitting || loading,
    lastSavedAt: state.lastSavedAt,
    
    // Computed values
    isFirstQuestion,
    isLastQuestion,
    completionPercentage,
    totalQuestions: questions.length,
    currentError: getCurrentError(),
    hasCurrentAnswer: hasCurrentAnswer(),
    
    // Actions
    updateAnswer,
    goToNext,
    goToPrevious,
    navigateToQuestion,
    saveDraft,
    submit,
    loadAnswers,
    reset,
    validateCurrentQuestion
  }
}