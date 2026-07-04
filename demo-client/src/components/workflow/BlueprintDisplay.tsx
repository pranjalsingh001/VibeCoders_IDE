// BlueprintDisplay.tsx
// -------------------
// Component for displaying parsed Blueprint content
// Shows tech stack, features, requirements, and project overview

import React, { useState } from 'react'
import clsx from 'clsx'
import { 
  CheckSquare, 
  Square, 
  Layers, 
  Code, 
  FileText, 
  Target,
  Users,
  Clock
} from 'lucide-react'

import Card from '../ui/Card'
import { TechBadge } from '../ui/Badge'
import { Blueprint } from '../../types/aiResponse'

interface BlueprintDisplayProps {
  content: Blueprint
  className?: string
}

const BlueprintDisplay: React.FC<BlueprintDisplayProps> = ({
  content,
  className
}) => {
  const [checkedFeatures, setCheckedFeatures] = useState<Set<string>>(new Set())

  const toggleFeature = (feature: string) => {
    const newChecked = new Set(checkedFeatures)
    if (newChecked.has(feature)) {
      newChecked.delete(feature)
    } else {
      newChecked.add(feature)
    }
    setCheckedFeatures(newChecked)
  }

  const renderProjectOverview = () => {
    if (!content.projectOverview && !content.description) return null

    return (
      <Card>
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Project Overview</h4>
        </div>
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {content.projectOverview || content.description}
          </p>
        </div>
      </Card>
    )
  }

  const renderTechStack = () => {
    if (!content.techStack || content.techStack.length === 0) return null

    return (
      <Card>
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Code className="w-5 h-5 text-green-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Technology Stack</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {content.techStack.map((tech, index) => (
            <TechBadge key={index} tech={tech} />
          ))}
        </div>
      </Card>
    )
  }

  const renderFeatures = () => {
    if (!content.features || content.features.length === 0) return null

    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Project Features</h4>
          </div>
          <div className="text-sm text-gray-500">
            {checkedFeatures.size} of {content.features.length} reviewed
          </div>
        </div>
        
        <div className="space-y-3">
          {content.features.map((feature, index) => {
            const isChecked = checkedFeatures.has(feature)
            return (
              <div
                key={index}
                className={clsx(
                  'flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-150',
                  isChecked 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                )}
                onClick={() => toggleFeature(feature)}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-green-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={clsx(
                    'text-sm font-medium',
                    isChecked ? 'text-green-900' : 'text-gray-900'
                  )}>
                    {feature}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    )
  }

  const renderRequirements = () => {
    if (!content.requirements || content.requirements.length === 0) return null

    return (
      <Card>
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Users className="w-5 h-5 text-orange-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Requirements</h4>
        </div>
        
        <div className="space-y-3">
          {content.requirements.map((requirement, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-xs font-medium text-orange-600">
                  {index + 1}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {requirement}
              </p>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  const renderArchitectureOverview = () => {
    if (!content.architecture || typeof content.architecture !== 'object') return null

    const arch = content.architecture
    
    return (
      <Card>
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Architecture Overview</h4>
        </div>
        
        <div className="space-y-4">
          {arch.pattern && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Architecture Pattern</h5>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                {arch.pattern}
              </p>
            </div>
          )}
          
          {arch.layers && Array.isArray(arch.layers) && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">System Layers</h5>
              <div className="space-y-2">
                {arch.layers.map((layer: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">
                      {typeof layer === 'string' ? layer : layer.name || `Layer ${index + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {arch.description && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Description</h5>
              <p className="text-sm text-gray-700 leading-relaxed">
                {arch.description}
              </p>
            </div>
          )}
        </div>
      </Card>
    )
  }

  const renderProjectMetadata = () => {
    const metadata = []
    
    if (content.estimatedDuration) {
      metadata.push({
        icon: <Clock className="w-4 h-4" />,
        label: 'Estimated Duration',
        value: content.estimatedDuration
      })
    }
    
    if (content.complexity) {
      metadata.push({
        icon: <Target className="w-4 h-4" />,
        label: 'Complexity',
        value: content.complexity
      })
    }
    
    if (content.teamSize) {
      metadata.push({
        icon: <Users className="w-4 h-4" />,
        label: 'Recommended Team Size',
        value: content.teamSize
      })
    }
    
    if (metadata.length === 0) return null

    return (
      <Card>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Project Metadata</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metadata.map((item, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-500">
                {item.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {item.label}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {renderProjectOverview()}
      {renderTechStack()}
      {renderFeatures()}
      {renderRequirements()}
      {renderArchitectureOverview()}
      {renderProjectMetadata()}
    </div>
  )
}

export default BlueprintDisplay