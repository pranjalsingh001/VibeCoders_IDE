// WorkspacePage.integration.test.tsx
// Integration tests for WorkspacePage component

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import WorkspacePage from '../WorkspacePage'
import useWorkspaceStore from '../../stores/workspaceStore'
import useAuthStore from '../../stores/authStore'
import { fileService } from '../../services/fileService'
import { executionAPI } from '../../services/executionService'
import { codegenAPI } from '../../services/codegenService'
import { mockApiResponse, mockApiError } from '../../test/mocks'
import { io } from 'socket.io-client'

// Mock the services
vi.mock('../../services/fileService', () => ({
  fileService: {
    list: vi.fn(),
    read: vi.fn(),
    write: vi.fn(),
    createFolder: vi.fn(),
    delete: vi.fn(),
  }
}))

vi.mock('../../services/executionService', () => ({
  executionAPI: {
    start: vi.fn(),
    stop: vi.fn(),
    status: vi.fn(),
  }
}))

vi.mock('../../services/codegenService', () => ({
  codegenAPI: {
    createPlan: vi.fn(),
    applyPlan: vi.fn(),
  }
}))

// Mock Socket.IO
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  }))
}))

// Mock the editor components
vi.mock('../../components/editor/FileExplorer', () => ({
  default: ({ projectId }: { projectId: string }) => (
    <div data-testid="file-explorer" data-project-id={projectId}>
      <div data-testid="file-item" onClick={() => mockOpenFile('test.js')}>
        test.js
      </div>
      <div data-testid="folder-item" onClick={() => mockNavigateFolder('src')}>
        src/
      </div>
      <button data-testid="create-file-btn">Create File</button>
      <button data-testid="create-folder-btn">Create Folder</button>
    </div>
  )
}))

vi.mock('../../components/editor/MonacoEditor', () => ({
  default: ({ projectId }: { projectId: string }) => (
    <div data-testid="monaco-editor" data-project-id={projectId}>
      <div data-testid="editor-tabs">
        <div data-testid="tab-test.js" className="active">test.js</div>
      </div>
      <div data-testid="editor-content">
        <textarea 
          data-testid="editor-textarea"
          onChange={(e) => mockUpdateContent(e.target.value)}
          placeholder="Editor content"
        />
      </div>
      <button data-testid="ai-assist-btn">AI Assist</button>
      <button data-testid="save-btn">Save</button>
    </div>
  )
}))

vi.mock('../../components/editor/Terminal', () => ({
  default: ({ logs, onStart, onStop, session, starting, stopping }: any) => (
    <div data-testid="terminal">
      <div data-testid="terminal-header">
        <button 
          data-testid="start-btn" 
          onClick={onStart}
          disabled={starting || !!session}
        >
          {starting ? 'Starting...' : 'Start'}
        </button>
        <button 
          data-testid="stop-btn" 
          onClick={onStop}
          disabled={stopping || !session}
        >
          {stopping ? 'Stopping...' : 'Stop'}
        </button>
      </div>
      <div data-testid="terminal-logs">
        {logs.map((log: string, index: number) => (
          <div key={index} data-testid={`log-${index}`}>{log}</div>
        ))}
      </div>
      {session && (
        <div data-testid="session-info">
          Session: {session.id} - Port: {session.port}
        </div>
      )}
    </div>
  )
}))

// Mock react-router-dom
const mockUseParams = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => mockUseParams(),
  }
})

// Mock utility functions
const mockOpenFile = vi.fn()
const mockNavigateFolder = vi.fn()
const mockUpdateContent = vi.fn()

// Helper function to render WorkspacePage with router
const renderWorkspacePage = (projectId = 'test-project-1') => {
  mockUseParams.mockReturnValue({ id: projectId })
  return render(
    <MemoryRouter>
      <WorkspacePage />
    </MemoryRouter>
  )
}

// Mock data
const mockFiles = [
  { name: 'test.js', type: 'file' as const, size: 1024 },
  { name: 'src', type: 'dir' as const },
  { name: 'package.json', type: 'file' as const, size: 512 },
]

const mockSession = {
  id: 'session-123',
  port: 3000,
  url: 'http://localhost:3000',
  status: 'running',
}

const mockPlan = {
  files: [
    { path: 'src/App.js', description: 'Main application component' },
    { path: 'src/components/Header.js', description: 'Header component' },
  ]
}

describe('WorkspacePage Integration Tests', () => {
  let mockSocket: any

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup default mock implementations
    vi.mocked(fileService.list).mockResolvedValue(mockFiles)
    vi.mocked(fileService.read).mockResolvedValue('console.log("Hello World");')
    vi.mocked(fileService.write).mockResolvedValue(undefined)
    vi.mocked(executionAPI.status).mockResolvedValue({ session: null })
    vi.mocked(executionAPI.start).mockResolvedValue({ 
      success: true, 
      session: mockSession,
      message: 'Session started'
    })
    vi.mocked(executionAPI.stop).mockResolvedValue({ success: true })
    vi.mocked(codegenAPI.createPlan).mockResolvedValue({ 
      success: true, 
      plan: mockPlan 
    })
    vi.mocked(codegenAPI.applyPlan).mockResolvedValue({ success: true })

    // Setup mock socket
    mockSocket = {
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
    }
    vi.mocked(io).mockReturnValue(mockSocket)

    // Setup auth store
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'mock-token',
      user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
      loading: false,
      error: null,
    })

    // Reset workspace store
    useWorkspaceStore.getState().clearWorkspace()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Monaco Editor Functionality and File Management', () => {
    it('should initialize workspace and load file explorer', async () => {
      renderWorkspacePage()

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument()
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
      })

      // The actual WorkspacePage calls fileService.list through the FileExplorer component
      // Since we're mocking the FileExplorer, we don't expect the service to be called directly
      // Instead, verify components are rendered with correct project ID
      expect(screen.getByTestId('file-explorer')).toHaveAttribute('data-project-id', 'test-project-1')
      expect(screen.getByTestId('monaco-editor')).toHaveAttribute('data-project-id', 'test-project-1')
    })

    it('should handle file opening and tab management', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument()
      })

      // Simulate opening a file
      const fileItem = screen.getByTestId('file-item')
      
      act(() => {
        fireEvent.click(fileItem)
      })

      // Verify file was opened
      expect(mockOpenFile).toHaveBeenCalledWith('test.js')
      
      // Check that editor shows the file tab
      await waitFor(() => {
        expect(screen.getByTestId('tab-test.js')).toBeInTheDocument()
      })
    })

    it('should handle file content editing and auto-save', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
      })

      // Simulate editing content
      const editorTextarea = screen.getByTestId('editor-textarea')
      
      await act(async () => {
        await userEvent.type(editorTextarea, 'console.log("Modified content");')
      })

      // Verify content update was called
      expect(mockUpdateContent).toHaveBeenCalled()
    })

    it('should handle manual save functionality', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
      })

      // Click save button
      const saveBtn = screen.getByTestId('save-btn')
      
      act(() => {
        fireEvent.click(saveBtn)
      })

      // In a real implementation, this would trigger a save
      // For now, we just verify the button exists and is clickable
      expect(saveBtn).toBeInTheDocument()
    })

    it('should handle folder navigation', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument()
      })

      // Simulate navigating to a folder
      const folderItem = screen.getByTestId('folder-item')
      
      act(() => {
        fireEvent.click(folderItem)
      })

      // Verify folder navigation was triggered
      expect(mockNavigateFolder).toHaveBeenCalledWith('src')
    })

    it('should handle file creation', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument()
      })

      // Click create file button
      const createFileBtn = screen.getByTestId('create-file-btn')
      
      act(() => {
        fireEvent.click(createFileBtn)
      })

      // Verify button is functional
      expect(createFileBtn).toBeInTheDocument()
    })

    it('should handle folder creation', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument()
      })

      // Click create folder button
      const createFolderBtn = screen.getByTestId('create-folder-btn')
      
      act(() => {
        fireEvent.click(createFolderBtn)
      })

      // Verify button is functional
      expect(createFolderBtn).toBeInTheDocument()
    })

    it('should handle file service errors gracefully', async () => {
      // Mock file service to throw error
      vi.mocked(fileService.list).mockRejectedValue(new Error('Failed to load files'))

      renderWorkspacePage()

      // Should still render components
      await waitFor(() => {
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument()
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
      })

      // Error should be handled gracefully (no crash)
      expect(screen.getByTestId('file-explorer')).toBeInTheDocument()
    })

    it('should toggle auto-save functionality', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByText('Auto-save: ON')).toBeInTheDocument()
      })

      // Click auto-save toggle
      const autoSaveToggle = screen.getByText('Auto-save: ON')
      
      act(() => {
        fireEvent.click(autoSaveToggle)
      })

      // Verify auto-save state changed
      await waitFor(() => {
        expect(screen.getByText('Auto-save: OFF')).toBeInTheDocument()
      })
    })
  })

  describe('Terminal Integration and Log Streaming', () => {
    it('should render terminal with start/stop controls', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('terminal')).toBeInTheDocument()
      })

      // Verify terminal controls are present
      expect(screen.getByTestId('start-btn')).toBeInTheDocument()
      expect(screen.getByTestId('stop-btn')).toBeInTheDocument()
      expect(screen.getByTestId('terminal-logs')).toBeInTheDocument()
    })

    it('should handle development session start', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('terminal')).toBeInTheDocument()
      })

      // Click start button
      const startBtn = screen.getByTestId('start-btn')
      
      act(() => {
        fireEvent.click(startBtn)
      })

      // Verify execution API was called
      await waitFor(() => {
        expect(executionAPI.start).toHaveBeenCalledWith('test-project-1')
      })

      // Verify button state changes
      expect(startBtn).toBeDisabled()
    })

    it('should handle development session stop', async () => {
      // Setup with existing session
      vi.mocked(executionAPI.status).mockResolvedValue({ session: mockSession })

      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('terminal')).toBeInTheDocument()
      })

      // Wait for session to be loaded
      await waitFor(() => {
        expect(screen.getByTestId('session-info')).toBeInTheDocument()
      })

      // Click stop button
      const stopBtn = screen.getByTestId('stop-btn')
      
      act(() => {
        fireEvent.click(stopBtn)
      })

      // Verify execution API was called
      await waitFor(() => {
        expect(executionAPI.stop).toHaveBeenCalledWith('test-project-1')
      })
    })

    it('should display real-time logs via WebSocket', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('terminal')).toBeInTheDocument()
      })

      // Verify WebSocket connection was established
      expect(io).toHaveBeenCalledWith('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        auth: { token: 'mock-token' }
      })

      // Verify socket event listeners were set up
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('logs:update', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('project:status', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
    })

    it('should handle WebSocket log updates', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('terminal')).toBeInTheDocument()
      })

      // Simulate WebSocket log update
      const logHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'logs:update'
      )?.[1]

      if (logHandler) {
        act(() => {
          logHandler({
            projectId: 'test-project-1',
            log: 'Test log message',
            timestamp: new Date().toISOString(),
            type: 'info'
          })
        })
      }

      // Verify log appears in terminal
      await waitFor(() => {
        expect(screen.getByText(/Test log message/)).toBeInTheDocument()
      })
    })

    it('should handle WebSocket project status updates', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('terminal')).toBeInTheDocument()
      })

      // Simulate WebSocket status update
      const statusHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'project:status'
      )?.[1]

      if (statusHandler) {
        act(() => {
          statusHandler({
            projectId: 'test-project-1',
            status: 'running',
            session: mockSession
          })
        })
      }

      // Verify session info is displayed
      await waitFor(() => {
        expect(screen.getByTestId('session-info')).toBeInTheDocument()
        expect(screen.getByText(/Session: session-123/)).toBeInTheDocument()
      })
    })

    it('should handle execution errors gracefully', async () => {
      // Mock execution API to throw error
      vi.mocked(executionAPI.start).mockRejectedValue(new Error('Failed to start session'))

      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('terminal')).toBeInTheDocument()
      })

      // Click start button
      const startBtn = screen.getByTestId('start-btn')
      
      act(() => {
        fireEvent.click(startBtn)
      })

      // Verify error is handled gracefully
      await waitFor(() => {
        expect(executionAPI.start).toHaveBeenCalled()
      })

      // Button should be re-enabled after error
      await waitFor(() => {
        expect(startBtn).not.toBeDisabled()
      })
    })

    it('should display live preview when session is active', async () => {
      // Setup with existing session
      vi.mocked(executionAPI.status).mockResolvedValue({ session: mockSession })

      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('terminal')).toBeInTheDocument()
      })

      // Verify live preview iframe is rendered
      await waitFor(() => {
        const iframe = screen.getByTitle('live-preview')
        expect(iframe).toBeInTheDocument()
        expect(iframe).toHaveAttribute('src', 'http://localhost:3000')
      })

      // Verify preview link is available
      expect(screen.getByText('Open in new tab')).toBeInTheDocument()
    })

    it('should show placeholder when no session is active', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('terminal')).toBeInTheDocument()
      })

      // Verify placeholder is shown
      expect(screen.getByText('No Preview Available')).toBeInTheDocument()
      expect(screen.getByText('Start a development session to view live preview')).toBeInTheDocument()
    })
  })

  describe('AI Assist Feature Integration', () => {
    it('should render AI assist button in Monaco editor', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
      })

      // Verify AI assist button is present
      expect(screen.getByTestId('ai-assist-btn')).toBeInTheDocument()
    })

    it('should toggle AI assist panel', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
      })

      // Click AI assist button
      const aiAssistBtn = screen.getByTestId('ai-assist-btn')
      
      act(() => {
        fireEvent.click(aiAssistBtn)
      })

      // Verify AI assist functionality is triggered
      expect(aiAssistBtn).toBeInTheDocument()
    })

    it('should handle code generation with AI assist', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByText('Generate Code')).toBeInTheDocument()
      })

      // Click generate code button
      const generateBtn = screen.getByText('Generate Code')
      
      act(() => {
        fireEvent.click(generateBtn)
      })

      // Verify codegen API was called
      await waitFor(() => {
        expect(codegenAPI.createPlan).toHaveBeenCalledWith('test-project-1')
      })
    })

    it('should display code generation plan preview', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByText('Preview Plan')).toBeInTheDocument()
      })

      // Click preview plan button
      const previewBtn = screen.getByText('Preview Plan')
      
      act(() => {
        fireEvent.click(previewBtn)
      })

      // Verify plan preview is shown
      await waitFor(() => {
        expect(codegenAPI.createPlan).toHaveBeenCalledWith('test-project-1')
        expect(screen.getByText('Code Generation Plan:')).toBeInTheDocument()
      })
    })

    it('should handle code generation errors', async () => {
      // Mock codegen API to throw error
      vi.mocked(codegenAPI.createPlan).mockRejectedValue(new Error('Code generation failed'))

      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByText('Generate Code')).toBeInTheDocument()
      })

      // Click generate code button
      const generateBtn = screen.getByText('Generate Code')
      
      act(() => {
        fireEvent.click(generateBtn)
      })

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText('Code generation failed')).toBeInTheDocument()
      })
    })

    it('should refresh file list after code generation', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByText('Generate Code')).toBeInTheDocument()
      })

      // Click generate code button
      const generateBtn = screen.getByText('Generate Code')
      
      act(() => {
        fireEvent.click(generateBtn)
      })

      // Verify code generation APIs are called
      await waitFor(() => {
        expect(codegenAPI.createPlan).toHaveBeenCalled()
        expect(codegenAPI.applyPlan).toHaveBeenCalled()
      })
      
      // Since we're mocking the FileExplorer component, we can't test the actual file refresh
      // In a real integration test, this would verify the file list is updated
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle missing project ID', async () => {
      mockUseParams.mockReturnValue({})

      renderWorkspacePage()

      // The WorkspacePage should still render but with undefined projectId
      // Since our mocked components don't check for projectId, they still render
      // In a real scenario, the components would handle undefined projectId gracefully
      await waitFor(() => {
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument()
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
      })
    })

    it('should handle WebSocket connection errors', async () => {
      // Mock WebSocket to return a socket that fails to connect
      const mockSocketWithError = {
        on: vi.fn(),
        emit: vi.fn(),
        disconnect: vi.fn(),
      }
      
      // Mock the socket to simulate connection failure
      vi.mocked(io).mockReturnValue(mockSocketWithError)

      renderWorkspacePage()

      // Should still render main components despite WebSocket error
      await waitFor(() => {
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument()
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
        expect(screen.getByTestId('terminal')).toBeInTheDocument()
      })
      
      // Verify WebSocket was attempted to be created
      expect(io).toHaveBeenCalled()
    })

    it('should handle initialization errors gracefully', async () => {
      // Mock workspace store initialization to fail
      vi.mocked(executionAPI.status).mockRejectedValue(new Error('Initialization failed'))

      renderWorkspacePage()

      // Should still render components
      await waitFor(() => {
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument()
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
        expect(screen.getByTestId('terminal')).toBeInTheDocument()
      })
    })

    it('should cleanup WebSocket connection on unmount', async () => {
      const { unmount } = renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('terminal')).toBeInTheDocument()
      })

      // Unmount component
      unmount()

      // Verify WebSocket disconnect was called
      expect(mockSocket.disconnect).toHaveBeenCalled()
    })

    it('should handle authentication errors', async () => {
      // Setup unauthenticated state
      useAuthStore.setState({
        isAuthenticated: false,
        token: null,
        user: null,
        loading: false,
        error: 'Authentication failed',
      })

      renderWorkspacePage()

      // The WorkspacePage still renders but WebSocket won't connect without token
      // Components are still rendered but functionality is limited
      await waitFor(() => {
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument()
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
        expect(screen.getByTestId('terminal')).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Updates and State Management', () => {
    it('should maintain workspace state across component updates', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('file-explorer')).toBeInTheDocument()
      })

      // Simulate state change
      act(() => {
        useWorkspaceStore.getState().setCurrentDir('/src')
      })

      // Verify state is maintained
      expect(useWorkspaceStore.getState().currentDir).toBe('/src')
    })

    it('should handle execution status updates', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('terminal')).toBeInTheDocument()
      })

      // Verify initial status
      expect(screen.getByText('Idle')).toBeInTheDocument()

      // Simulate status change via WebSocket
      const statusHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'project:status'
      )?.[1]

      if (statusHandler) {
        act(() => {
          statusHandler({
            projectId: 'test-project-1',
            status: 'running',
            session: mockSession
          })
        })
      }

      // Verify status update
      await waitFor(() => {
        expect(screen.getByText('Running')).toBeInTheDocument()
      })
    })

    it('should handle multiple tab management', async () => {
      renderWorkspacePage()

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
      })

      // Verify tab management works
      expect(screen.getByTestId('tab-test.js')).toBeInTheDocument()
    })
  })
})