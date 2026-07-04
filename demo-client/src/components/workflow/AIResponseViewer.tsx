// AIResponseViewer.tsx
// --------------------
// Component for displaying and interacting with AI-generated responses
// Handles Blueprint, HLD, and LLD display with JSON parsing and user actions

import React, { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import {
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Edit3,
  AlertTriangle,
  Code,
  Database,
  Layers,
  GitBranch,
  FileText,
  Settings,
  Copy,
  History,
  RefreshCw
} from 'lucide-react'
import mermaid from 'mermaid'

import { Button } from '../ui/Button'
import Badge, { TechBadge } from '../ui/Badge'
import Card from '../ui/Card'
import Modal from '../ui/Modal'
import BlueprintDisplay from './BlueprintDisplay'
import HLDDisplay from './HLDDisplay'
import LLDDisplay from './LLDDisplay'
import {
  AIResponse,
  Blueprint,
  HLD,
  LLD,
  ParsedResponse,
  MermaidDiagram,
  ResponseAction
} from '../../types/aiResponse'

interface AIResponseViewerProps {
  response: AIResponse
  type: 'blueprint' | 'hld' | 'lld'
  onApprove: () => void
  onReject: (feedback: string) => void
  onModify: (changes: any) => void
  onRegenerate?: () => void
  loading?: boolean
  className?: string
  showVersionHistory?: boolean
  versions?: AIResponse[]
}

const AIResponseViewer: React.FC<AIResponseViewerProps> = ({
  response,
  type,
  onApprove,
  onReject,
  onModify,
  onRegenerate,
  loading = false,
  className,
  showVersionHistory = false,
  versions = []
}) => {
  const [showRawJson, setShowRawJson] = useState(false)
  const [parsedContent, setParsedContent] = useState<ParsedResponse | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showModifyModal, setShowModifyModal] = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [rejectFeedback, setRejectFeedback] = useState('')
  const [modifyChanges, setModifyChanges] = useState('')
  const [selectedVersion, setSelectedVersion] = useState<AIResponse | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const mermaidRef = useRef<HTMLDivElement>(null)

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif'
    })
  }, [])

  // Parse response content on mount and when response changes
  useEffect(() => {
    const parseResponse = (): ParsedResponse => {
      setParseError(null)

      try {
        let content: any

        // Handle different content formats
        if (typeof response.content === 'string') {
          // Try to parse as JSON
          try {
            content = JSON.parse(response.content)
          } catch (jsonError) {
            // If JSON parsing fails, try to extract JSON from markdown code blocks
            const jsonMatch = response.content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
            if (jsonMatch) {
              content = JSON.parse(jsonMatch[1])
            } else {
              throw new Error('Unable to extract valid JSON from response')
            }
          }
        } else if (response.content && typeof response.content === 'object') {
          content = response.content
        } else {
          throw new Error('Invalid response content format')
        }

        // Validate content structure based on type
        const validationResult = validateResponseContent(content, type)
        if (!validationResult.isValid) {
          setParseError(`Content validation failed: ${validationResult.errors.join(', ')}`)
        }

        return {
          success: true,
          data: content
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error'
        console.error('Failed to parse AI response:', error)
        setParseError(errorMessage)

        return {
          success: false,
          error: errorMessage,
          fallbackContent: response.rawJson || JSON.stringify(response.content, null, 2)
        }
      }
    }

    setParsedContent(parseResponse())
  }, [response, type])

  // Validate response content structure
  const validateResponseContent = (content: any, responseType: string) => {
    const errors: string[] = []

    if (!content || typeof content !== 'object') {
      errors.push('Content must be an object')
      return { isValid: false, errors }
    }

    switch (responseType) {
      case 'blueprint':
        if (!content.techStack && !content.features) {
          errors.push('Blueprint should contain techStack or features')
        }
        break
      case 'hld':
        if (!content.systemDesign && !content.components) {
          errors.push('HLD should contain systemDesign or components')
        }
        break
      case 'lld':
        if (!content.detailedDesign && !content.implementation) {
          errors.push('LLD should contain detailedDesign or implementation')
        }
        break
    }

    return { isValid: errors.length === 0, errors }
  }

  // Render Mermaid diagrams
  useEffect(() => {
    if (parsedContent?.success && mermaidRef.current) {
      const diagrams = extractMermaidDiagrams(parsedContent.data)
      if (diagrams.length > 0) {
        renderMermaidDiagrams(diagrams)
      }
    }
  }, [parsedContent])

  const extractMermaidDiagrams = (content: any): MermaidDiagram[] => {
    const diagrams: MermaidDiagram[] = []

    try {
      // Look for architecture diagrams in different response types
      if (type === 'blueprint' && content.architecture) {
        if (content.architecture.diagram) {
          diagrams.push({
            type: 'flowchart',
            content: content.architecture.diagram,
            title: 'System Architecture',
            description: 'High-level system architecture overview'
          })
        }
        if (content.architecture.mermaid) {
          diagrams.push({
            type: 'flowchart',
            content: content.architecture.mermaid,
            title: 'Architecture Diagram',
            description: 'System architecture visualization'
          })
        }
      }

      if (type === 'hld' && content.systemDesign) {
        if (content.systemDesign.diagram) {
          diagrams.push({
            type: 'flowchart',
            content: content.systemDesign.diagram,
            title: 'System Design',
            description: 'Detailed system design and component relationships'
          })
        }
        if (content.systemDesign.mermaid) {
          diagrams.push({
            type: 'flowchart',
            content: content.systemDesign.mermaid,
            title: 'System Design Diagram',
            description: 'System design visualization'
          })
        }
        if (content.dataFlow?.diagram) {
          diagrams.push({
            type: 'sequence',
            content: content.dataFlow.diagram,
            title: 'Data Flow',
            description: 'Data flow between system components'
          })
        }
        if (content.dataFlow?.mermaid) {
          diagrams.push({
            type: 'sequence',
            content: content.dataFlow.mermaid,
            title: 'Data Flow Diagram',
            description: 'Data flow visualization'
          })
        }
      }

      if (type === 'lld' && content.detailedDesign) {
        if (content.detailedDesign.classDiagram) {
          diagrams.push({
            type: 'class',
            content: content.detailedDesign.classDiagram,
            title: 'Class Diagram',
            description: 'Detailed class structure and relationships'
          })
        }
        if (content.detailedDesign.mermaid) {
          diagrams.push({
            type: 'class',
            content: content.detailedDesign.mermaid,
            title: 'Detailed Design Diagram',
            description: 'Low-level design visualization'
          })
        }
      }

      // Look for any generic mermaid diagrams in the content
      const findMermaidInObject = (obj: any, path: string = ''): void => {
        if (typeof obj === 'object' && obj !== null) {
          Object.keys(obj).forEach(key => {
            if (key.toLowerCase().includes('mermaid') && typeof obj[key] === 'string') {
              diagrams.push({
                type: 'flowchart',
                content: obj[key],
                title: `${path}${key}`.replace(/([A-Z])/g, ' $1').trim(),
                description: `Diagram from ${path}${key}`
              })
            } else if (typeof obj[key] === 'object') {
              findMermaidInObject(obj[key], `${path}${key}.`)
            }
          })
        }
      }

      findMermaidInObject(content)
    } catch (error) {
      console.error('Error extracting Mermaid diagrams:', error)
    }

    return diagrams
  }

  const renderMermaidDiagrams = async (diagrams: MermaidDiagram[]) => {
    if (!mermaidRef.current || diagrams.length === 0) return

    try {
      // Clear previous diagrams
      mermaidRef.current.innerHTML = ''

      for (const [index, diagram] of diagrams.entries()) {
        const diagramId = `mermaid-${type}-${response.id}-${index}`
        const containerElement = document.createElement('div')
        containerElement.className = 'mermaid-container mb-6 p-4 border border-gray-200 rounded-lg'

        if (diagram.title) {
          const titleElement = document.createElement('h4')
          titleElement.className = 'text-lg font-semibold mb-2 text-gray-900'
          titleElement.textContent = diagram.title
          containerElement.appendChild(titleElement)
        }

        if (diagram.description) {
          const descElement = document.createElement('p')
          descElement.className = 'text-sm text-gray-600 mb-3'
          descElement.textContent = diagram.description
          containerElement.appendChild(descElement)
        }

        const diagramElement = document.createElement('div')
        diagramElement.id = diagramId
        diagramElement.className = 'mermaid-diagram'
        containerElement.appendChild(diagramElement)

        mermaidRef.current.appendChild(containerElement)

        try {
          // Validate Mermaid syntax before rendering
          if (!diagram.content || typeof diagram.content !== 'string') {
            throw new Error('Invalid diagram content')
          }

          // Clean up the diagram content
          const cleanContent = diagram.content.trim()
          if (!cleanContent) {
            throw new Error('Empty diagram content')
          }

          // Render the diagram with error handling
          const { svg } = await mermaid.render(diagramId, cleanContent)
          diagramElement.innerHTML = svg

          // Add click handler for diagram interaction
          diagramElement.addEventListener('click', () => {
            // Could implement diagram zoom/fullscreen here
          })

        } catch (diagramError) {
          console.error(`Failed to render diagram ${index}:`, diagramError)
          diagramElement.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex items-start space-x-3">
                <AlertTriangle class="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p class="text-red-800 font-medium">Failed to render diagram</p>
                  <p class="text-red-600 text-sm mt-1">${diagramError instanceof Error ? diagramError.message : 'Unknown error'}</p>
                  <details class="mt-2">
                    <summary class="text-red-600 text-sm cursor-pointer">Show diagram source</summary>
                    <pre class="text-xs bg-red-100 p-2 rounded mt-2 overflow-x-auto"><code>${diagram.content}</code></pre>
                  </details>
                </div>
              </div>
            </div>
          `
        }
      }
    } catch (error) {
      console.error('Failed to render Mermaid diagrams:', error)
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = `
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-center">
              <AlertTriangle class="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <p class="text-yellow-800 font-medium">Failed to render diagrams</p>
                <p class="text-yellow-600 text-sm mt-1">${error instanceof Error ? error.message : 'Unknown error'}</p>
              </div>
            </div>
          </div>
        `
      }
    }
  }

  const handleReject = () => {
    if (rejectFeedback.trim()) {
      onReject(rejectFeedback)
      setShowRejectModal(false)
      setRejectFeedback('')
    }
  }

  const handleModify = () => {
    if (modifyChanges.trim()) {
      try {
        const changes = JSON.parse(modifyChanges)
        onModify(changes)
        setShowModifyModal(false)
        setModifyChanges('')
      } catch (error) {
        // Handle invalid JSON
        alert('Please provide valid JSON for modifications')
      }
    }
  }

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could show a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  const handleVersionSelect = (version: AIResponse) => {
    setSelectedVersion(version)
  }

  const renderVersionComparison = () => {
    if (!selectedVersion || !showVersionModal) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 className="text-sm font-medium text-gray-900 mb-2">
            Current Version ({response.version})
          </h5>
          <pre className="text-xs bg-gray-50 rounded p-3 overflow-auto max-h-64">
            <code>{JSON.stringify(response.content, null, 2)}</code>
          </pre>
        </div>
        <div>
          <h5 className="text-sm font-medium text-gray-900 mb-2">
            Version {selectedVersion.version}
          </h5>
          <pre className="text-xs bg-gray-50 rounded p-3 overflow-auto max-h-64">
            <code>{JSON.stringify(selectedVersion.content, null, 2)}</code>
          </pre>
        </div>
      </div>
    )
  }

  const getResponseTypeIcon = () => {
    switch (type) {
      case 'blueprint':
        return <FileText className="w-5 h-5" />
      case 'hld':
        return <Layers className="w-5 h-5" />
      case 'lld':
        return <Code className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const getResponseTypeTitle = () => {
    switch (type) {
      case 'blueprint':
        return 'Project Blueprint'
      case 'hld':
        return 'High-Level Design'
      case 'lld':
        return 'Low-Level Design'
      default:
        return 'AI Response'
    }
  }

  if (!parsedContent) {
    return (
      <Card className={clsx('animate-pulse', className)}>
        <div className="h-64 bg-gray-200 rounded"></div>
      </Card>
    )
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              {getResponseTypeIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {getResponseTypeTitle()}
              </h3>
              <p className="text-sm text-gray-500">
                Version {response.version} • {new Date(response.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge
              variant={response.status === 'approved' ? 'success' :
                response.status === 'rejected' ? 'error' : 'warning'}
            >
              {response.status}
            </Badge>

            {parseError && (
              <Badge variant="error" size="sm">
                Parse Error
              </Badge>
            )}

            {showVersionHistory && versions.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVersionModal(true)}
                leftIcon={<History />}
              >
                History ({versions.length})
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRawJson(!showRawJson)}
              leftIcon={showRawJson ? <EyeOff /> : <Eye />}
            >
              {showRawJson ? 'Hide' : 'View'} Raw JSON
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        {response.status === 'pending' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="primary"
                onClick={onApprove}
                loading={loading}
                leftIcon={<CheckCircle />}
                disabled={!parsedContent?.success}
              >
                Approve
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowRejectModal(true)}
                leftIcon={<XCircle />}
              >
                Reject
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowModifyModal(true)}
                leftIcon={<Edit3 />}
              >
                Request Changes
              </Button>
            </div>

            {onRegenerate && (
              <Button
                variant="ghost"
                onClick={onRegenerate}
                leftIcon={<RefreshCw />}
                size="sm"
              >
                Regenerate
              </Button>
            )}
          </div>
        )}

        {/* Parse Error Warning */}
        {parseError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Content Parsing Error</p>
                <p className="text-red-600 text-sm mt-1">{parseError}</p>
                <p className="text-red-600 text-sm mt-2">
                  The response content could not be parsed properly. You can view the raw JSON below or request a regeneration.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Raw JSON View */}
      {showRawJson && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-gray-900">Raw JSON Response</h4>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" size="sm">
                {response.rawJson ? response.rawJson.length : JSON.stringify(response.content, null, 2).length} chars
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyToClipboard(response.rawJson || JSON.stringify(response.content, null, 2))}
                leftIcon={<Copy />}
              >
                Copy
              </Button>
            </div>
          </div>
          <div className="relative">
            <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto max-h-96 overflow-y-auto">
              <code>{response.rawJson || JSON.stringify(response.content, null, 2)}</code>
            </pre>
            {(response.rawJson || JSON.stringify(response.content, null, 2)).length > 5000 && (
              <div className="absolute bottom-2 right-2">
                <Badge variant="warning" size="sm">Large content</Badge>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Parsed Content Display */}
      {parsedContent.success ? (
        <div className="space-y-6">
          {type === 'blueprint' && <BlueprintDisplay content={parsedContent.data} />}
          {type === 'hld' && <HLDDisplay content={parsedContent.data} />}
          {type === 'lld' && <LLDDisplay content={parsedContent.data} />}

          {/* Mermaid Diagrams */}
          {parsedContent.success && extractMermaidDiagrams(parsedContent.data).length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Architecture Diagrams</h4>
                <Badge variant="secondary" size="sm">
                  {extractMermaidDiagrams(parsedContent.data).length} diagram{extractMermaidDiagrams(parsedContent.data).length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div ref={mermaidRef} className="mermaid-container"></div>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h4 className="text-md font-medium text-gray-900">Parsing Error</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">{parsedContent.error}</p>
          {parsedContent.fallbackContent && (
            <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
              <code>{parsedContent.fallbackContent}</code>
            </pre>
          )}
        </Card>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Response"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Please provide specific feedback about what needs to be improved:
            </p>

            {/* Common rejection reasons */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Common Issues (click to add):</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Missing required technologies',
                  'Incomplete feature list',
                  'Architecture not suitable',
                  'Missing security considerations',
                  'Scalability concerns',
                  'Integration issues',
                  'Performance concerns',
                  'Documentation insufficient'
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      const newFeedback = rejectFeedback
                        ? `${rejectFeedback}\n- ${reason}`
                        : `- ${reason}`
                      setRejectFeedback(newFeedback)
                    }}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <textarea
            value={rejectFeedback}
            onChange={(e) => setRejectFeedback(e.target.value)}
            placeholder="Describe what needs to be changed or improved...&#10;&#10;Examples:&#10;- The tech stack is missing database technology&#10;- Authentication feature is not detailed enough&#10;- Architecture diagram is unclear"
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-700">
                <p className="font-medium">Rejection will trigger regeneration</p>
                <p>The AI will use your feedback to generate an improved version.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowRejectModal(false)
                setRejectFeedback('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectFeedback.trim()}
            >
              Reject & Request Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modify Modal */}
      <Modal
        isOpen={showModifyModal}
        onClose={() => setShowModifyModal(false)}
        title="Request Modifications"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Provide specific changes in JSON format:
            </p>
            <div className="text-xs text-gray-500 mb-3">
              <p>Examples:</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Add technology: <code>{`{"techStack": ["React", "Node.js", "MongoDB"]}`}</code></li>
                <li>Modify features: <code>{`{"features": ["Authentication", "Dashboard", "Reports"]}`}</code></li>
                <li>Update description: <code>{`{"description": "Updated project description"}`}</code></li>
              </ul>
            </div>
          </div>
          <textarea
            value={modifyChanges}
            onChange={(e) => setModifyChanges(e.target.value)}
            placeholder='{"techStack": ["React", "Node.js"], "features": ["Authentication", "Dashboard"]}'
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
          />
          <div className="flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModifyChanges(JSON.stringify(parsedContent?.data || {}, null, 2))}
            >
              Load Current Content
            </Button>
            <div className="flex space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowModifyModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleModify}
                disabled={!modifyChanges.trim()}
              >
                Request Changes
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Version History Modal */}
      <Modal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        title="Version History"
      >
        <div className="space-y-4">
          <div className="max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={clsx(
                    'flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors',
                    version.id === response.id
                      ? 'border-primary-200 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  )}
                  onClick={() => handleVersionSelect(version)}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Version {version.version}</span>
                      {version.id === response.id && (
                        <Badge variant="primary" size="sm">Current</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(version.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      version.status === 'approved' ? 'success' :
                        version.status === 'rejected' ? 'error' : 'warning'
                    }
                    size="sm"
                  >
                    {version.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {selectedVersion && selectedVersion.id !== response.id && (
            <div className="border-t pt-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3">Version Comparison</h5>
              {renderVersionComparison()}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowVersionModal(false)
                setSelectedVersion(null)
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AIResponseViewer