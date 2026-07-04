// test/mocks.ts
// Mock implementations for testing

import { vi } from 'vitest'
import { AxiosResponse } from 'axios'

// Mock API responses
export const mockApiResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
})

export const mockApiError = (status: number, message: string) => ({
  response: {
    status,
    data: { message },
    statusText: status === 404 ? 'Not Found' : 'Error',
    headers: {},
    config: {} as any,
  },
  config: {} as any,
  isAxiosError: true,
  toJSON: () => ({}),
  name: 'AxiosError',
  message,
})

// Mock WebSocket
export const mockWebSocket = {
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn(),
  joinProjectRoom: vi.fn(),
  leaveProjectRoom: vi.fn(),
  onWorkflowUpdate: vi.fn().mockReturnValue(() => {}),
  onFileGenerationUpdate: vi.fn().mockReturnValue(() => {}),
  onExecutionLog: vi.fn().mockReturnValue(() => {}),
  onProjectStatusUpdate: vi.fn().mockReturnValue(() => {}),
  emit: vi.fn(),
  isConnected: vi.fn().mockReturnValue(true),
  getConnectionId: vi.fn().mockReturnValue('mock-connection-id'),
}

// Mock stores initial state
export const mockWorkflowState = {
  projectId: null,
  currentStage: 'planning' as const,
  stageStatus: {
    planning: 'not_started' as const,
    blueprint: 'not_started' as const,
    hld: 'not_started' as const,
    lld: 'not_started' as const,
    codegen: 'not_started' as const,
    completed: 'not_started' as const,
  },
  planningResult: null,
  blueprint: null,
  hld: null,
  lld: null,
  codegenResult: null,
  loading: false,
  error: null,
}

export const mockUIState = {
  theme: 'light' as const,
  sidebarCollapsed: false,
  modals: {
    newProject: false,
    confirmDelete: false,
    viewRawJson: false,
    planningHelp: false,
    codegenProgress: false,
  },
  toasts: [],
  globalLoading: false,
  loadingMessage: null,
}

// Mock project data
export const mockProject = {
  id: 'test-project-1',
  name: 'Test Project',
  description: 'A test project for unit testing',
  userId: 'test-user-1',
  status: 'active' as const,
  currentStage: 'planning' as const,
  stageResults: {},
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

// Mock planning result
export const mockPlanningResult = {
  answers: {
    projectName: 'Test Project',
    projectDescription: 'A test project',
    targetAudience: 'Developers',
    techStack: 'React, Node.js',
  },
  submittedAt: '2024-01-01T00:00:00Z',
  version: 1,
}

// Mock AI response
export const mockBlueprint = {
  id: 'blueprint-1',
  content: {
    projectOverview: 'Test project overview',
    features: ['Feature 1', 'Feature 2'],
    techStack: ['React', 'Node.js', 'MongoDB'],
    architecture: {
      frontend: 'React SPA',
      backend: 'Node.js API',
      database: 'MongoDB',
    },
  },
  rawJson: '{"projectOverview":"Test project overview"}',
  version: 1,
  createdAt: '2024-01-01T00:00:00Z',
  status: 'pending' as const,
  techStack: ['React', 'Node.js', 'MongoDB'],
  features: ['Feature 1', 'Feature 2'],
  architecture: {
    frontend: 'React SPA',
    backend: 'Node.js API',
    database: 'MongoDB',
  },
}

// Mock file manifest
export const mockFileManifest = {
  files: [
    {
      path: 'src/App.tsx',
      purpose: 'Main application component',
      status: 'completed' as const,
      attempts: 1,
      size: 1024,
      lastModified: '2024-01-01T00:00:00Z',
    },
    {
      path: 'src/components/Header.tsx',
      purpose: 'Header component',
      status: 'pending' as const,
      attempts: 0,
    },
    {
      path: 'src/services/api.ts',
      purpose: 'API service layer',
      status: 'failed' as const,
      attempts: 2,
      error: 'Generation failed',
    },
  ],
  totalFiles: 3,
  completedFiles: 1,
  failedFiles: 1,
}

// Mock CodeGen result
export const mockCodeGenResult = {
  manifest: mockFileManifest,
  generatedFiles: ['src/App.tsx'],
  failedFiles: ['src/services/api.ts'],
  completedAt: '2024-01-01T00:00:00Z',
}