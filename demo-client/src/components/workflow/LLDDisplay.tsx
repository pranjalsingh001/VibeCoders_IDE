// LLDDisplay.tsx
// ---------------
// Component for displaying parsed Low-Level Design content
// Shows detailed implementation specs, code structure, and configurations

import React, { useState } from 'react'
import clsx from 'clsx'
import { 
  Code, 
  FileText, 
  Settings, 
  Package, 
  FolderTree,
  ChevronDown,
  ChevronRight,
  Database,
  Layers
} from 'lucide-react'

import Card from '../ui/Card'
import Badge from '../ui/Badge'
import { LLD, ImplementationSpec, CodeStructure } from '../../types/aiResponse'

interface LLDDisplayProps {
  content: LLD
  className?: string
}

const LLDDisplay: React.FC<LLDDisplayProps> = ({
  content,
  className
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['implementation']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const renderDetailedDesign = () => {
    if (!content.detailedDesign) return null

    const design = content.detailedDesign

    return (
      <Card>
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Layers className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Detailed Design</h4>
        </div>
        
        <div className="space-y-4">
          {design.description && (
            <div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {design.description}
              </p>
            </div>
          )}
          
          {design.patterns && Array.isArray(design.patterns) && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Design Patterns</h5>
              <div className="space-y-2">
                {design.patterns.map((pattern: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">{pattern}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    )
  }

  const renderImplementation = () => {
    if (!content.implementation) return null

    const impl = content.implementation
    const isExpanded = expandedSections.has('implementation')

    return (
      <Card>
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('implementation')}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Code className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Implementation Specification</h4>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
        
        {isExpanded && (
          <div className="mt-4 space-y-6">
            {/* File Structure */}
            {impl.fileStructure && impl.fileStructure.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <FolderTree className="w-4 h-4 text-green-600" />
                  <h5 className="text-md font-medium text-gray-900">File Structure</h5>
                </div>
                <div className="space-y-2">
                  {impl.fileStructure.map((file: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {file.type === 'directory' ? (
                          <FolderTree className="w-4 h-4 text-gray-500" />
                        ) : (
                          <FileText className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <code className="text-sm font-mono text-gray-700">{file.path}</code>
                        {file.purpose && (
                          <p className="text-xs text-gray-500 mt-1">{file.purpose}</p>
                        )}
                      </div>
                      <Badge variant="secondary" size="sm">{file.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dependencies */}
            {impl.dependencies && impl.dependencies.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Package className="w-4 h-4 text-green-600" />
                  <h5 className="text-md font-medium text-gray-900">Dependencies</h5>
                </div>
                <div className="space-y-2">
                  {impl.dependencies.map((dep: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <code className="text-sm font-mono text-gray-700">{dep.name}</code>
                        <p className="text-xs text-gray-500 mt-1">{dep.purpose}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" size="sm">{dep.version}</Badge>
                        <Badge 
                          variant={dep.type === 'production' ? 'primary' : 'warning'} 
                          size="sm"
                        >
                          {dep.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Configurations */}
            {impl.configurations && impl.configurations.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Settings className="w-4 h-4 text-green-600" />
                  <h5 className="text-md font-medium text-gray-900">Configurations</h5>
                </div>
                <div className="space-y-3">
                  {impl.configurations.map((config: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm font-mono text-gray-700">{config.file}</code>
                        <Badge variant="secondary" size="sm">Config</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{config.purpose}</p>
                      {config.settings && (
                        <pre className="text-xs bg-gray-100 rounded p-2 overflow-x-auto">
                          <code>{JSON.stringify(config.settings, null, 2)}</code>
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    )
  }

  const renderCodeStructure = () => {
    if (!content.codeStructure) return null

    const code = content.codeStructure
    const isExpanded = expandedSections.has('codeStructure')

    return (
      <Card>
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('codeStructure')}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Code Structure</h4>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
        
        {isExpanded && (
          <div className="mt-4 space-y-6">
            {/* Modules */}
            {code.modules && code.modules.length > 0 && (
              <div>
                <h5 className="text-md font-medium text-gray-900 mb-3">Modules</h5>
                <div className="space-y-3">
                  {code.modules.map((module: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="text-sm font-medium text-gray-900">{module.name}</h6>
                        <Badge variant="primary" size="sm">Module</Badge>
                      </div>
                      <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {module.path}
                      </code>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        {module.exports && module.exports.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Exports</p>
                            <div className="space-y-1">
                              {module.exports.map((exp: string, expIndex: number) => (
                                <code key={expIndex} className="text-xs text-gray-600 block">
                                  {exp}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {module.imports && module.imports.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Imports</p>
                            <div className="space-y-1">
                              {module.imports.map((imp: string, impIndex: number) => (
                                <code key={impIndex} className="text-xs text-gray-600 block">
                                  {imp}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Classes */}
            {code.classes && code.classes.length > 0 && (
              <div>
                <h5 className="text-md font-medium text-gray-900 mb-3">Classes</h5>
                <div className="space-y-3">
                  {code.classes.map((cls: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="text-sm font-medium text-gray-900">{cls.name}</h6>
                        <Badge variant="success" size="sm">Class</Badge>
                      </div>
                      <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {cls.module}
                      </code>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        {cls.methods && cls.methods.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Methods</p>
                            <div className="space-y-1">
                              {cls.methods.map((method: any, methodIndex: number) => (
                                <div key={methodIndex} className="text-xs">
                                  <code className="text-gray-700">{method.name}()</code>
                                  <Badge variant="secondary" size="sm" className="ml-2">
                                    {method.visibility}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {cls.properties && cls.properties.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Properties</p>
                            <div className="space-y-1">
                              {cls.properties.map((prop: any, propIndex: number) => (
                                <div key={propIndex} className="text-xs">
                                  <code className="text-gray-700">{prop.name}: {prop.type}</code>
                                  <Badge variant="secondary" size="sm" className="ml-2">
                                    {prop.visibility}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Functions */}
            {code.functions && code.functions.length > 0 && (
              <div>
                <h5 className="text-md font-medium text-gray-900 mb-3">Functions</h5>
                <div className="space-y-2">
                  {code.functions.map((func: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <code className="text-sm font-mono text-gray-700">{func.name}()</code>
                        <p className="text-xs text-gray-500">{func.module}</p>
                      </div>
                      <Badge variant="warning" size="sm">Function</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    )
  }

  const renderSpecifications = () => {
    if (!content.specifications) return null

    return (
      <Card>
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <FileText className="w-5 h-5 text-orange-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Technical Specifications</h4>
        </div>
        
        <div className="space-y-4">
          {typeof content.specifications === 'string' ? (
            <p className="text-sm text-gray-700 leading-relaxed">
              {content.specifications}
            </p>
          ) : (
            <pre className="text-sm bg-gray-50 rounded-lg p-4 overflow-x-auto">
              <code>{JSON.stringify(content.specifications, null, 2)}</code>
            </pre>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {renderDetailedDesign()}
      {renderImplementation()}
      {renderCodeStructure()}
      {renderSpecifications()}
    </div>
  )
}

export default LLDDisplay