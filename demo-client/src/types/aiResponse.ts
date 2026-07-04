// aiResponse.ts
// -------------
// Type definitions for AI response components
// Defines response structure, parsing, and display interfaces

export interface AIResponse {
  id: string
  content: any
  rawJson: string
  version: number
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
  feedback?: string
}

export interface Blueprint extends AIResponse {
  techStack: string[]
  features: string[]
  architecture: any
  projectOverview?: string
  requirements?: string[]
}

export interface HLD extends AIResponse {
  systemDesign: any
  components: ComponentSpec[]
  dataFlow: any
  apiEndpoints?: APIEndpoint[]
  databaseSchema?: DatabaseSchema
}

export interface LLD extends AIResponse {
  detailedDesign: any
  implementation: ImplementationSpec
  specifications: any
  codeStructure?: CodeStructure
}

export interface ComponentSpec {
  name: string
  purpose: string
  dependencies: string[]
  interfaces: string[]
}

export interface APIEndpoint {
  method: string
  path: string
  description: string
  parameters?: Parameter[]
  responses?: Response[]
}

export interface Parameter {
  name: string
  type: string
  required: boolean
  description: string
}

export interface Response {
  status: number
  description: string
  schema?: any
}

export interface DatabaseSchema {
  tables: Table[]
  relationships: Relationship[]
}

export interface Table {
  name: string
  columns: Column[]
  indexes?: Index[]
}

export interface Column {
  name: string
  type: string
  nullable: boolean
  primaryKey?: boolean
  foreignKey?: string
}

export interface Index {
  name: string
  columns: string[]
  unique: boolean
}

export interface Relationship {
  from: string
  to: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
}

export interface ImplementationSpec {
  fileStructure: FileStructure[]
  dependencies: Dependency[]
  configurations: Configuration[]
}

export interface FileStructure {
  path: string
  type: 'file' | 'directory'
  purpose: string
  dependencies?: string[]
}

export interface Dependency {
  name: string
  version: string
  type: 'production' | 'development'
  purpose: string
}

export interface Configuration {
  file: string
  settings: Record<string, any>
  purpose: string
}

export interface CodeStructure {
  modules: Module[]
  classes: Class[]
  functions: Function[]
}

export interface Module {
  name: string
  path: string
  exports: string[]
  imports: string[]
}

export interface Class {
  name: string
  module: string
  methods: Method[]
  properties: Property[]
}

export interface Method {
  name: string
  parameters: Parameter[]
  returnType: string
  visibility: 'public' | 'private' | 'protected'
}

export interface Property {
  name: string
  type: string
  visibility: 'public' | 'private' | 'protected'
}

export interface Function {
  name: string
  module: string
  parameters: Parameter[]
  returnType: string
}

// Parsing and validation interfaces
export interface ParsedResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  fallbackContent?: string
}

export interface ResponseValidation {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}

// UI interaction interfaces
export interface ResponseAction {
  type: 'approve' | 'reject' | 'modify'
  responseId: string
  feedback?: string
  changes?: any
}

export interface ResponseHistory {
  versions: AIResponse[]
  currentVersion: number
  changes: VersionChange[]
}

export interface VersionChange {
  version: number
  timestamp: string
  action: 'created' | 'approved' | 'rejected' | 'modified'
  user: string
  summary: string
}

// Mermaid diagram interfaces
export interface MermaidDiagram {
  type: 'flowchart' | 'sequence' | 'class' | 'state' | 'entity-relationship'
  content: string
  title?: string
  description?: string
}

export interface DiagramRenderOptions {
  theme: 'default' | 'dark' | 'forest' | 'neutral'
  width?: number
  height?: number
  backgroundColor?: string
}