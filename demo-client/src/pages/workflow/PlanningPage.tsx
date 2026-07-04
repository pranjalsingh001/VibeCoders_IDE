// src/pages/PlanningPage.tsx
// --------------------------
// Fixed version: ensures questions is always an array, even if backend returns a single string.

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { planningAPI } from '../../services/planningService'
import QuestionList from '../../components/ui/QuestionList'
import Button from '../../components/ui/Button'

const PlanningPage = () => {
  const { id: projectId } = useParams<{ id: string }>()
  const [questions, setQuestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Utility: Convert backend response to array of questions
  const normalizeQuestions = (data: any): string[] => {
    if (Array.isArray(data)) {
      return data
    }
    if (typeof data === 'string') {
      // Split by line breaks or numbered patterns (1., 2., etc.)
      return data
        .split(/\n+/)
        .map(line => line.trim())
        .filter(line => line.length > 0 && !/^Here are/i.test(line))
    }
    return []
  }

  useEffect(() => {
    if (!projectId) {
      setError('Missing project id in URL.')
      return
    }
    setLoading(true)
    planningAPI.clarify({ projectId })
      .then((res) => {
        const parsed = normalizeQuestions(res.questions)
        setQuestions(parsed)
        setLoading(false)
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message || 'Failed to fetch clarification questions.')
        setLoading(false)
      })
  }, [projectId])

  const handleSubmit = async (answers: string[]) => {
    if (!projectId) return
    setSubmitting(true)
    setError(null)
    setSuccessMsg(null)
    try {
      await planningAPI.submitAnswers({ projectId, answers })
      setSuccessMsg('Answers submitted successfully! Redirecting to blueprint...')
      // Automatically navigate to Blueprint page
      setTimeout(() => {
        window.location.href = `/projects/${projectId}/blueprint`
      }, 1500)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit answers.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Project Planning</h1>
        <p className="text-sm text-gray-600">Answer these AI clarification questions to help the system generate an accurate blueprint.</p>
      </div>

      {loading && <p>Loading questions…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {successMsg && <p className="text-green-600">{successMsg}</p>}

      {!loading && !error && questions.length === 0 && (
        <div className="bg-white border rounded-lg p-6">
          <p className="text-gray-600">No clarification questions available. You can start generating the blueprint.</p>
          <div className="mt-4">
            <Button onClick={() => window.location.assign(`/projects/${projectId}/blueprint`)}>Go to Blueprint</Button>
          </div>
        </div>
      )}

      {!loading && questions.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <QuestionList
            questions={questions}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        </div>
      )}
    </div>
  )
}

export default PlanningPage
