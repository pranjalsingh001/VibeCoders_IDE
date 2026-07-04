// src/components/ui/QuestionList.tsx
// ---------------------------------
// Simple UI component to render a list of AI-generated questions
// and collect answers. This is used in PlanningPage.

import { useState } from 'react'
import Button from './Button'

type Props = {
  questions: string[]
  initialAnswers?: string[]
  onSubmit: (answers: string[]) => Promise<void> | void
  submitting?: boolean
}

const QuestionList = ({ questions, initialAnswers = [], onSubmit, submitting = false }: Props) => {
  const [answers, setAnswers] = useState<string[]>(questions.map((_, i) => initialAnswers[i] || ''))

  const setAnswer = (index: number, value: string) => {
    const copy = [...answers]
    copy[index] = value
    setAnswers(copy)
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        await onSubmit(answers)
      }}
      className="space-y-4"
    >
      {questions.map((q, i) => (
        <div key={i}>
          <label className="block text-sm font-medium mb-1">{`Q${i + 1}: ${q}`}</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            value={answers[i]}
            onChange={(e) => setAnswer(i, e.target.value)}
            rows={3}
            placeholder="Your answer..."
          />
        </div>
      ))}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Answers'}</Button>
      </div>
    </form>
  )
}

export default QuestionList
