// src/pages/BlueprintPage.tsx
// ---------------------------
// Project Blueprint page:
// - On mount: GET /blueprint/:projectId (show existing if any)
// - On demand: POST /blueprint/generate (regenerate)
// - Renders structured sections (architecture, techStack, features, folderStructure, diagrams)
// - Renders "raw" as fallback
// - Safe Mermaid rendering (no dangerouslySetInnerHTML from untrusted markdown)

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import mermaid from 'mermaid'
import Button from '../../components/ui/Button'
import { blueprintAPI } from '../../services/blueprintService'

// ⛑️ Shape that aligns with your parsed backend response
type BlueprintContent = {
  projectName?: string
  ideaDescription?: string
  clarifications?: Record<string, any> | string | null

  architecture?: string | null
  techStack?: unknown
  features?: string[]
  folderStructure?: string | string[] | null

  diagrams?: Record<string, string> // key -> mermaid code
  raw?: string | null               // fallback text (parsed raw or original content)

  versions?: string | number | null
  createdAt?: string | null
}

type FetchedBlueprint = {
  _id: string
  user?: string
  projectName: string
  ideaDescription: string
  clarifications: any
  generatedBlueprint: Partial<BlueprintContent> & {
    promptUsed?: string
    content?: string // in case some models still send content
  }
  version: number
  createdAt: string
  updatedAt: string
  __v?: number
}

const BlueprintPage = () => {
  const { id: projectId } = useParams<{ id: string }>()
  const [blueprint, setBlueprint] = useState<BlueprintContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🧹 Helper: normalize server response into our BlueprintContent
  const normalize = (bp: FetchedBlueprint | null | undefined): BlueprintContent | null => {
    if (!bp) return null
    const gb = bp.generatedBlueprint || {}

    return {
      projectName: gb.projectName ?? bp.projectName ?? undefined,
      ideaDescription: gb.ideaDescription ?? bp.ideaDescription ?? undefined,
      clarifications: gb.clarifications ?? bp.clarifications ?? null,

      architecture: gb.architecture ?? null,
      techStack: gb.techStack ?? null,
      features: Array.isArray(gb.features) ? gb.features : [],

      folderStructure: gb.folderStructure ?? null,
      diagrams: gb.diagrams ?? {},

      // prefer parsed "raw"; fallback to legacy "content"
      raw: (gb as any).raw ?? (gb as any).content ?? null,

      versions: gb.versions ?? bp.version ?? null,
      createdAt: (gb as any).createdAt ?? bp.createdAt ?? null,
    }
  }

  // 🧲 Load existing on mount
  useEffect(() => {
    if (!projectId) {
      setError('Missing project id.')
      return
    }
    let cancelled = false

    const fetchExisting = async () => {
      setLoading(true)
      setError(null)
      try {
        // expects backend: GET /api/v1/blueprint/:projectId
        const res = await blueprintAPI.fetch(projectId)
        const bp: FetchedBlueprint | null =
          res?.blueprint ?? null

        if (!cancelled) {
          const normalized = normalize(bp)
          setBlueprint(normalized)
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load blueprint.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchExisting()
    return () => {
      cancelled = true
    }
  }, [projectId])

  // ⚙️ Generate / Regenerate
  const handleGenerate = async () => {
    if (!projectId) {
      setError('Missing project id.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      // expects backend: POST /api/v1/blueprint/generate { projectId }
      const res = await blueprintAPI.generate({ projectId })
      const bp: FetchedBlueprint | null =
        res?.blueprint ?? null

      const normalized = normalize(bp)
      setBlueprint(normalized)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to generate blueprint.')
    } finally {
      setLoading(false)
    }
  }

  // 🖼️ Mermaid rendering (safe)
  const diagramEntries = useMemo(() => {
    if (!blueprint?.diagrams) return []
    return Object.entries(blueprint.diagrams)
  }, [blueprint?.diagrams])

  useEffect(() => {
    if (!diagramEntries.length) return
    // initialize mermaid once per render cycle
    mermaid.initialize({ startOnLoad: false })
    diagramEntries.forEach(async ([key, code], idx) => {
      const containerId = `mermaid-${key}-${idx}`
      const el = document.getElementById(containerId)
      if (!el) return
      try {
        const { svg } = await mermaid.render(containerId + '-svg', code)
        el.innerHTML = svg
      } catch (e: any) {
        el.innerHTML = `<pre class="text-red-600">Mermaid render error: ${e?.message ?? 'Unknown error'}</pre>`
      }
    })
  }, [diagramEntries])

  const hasStoredBlueprint = Boolean(blueprint)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Blueprint</h1>
          <p className="text-sm text-gray-600">
            Generate and review the project blueprint (architecture, tech stack, features, and diagrams).
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Button onClick={handleGenerate} disabled={loading}>
            {hasStoredBlueprint ? (loading ? 'Regenerating…' : 'Regenerate Blueprint') : (loading ? 'Generating…' : 'Generate Blueprint')}
          </Button>
          {blueprint?.createdAt && (
            <p className="text-xs text-gray-500">
              Last generated: {new Date(blueprint.createdAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {!hasStoredBlueprint && !loading && (
        <p className="text-gray-600 mb-4">No blueprint found yet. Click &ldquo;Generate Blueprint&rdquo;.</p>
      )}

      {/* Content */}
      {hasStoredBlueprint && blueprint && (
        <div className="space-y-6">
          {/* Summary */}
          {(blueprint.projectName || blueprint.ideaDescription) && (
            <div className="bg-white border rounded-lg p-4">
              <h2 className="font-semibold mb-2">Summary</h2>
              {blueprint.projectName && (
                <p><span className="font-medium">Project:</span> {blueprint.projectName}</p>
              )}
              {blueprint.ideaDescription && (
                <p><span className="font-medium">Idea:</span> {blueprint.ideaDescription}</p>
              )}
              {blueprint.versions && (
                <p className="text-xs text-gray-500 mt-2">Version: {String(blueprint.versions)}</p>
              )}
            </div>
          )}

          {/* Architecture */}
          {blueprint.architecture && (
            <div className="bg-white border rounded-lg p-4">
              <h2 className="font-semibold mb-2">Architecture</h2>
              <pre className="whitespace-pre-wrap text-sm text-gray-800">
                {blueprint.architecture}
              </pre>
            </div>
          )}

          {/* Tech Stack */}
          {typeof blueprint.techStack !== 'undefined' && blueprint.techStack !== null && (
            <div className="bg-white border rounded-lg p-4">
              <h2 className="font-semibold mb-2">Tech Stack</h2>
              <pre className="whitespace-pre-wrap text-sm">
                {JSON.stringify(blueprint.techStack, null, 2)}
              </pre>
            </div>
          )}

          {/* Features */}
          {blueprint.features && blueprint.features.length > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <h2 className="font-semibold mb-2">Features</h2>
              <ul className="list-disc pl-5">
                {blueprint.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {/* Folder Structure */}
          {blueprint.folderStructure && (
            <div className="bg-white border rounded-lg p-4">
              <h2 className="font-semibold mb-2">Project Folder Structure</h2>
              <pre className="whitespace-pre-wrap text-sm">
                {Array.isArray(blueprint.folderStructure)
                  ? blueprint.folderStructure.join('\n')
                  : blueprint.folderStructure}
              </pre>
            </div>
          )}

          {/* Raw (fallback) */}
          {blueprint.raw && (
            <div className="bg-white border rounded-lg p-4">
              <h2 className="font-semibold mb-2">Raw Blueprint</h2>
              <pre className="whitespace-pre-wrap text-sm">{blueprint.raw}</pre>
            </div>
          )}

          {/* Mermaid diagrams */}
          {diagramEntries.length > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <h2 className="font-semibold mb-4">Diagrams</h2>
              <div className="space-y-6">
                {diagramEntries.map(([key, _code], idx) => (
                  <div key={key + idx}>
                    <p className="text-sm font-medium mb-1">{key}</p>
                    <div id={`mermaid-${key}-${idx}`} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BlueprintPage
