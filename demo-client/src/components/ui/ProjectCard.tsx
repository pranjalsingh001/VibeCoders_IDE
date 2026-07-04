// src/components/ui/ProjectCard.tsx
// ---------------------------------
// Small card used in the Dashboard to show basic project info and actions
// (Plan / Blueprint / Workspace / Delete)

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import Card from './Card'
import useProjectStore, { Project } from '../../stores/projectStore'

type Props = {
  project: Project
  nextRoute?: string
}

const ProjectCard = ({ project, nextRoute }: Props) => {
  const navigate = useNavigate()
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDelete = async () => {
    if (!confirm(`Delete project "${project.name}"? This action cannot be undone.`)) return
    setDeleting(true)
    setError(null)
    const ok = await deleteProject(project._id)
    if (!ok) setError('Could not delete project')
    setDeleting(false)
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start gap-3">
        <div>
          <h3 className="font-semibold">{project.name}</h3>
          {project.idea && <p className="text-sm text-gray-600 mt-1">{project.idea}</p>}
          <p className="text-xs text-gray-500 mt-2">Status: <span className="capitalize">{project.status || 'unknown'}</span></p>
          {project.createdAt && <p className="text-xs text-gray-400">Created: {new Date(project.createdAt).toLocaleString()}</p>}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-col gap-2">
            {nextRoute && <Button size="sm" onClick={() => navigate(nextRoute)}>Workflow</Button>}
            <Button size="sm" onClick={() => navigate(`/projects/${project._id}/planning`)}>Plan</Button>
            <Button size="sm" variant="secondary" onClick={() => navigate(`/projects/${project._id}/blueprint`)}>Blueprint</Button>
            <Button size="sm" variant="secondary" onClick={() => navigate(`/projects/${project._id}/workspace`)}>Workspace</Button>
          </div>

          <div>
            <Button size="sm" variant="danger" onClick={onDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</Button>
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </Card>
  )
}

export default ProjectCard
