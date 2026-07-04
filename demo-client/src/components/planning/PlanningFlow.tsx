// PlanningFlow.tsx
// ---------------
// Enhanced planning flow component with one-question-at-a-time interface
// Implements progress tracking, navigation controls, and auto-save functionality

import React, { useEffect } from 'react'
import { ChevronLeft, ChevronRight, Save, Send, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import Card from '../ui/Card'
import { usePlanningFlow } from '../../hooks/usePlanningFlow'
import { PlanningQuestion } from '../../types/planning'
import clsx from 'clsx'

interface PlanningFlowProps {
  projectId: string
  initialAnswers?: Record<string, string>
  onDraftSaved?: (answers: Record<string, string>) => void
  onSubmit?: (answers: Record<string, string>) => void
}

export function PlanningFlow({ 
  projectId, 
  initialAnswers, 
  onDraftSaved, 
  onSubmit 
}: PlanningFlowProps) {
  const {
    currentQuestion,
    currentQuestionIndex,
    answers,
    isFirstQuestion,
    isLastQuestion,
    completionPercentage,
    totalQuestions,
    currentError,
    hasCurrentAnswer,
    isDirty,
    isSubmitting,
    lastSavedAt,
    updateAnswer,
    goToNext,
    goToPrevious,
    saveDraft,
    submit,
    loadAnswers
  } = usePlanningFlow({
    onDraftSaved,
    onSubmit
  })
  
  // Load initial answers if provided
  useEffect(() => {
    if (initialAnswers) {
      loadAnswers(initialAnswers)
    }
  }, [initialAnswers, loadAnswers])
  
  const handleSubmit = async () => {
    const success = await submit()
    if (success) {
      // Handle successful submission
      console.log('Planning submitted successfully')
    }
  }
  
  const handleSaveDraft = async () => {
    await saveDraft()
  }
  
  if (!currentQuestion) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">No questions available</div>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Planning</h1>
            <p className="text-gray-600">Help us understand your project requirements</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </div>
            <div className="text-lg font-semibold text-primary-600">
              {completionPercentage}% Complete
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Auto-save Status */}
      {lastSavedAt && (
        <div className="mb-4 flex items-center text-sm text-gray-500">
          <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
          Draft saved at {new Date(lastSavedAt).toLocaleTimeString()}
        </div>
      )}
      
      {/* Question Card */}
      <Card className="mb-6">
        <div className="space-y-6">
          {/* Question Header */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {currentQuestion.text}
            </h2>
            
            {currentQuestion.hint && (
              <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                <HelpCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">{currentQuestion.hint}</p>
              </div>
            )}
          </div>
          
          {/* Question Input */}
          <div>
            <QuestionInput
              question={currentQuestion}
              value={answers[currentQuestion.id] || ''}
              onChange={updateAnswer}
              error={currentError}
            />
            
            {/* Validation Error */}
            {currentError && (
              <div className="mt-2 flex items-start space-x-2 text-red-600">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{currentError}</p>
              </div>
            )}
          </div>
          
          {/* Examples */}
          {currentQuestion.examples && currentQuestion.examples.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Examples:</h4>
              <ul className="space-y-1">
                {currentQuestion.examples.map((example, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    • {example}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
      
      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={goToPrevious}
            disabled={isFirstQuestion}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          
          <Button
            variant="ghost"
            onClick={handleSaveDraft}
            disabled={!isDirty || isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Draft
          </Button>
        </div>
        
        <div className="flex items-center space-x-3">
          {isLastQuestion ? (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!hasCurrentAnswer || isSubmitting}
              loading={isSubmitting}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Submit & Generate Blueprint
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={goToNext}
              disabled={!hasCurrentAnswer}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          )}
        </div>
      </div>
      
      {/* Question Overview */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Progress Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {Array.from({ length: totalQuestions }, (_, index) => {
            const isAnswered = Object.keys(answers).some(key => {
              const questionIndex = currentQuestionIndex // This should be calculated properly
              return questionIndex === index && answers[key]?.trim()
            })
            const isCurrent = index === currentQuestionIndex
            
            return (
              <div
                key={index}
                className={clsx(
                  'px-3 py-2 rounded-lg text-sm text-center transition-colors',
                  isCurrent && 'bg-primary-100 text-primary-700 border border-primary-200',
                  !isCurrent && isAnswered && 'bg-green-100 text-green-700',
                  !isCurrent && !isAnswered && 'bg-gray-100 text-gray-500'
                )}
              >
                Question {index + 1}
                {isAnswered && !isCurrent && (
                  <CheckCircle2 className="w-3 h-3 inline ml-1" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Question Input Component
interface QuestionInputProps {
  question: PlanningQuestion
  value: string
  onChange: (value: string) => void
  error?: string
}

function QuestionInput({ question, value, onChange, error }: QuestionInputProps) {
  const baseInputClasses = clsx(
    'w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors',
    error 
      ? 'border-red-300 bg-red-50' 
      : 'border-gray-300 bg-white hover:border-gray-400'
  )
  
  switch (question.type) {
    case 'textarea':
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          rows={4}
          className={baseInputClasses}
        />
      )
      
    case 'select':
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClasses}
        >
          <option value="">Select an option...</option>
          {question.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
      
    case 'multiselect':
      // For now, implement as textarea with instructions
      return (
        <div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Select multiple options (separate with commas)"
            rows={3}
            className={baseInputClasses}
          />
          {question.options && (
            <div className="mt-2 text-sm text-gray-600">
              Available options: {question.options.join(', ')}
            </div>
          )}
        </div>
      )
      
    default:
      return (
        <input
          type={question.type === 'email' ? 'email' : question.type === 'url' ? 'url' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          className={baseInputClasses}
        />
      )
  }
}