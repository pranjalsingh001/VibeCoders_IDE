// HLDDisplay.tsx
// ---------------
// Component for displaying parsed High-Level Design content
// Shows system design, components, API endpoints, and database schema

import React, { useState } from 'react'
import clsx from 'clsx'
import { 
  Layers, 
  Database, 
  Globe, 
  Box, 
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Server,
  Link,
  Table
} from 'lucide-react'

import Card from '../ui/Card'
import Badge from '../ui/Badge'
import { HLD, ComponentSpec, APIEndpoint, DatabaseSchema } from '../../types/aiResponse'

interface HLDDisplayProps {
  content: HLD
  className?: string
}

const HLDDisplay: React.FC<HLDDisplayProps> = ({
  content,
  className
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['components']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const renderSystemDesign = () => {
    if (!content.systemDesign) return null

    const design = content.systemDesign

    return (
      <Card>
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Layers className="w-5 h-5 text-blue-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">System Design Overview</h4>
        </div>
        
        <div className="space-y-4">
          {design.description && (
            <div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {design.description}
              </p>
            </div>
          )}
          
          {design.principles && Array.isArray(design.principles) && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Design Principles</h5>
              <div className="space-y-2">
                {design.principles.map((principle: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">{principle}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {design.scalability && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Scalability Considerations</h5>
              <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3">
                {design.scalability}
              </p>
            </div>
          )}
        </div>
      </Card>
    )
  }

  const renderComponents = () => {
    if (!content.components || content.components.length === 0) return null

    const isExpanded = expandedSections.has('components')

    return (
      <Card>
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('components')}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Box className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">System Components</h4>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{content.components.length} components</Badge>
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {content.components.map((component: ComponentSpec, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-md font-medium text-gray-900">{component.name}</h5>
                  <Badge variant="primary" size="sm">Component</Badge>
                </div>
                
                <p className="text-sm text-gray-700 mb-3">{component.purpose}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {component.dependencies && component.dependencies.length > 0 && (
                    <div>
                      <h6 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Dependencies
                      </h6>
                      <div className="space-y-1">
                        {component.dependencies.map((dep: string, depIndex: number) => (
                          <div key={depIndex} className="flex items-center space-x-2">
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-600">{dep}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {component.interfaces && component.interfaces.length > 0 && (
                    <div>
                      <h6 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Interfaces
                      </h6>
                      <div className="space-y-1">
                        {component.interfaces.map((iface: string, ifaceIndex: number) => (
                          <div key={ifaceIndex} className="flex items-center space-x-2">
                            <Link className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-600">{iface}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    )
  }

  const renderAPIEndpoints = () => {
    if (!content.apiEndpoints || content.apiEndpoints.length === 0) return null

    const isExpanded = expandedSections.has('api')

    return (
      <Card>
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('api')}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Globe className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">API Endpoints</h4>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{content.apiEndpoints.length} endpoints</Badge>
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 space-y-3">
            {content.apiEndpoints.map((endpoint: APIEndpoint, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Badge 
                    variant={
                      endpoint.method === 'GET' ? 'success' :
                      endpoint.method === 'POST' ? 'primary' :
                      endpoint.method === 'PUT' ? 'warning' :
                      endpoint.method === 'DELETE' ? 'error' : 'secondary'
                    }
                    size="sm"
                  >
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                    {endpoint.path}
                  </code>
                </div>
                
                <p className="text-sm text-gray-700 mb-3">{endpoint.description}</p>
                
                {endpoint.parameters && endpoint.parameters.length > 0 && (
                  <div className="mb-3">
                    <h6 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Parameters
                    </h6>
                    <div className="space-y-2">
                      {endpoint.parameters.map((param, paramIndex) => (
                        <div key={paramIndex} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <code className="font-mono text-gray-700">{param.name}</code>
                            <Badge variant={param.required ? 'error' : 'secondary'} size="sm">
                              {param.required ? 'required' : 'optional'}
                            </Badge>
                          </div>
                          <span className="text-gray-500">{param.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {endpoint.responses && endpoint.responses.length > 0 && (
                  <div>
                    <h6 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Responses
                    </h6>
                    <div className="space-y-1">
                      {endpoint.responses.map((response, responseIndex) => (
                        <div key={responseIndex} className="flex items-center space-x-3 text-sm">
                          <Badge 
                            variant={
                              response.status < 300 ? 'success' :
                              response.status < 400 ? 'warning' : 'error'
                            }
                            size="sm"
                          >
                            {response.status}
                          </Badge>
                          <span className="text-gray-700">{response.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    )
  }

  const renderDatabaseSchema = () => {
    if (!content.databaseSchema) return null

    const schema = content.databaseSchema
    const isExpanded = expandedSections.has('database')

    return (
      <Card>
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('database')}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Database className="w-5 h-5 text-orange-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Database Schema</h4>
          </div>
          <div className="flex items-center space-x-2">
            {schema.tables && (
              <Badge variant="secondary">{schema.tables.length} tables</Badge>
            )}
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {schema.tables && schema.tables.map((table, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Table className="w-4 h-4 text-orange-600" />
                  <h5 className="text-md font-medium text-gray-900">{table.name}</h5>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Column</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Type</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-900">Constraints</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.columns.map((column, colIndex) => (
                        <tr key={colIndex} className="border-b border-gray-100">
                          <td className="py-2 px-3 font-mono text-gray-700">{column.name}</td>
                          <td className="py-2 px-3 text-gray-600">{column.type}</td>
                          <td className="py-2 px-3">
                            <div className="flex space-x-1">
                              {column.primaryKey && (
                                <Badge variant="primary" size="sm">PK</Badge>
                              )}
                              {column.foreignKey && (
                                <Badge variant="secondary" size="sm">FK</Badge>
                              )}
                              {!column.nullable && (
                                <Badge variant="warning" size="sm">NOT NULL</Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            
            {schema.relationships && schema.relationships.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="text-md font-medium text-gray-900 mb-3">Relationships</h5>
                <div className="space-y-2">
                  {schema.relationships.map((rel, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      <code className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {rel.from}
                      </code>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <code className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {rel.to}
                      </code>
                      <Badge variant="secondary" size="sm">{rel.type}</Badge>
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

  const renderDataFlow = () => {
    if (!content.dataFlow) return null

    return (
      <Card>
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Server className="w-5 h-5 text-indigo-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900">Data Flow</h4>
        </div>
        
        <div className="space-y-4">
          {content.dataFlow.description && (
            <p className="text-sm text-gray-700 leading-relaxed">
              {content.dataFlow.description}
            </p>
          )}
          
          {content.dataFlow.flows && Array.isArray(content.dataFlow.flows) && (
            <div className="space-y-3">
              {content.dataFlow.flows.map((flow: any, index: number) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-indigo-600">{index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {typeof flow === 'string' ? flow : flow.description || `Flow ${index + 1}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {renderSystemDesign()}
      {renderComponents()}
      {renderAPIEndpoints()}
      {renderDatabaseSchema()}
      {renderDataFlow()}
    </div>
  )
}

export default HLDDisplay