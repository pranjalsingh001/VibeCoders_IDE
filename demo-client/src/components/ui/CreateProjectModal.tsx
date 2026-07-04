// src/components/ui/CreateProjectModal.tsx
// ----------------------------------------
// Enhanced modal UI to create a new project with improved UX.
// Features better validation, examples, and clearer guidance.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal'
import Button from './Button'
import useProjectStore from '../../stores/projectStore'

type Props = {
  isOpen: boolean
  onClose: () => void
}

const CreateProjectModal = ({ isOpen, onClose }: Props) => {
  const navigate = useNavigate()
  const createProject = useProjectStore((s) => s.createProject)

  const [name, setName] = useState('')
  const [idea, setIdea] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName('')
      setIdea('')
      setDescription('')
      setError(null)
      setNameError(null)
    }
  }, [isOpen])

  const validateName = (value: string) => {
    if (!value.trim()) {
      setNameError('Project name is required')
      return false
    }
    if (value.trim().length < 3) {
      setNameError('Project name must be at least 3 characters')
      return false
    }
    if (value.trim().length > 50) {
      setNameError('Project name must be less than 50 characters')
      return false
    }
    setNameError(null)
    return true
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    if (value.trim()) {
      validateName(value)
    } else {
      setNameError(null)
    }
  }

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!validateName(name)) {
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const project = await createProject({ 
        name: name.trim(), 
        idea: idea.trim() || undefined,
        description: description.trim() || undefined
      })
      
      // Reset form
      setName('')
      setIdea('')
      setDescription('')
      onClose()
      // Navigate to workflow page for the new project
      navigate(`/projects/${project._id}/workflow`)
    } catch (err) {
      setError('Failed to create project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Start a new project and guide it through the complete development workflow: 
          Planning → Blueprint → Design → Code Generation → Workspace.
        </p>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input 
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              nameError ? 'border-red-300' : 'border-gray-300'
            }`}
            value={name} 
            onChange={handleNameChange}
            placeholder="e.g., Task Manager App, E-commerce Website"
            maxLength={50}
            required 
          />
          {nameError && <p className="text-red-600 text-xs mt-1">{nameError}</p>}
          <p className="text-xs text-gray-500 mt-1">
            Choose a clear, descriptive name for your project
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Project Idea
          </label>
          <textarea 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={idea} 
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g., A web app to help teams manage tasks with real-time collaboration"
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">
            Brief description of what you want to build (optional)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Additional Details
          </label>
          <textarea 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Any specific requirements, target audience, or technical preferences..."
            rows={2}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            Additional context to help with planning (optional)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose} 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !!nameError}
            className="min-w-[120px]"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateProjectModal
