// pages/__tests__/DashboardPage.test.tsx
// ----------------------------------------
// Comprehensive tests for the enhanced Dashboard component
// Tests project filtering, search functionality, status badge rendering,
// navigation, and new project creation workflow

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import DashboardPage from '../DashboardPage'
import useProjectStore from '../../stores/projectStore'
import { vi } from 'vitest'

// Mock the project store
vi.mock('../../stores/projectStore')
const mockUseProjectStore = vi.mocked(useProjectStore)

// Mock the QueueMonitor component
vi.mock('../../components/QueueMonitor', () => ({
  QueueMonitor: () => <div data-testid="queue-monitor">Queue Monitor</div>
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock window.confirm for delete tests
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn()
})

const mockProjects = [
  {
    _id: '1',
    id: '1',
    name: 'E-commerce Website',
    idea: 'A modern e-commerce platform with React and Node.js',
    description: 'Full-stack e-commerce solution',
    userId: 'user1',
    status: 'planned' as const,
    currentStage: 'planning' as const,
    stageResults: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    owner: 'John Doe'
  },
  {
    _id: '2',
    id: '2',
    name: 'Task Manager App',
    idea: 'A collaborative task management application',
    description: 'Team productivity tool',
    userId: 'user1',
    status: 'in-progress' as const,
    currentStage: 'codegen' as const,
    stageResults: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    owner: 'Jane Smith'
  },
  {
    _id: '3',
    id: '3',
    name: 'Blog Platform',
    idea: 'A content management system for bloggers',
    description: 'CMS with rich text editor',
    userId: 'user1',
    status: 'blueprint-ready' as const,
    currentStage: 'blueprint' as const,
    stageResults: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
    owner: 'Bob Wilson'
  },
  {
    _id: '4',
    id: '4',
    name: 'Weather Dashboard',
    idea: 'Real-time weather monitoring dashboard',
    description: 'Weather data visualization',
    userId: 'user1',
    status: 'completed' as const,
    currentStage: 'completed' as const,
    stageResults: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
    owner: 'Alice Johnson'
  }
]

describe('DashboardPage', () => {
  const mockFetchProjects = vi.fn()
  const mockDeleteProject = vi.fn()
  const mockCreateProject = vi.fn()

  beforeEach(() => {
    mockUseProjectStore.mockReturnValue({
      projects: mockProjects,
      fetchProjects: mockFetchProjects,
      loading: false,
      error: null,
      deleteProject: mockDeleteProject,
      currentProject: null,
      createProject: mockCreateProject,
      updateProject: vi.fn(),
      setCurrentProject: vi.fn(),
      clearError: vi.fn()
    })
    
    mockNavigate.mockClear()
    mockFetchProjects.mockClear()
    mockDeleteProject.mockClear()
    mockCreateProject.mockClear()
    vi.mocked(window.confirm).mockClear()
  })

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )
  }

  describe('Basic Rendering', () => {
    it('renders dashboard with project list', () => {
      renderDashboard()
      
      expect(screen.getByText('Your Projects')).toBeInTheDocument()
      expect(screen.getByText('E-commerce Website')).toBeInTheDocument()
      expect(screen.getByText('Task Manager App')).toBeInTheDocument()
      expect(screen.getByText('Blog Platform')).toBeInTheDocument()
      expect(screen.getByText('Weather Dashboard')).toBeInTheDocument()
    })

    it('fetches projects on mount', () => {
      renderDashboard()
      expect(mockFetchProjects).toHaveBeenCalledTimes(1)
    })

    it('shows project statistics correctly', () => {
      renderDashboard()
      
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('total projects')).toBeInTheDocument()
      expect(screen.getAllByText('1')).toHaveLength(4) // Four projects with count 1 each
      expect(screen.getByText('planned')).toBeInTheDocument()
      expect(screen.getByText('blueprint ready')).toBeInTheDocument()
      expect(screen.getByText('in progress')).toBeInTheDocument()
      expect(screen.getByText('completed')).toBeInTheDocument()
    })
  })

  describe('Status Badge Rendering and Navigation', () => {
    it('displays correct status badges for each project', () => {
      renderDashboard()
      
      // Check for status badges (excluding filter dropdown options)
      const plannedBadges = screen.getAllByText('Planned').filter(el => 
        el.tagName === 'SPAN' && el.className.includes('bg-gray-100')
      )
      expect(plannedBadges).toHaveLength(1)
      
      const blueprintReadyBadges = screen.getAllByText('Blueprint Ready').filter(el => 
        el.tagName === 'SPAN' && el.className.includes('bg-purple-100')
      )
      expect(blueprintReadyBadges).toHaveLength(1)
      
      const inProgressBadges = screen.getAllByText('In Progress').filter(el => 
        el.tagName === 'SPAN' && el.className.includes('bg-blue-100')
      )
      expect(inProgressBadges).toHaveLength(1)
      
      const completedBadges = screen.getAllByText('Completed').filter(el => 
        el.tagName === 'SPAN' && el.className.includes('bg-green-100')
      )
      expect(completedBadges).toHaveLength(1)
    })

    it('shows correct project metadata', () => {
      renderDashboard()
      
      // Check stage names in project cards (using getAllByText since they appear in filters too)
      expect(screen.getAllByText('Planning')).toHaveLength(2) // One in filter, one in project card
      expect(screen.getAllByText('Blueprint')).toHaveLength(2) // One in filter, one in project card
      expect(screen.getAllByText('Code Generation')).toHaveLength(2) // One in filter, one in project card
      
      // Check owners
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    })

    it('navigates to workflow page when workflow button is clicked', () => {
      renderDashboard()
      
      const workflowButtons = screen.getAllByText('Workflow')
      fireEvent.click(workflowButtons[0])
      
      // Projects are sorted by updated date (desc), so Weather Dashboard (2024-01-05) appears first
      expect(mockNavigate).toHaveBeenCalledWith('/projects/4/workflow')
    })

    it('navigates to workspace page when workspace button is clicked', () => {
      renderDashboard()
      
      const workspaceButtons = screen.getAllByText('Workspace')
      fireEvent.click(workspaceButtons[1]) // Second project in sorted order
      
      expect(mockNavigate).toHaveBeenCalledWith('/projects/3/workspace')
    })

    it('handles project deletion with confirmation', async () => {
      vi.mocked(window.confirm).mockReturnValue(true)
      renderDashboard()
      
      const deleteButtons = screen.getAllByTitle('Delete project')
      fireEvent.click(deleteButtons[0])
      
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete the project "Weather Dashboard"? This action cannot be undone.'
      )
      expect(mockDeleteProject).toHaveBeenCalledWith('4')
    })

    it('cancels project deletion when user declines confirmation', () => {
      vi.mocked(window.confirm).mockReturnValue(false)
      renderDashboard()
      
      const deleteButtons = screen.getAllByTitle('Delete project')
      fireEvent.click(deleteButtons[0])
      
      expect(window.confirm).toHaveBeenCalled()
      expect(mockDeleteProject).not.toHaveBeenCalled()
    })
  })

  describe('Project Filtering and Search Functionality', () => {
    it('filters projects by search query - name', async () => {
      renderDashboard()
      
      const searchInput = screen.getByPlaceholderText('Search by name, idea, description, or owner...')
      await userEvent.type(searchInput, 'E-commerce')
      
      await waitFor(() => {
        expect(screen.getByText('E-commerce Website')).toBeInTheDocument()
        expect(screen.queryByText('Task Manager App')).not.toBeInTheDocument()
        expect(screen.queryByText('Blog Platform')).not.toBeInTheDocument()
        expect(screen.queryByText('Weather Dashboard')).not.toBeInTheDocument()
      })
    })

    it('filters projects by search query - idea', async () => {
      renderDashboard()
      
      const searchInput = screen.getByPlaceholderText('Search by name, idea, description, or owner...')
      await userEvent.type(searchInput, 'collaborative task')
      
      await waitFor(() => {
        expect(screen.getByText('Task Manager App')).toBeInTheDocument()
        expect(screen.queryByText('E-commerce Website')).not.toBeInTheDocument()
        expect(screen.queryByText('Blog Platform')).not.toBeInTheDocument()
        expect(screen.queryByText('Weather Dashboard')).not.toBeInTheDocument()
      })
    })

    it('filters projects by search query - owner', async () => {
      renderDashboard()
      
      const searchInput = screen.getByPlaceholderText('Search by name, idea, description, or owner...')
      await userEvent.type(searchInput, 'John Doe')
      
      await waitFor(() => {
        expect(screen.getByText('E-commerce Website')).toBeInTheDocument()
        expect(screen.queryByText('Task Manager App')).not.toBeInTheDocument()
        expect(screen.queryByText('Blog Platform')).not.toBeInTheDocument()
        expect(screen.queryByText('Weather Dashboard')).not.toBeInTheDocument()
      })
    })

    it('filters projects by status', async () => {
      renderDashboard()
      
      const statusFilter = screen.getByDisplayValue('All Statuses')
      await userEvent.selectOptions(statusFilter, 'planned')
      
      await waitFor(() => {
        expect(screen.getByText('E-commerce Website')).toBeInTheDocument()
        expect(screen.queryByText('Task Manager App')).not.toBeInTheDocument()
        expect(screen.queryByText('Blog Platform')).not.toBeInTheDocument()
        expect(screen.queryByText('Weather Dashboard')).not.toBeInTheDocument()
      })
    })

    it('filters projects by stage', async () => {
      renderDashboard()
      
      const stageFilter = screen.getByDisplayValue('All Stages')
      await userEvent.selectOptions(stageFilter, 'blueprint')
      
      await waitFor(() => {
        expect(screen.getByText('Blog Platform')).toBeInTheDocument()
        expect(screen.queryByText('E-commerce Website')).not.toBeInTheDocument()
        expect(screen.queryByText('Task Manager App')).not.toBeInTheDocument()
        expect(screen.queryByText('Weather Dashboard')).not.toBeInTheDocument()
      })
    })

    it('sorts projects by name', async () => {
      renderDashboard()
      
      const sortSelect = screen.getByDisplayValue('Last Updated')
      await userEvent.selectOptions(sortSelect, 'name')
      
      await waitFor(() => {
        const projectCards = screen.getAllByRole('heading', { level: 3 })
        expect(projectCards[0]).toHaveTextContent('Blog Platform')
        expect(projectCards[1]).toHaveTextContent('E-commerce Website')
        expect(projectCards[2]).toHaveTextContent('Task Manager App')
        expect(projectCards[3]).toHaveTextContent('Weather Dashboard')
      })
    })

    it('sorts projects by creation date', async () => {
      renderDashboard()
      
      const sortSelect = screen.getByDisplayValue('Last Updated')
      await userEvent.selectOptions(sortSelect, 'created')
      
      await waitFor(() => {
        // All projects have same creation date, so order should be consistent
        const projectCards = screen.getAllByRole('heading', { level: 3 })
        expect(projectCards).toHaveLength(4)
      })
    })

    it('combines search and filter criteria', async () => {
      renderDashboard()
      
      const searchInput = screen.getByPlaceholderText('Search by name, idea, description, or owner...')
      const statusFilter = screen.getByDisplayValue('All Statuses')
      
      await userEvent.type(searchInput, 'App')
      await userEvent.selectOptions(statusFilter, 'in-progress')
      
      await waitFor(() => {
        expect(screen.getByText('Task Manager App')).toBeInTheDocument()
        expect(screen.queryByText('E-commerce Website')).not.toBeInTheDocument()
        expect(screen.queryByText('Blog Platform')).not.toBeInTheDocument()
        expect(screen.queryByText('Weather Dashboard')).not.toBeInTheDocument()
      })
    })

    it('shows empty state when no projects match filters', async () => {
      renderDashboard()
      
      const searchInput = screen.getByPlaceholderText('Search by name, idea, description, or owner...')
      await userEvent.type(searchInput, 'nonexistent project')
      
      await waitFor(() => {
        expect(screen.getByText('No projects match your filters')).toBeInTheDocument()
        expect(screen.getByText('Try adjusting your search or filter criteria')).toBeInTheDocument()
      })
    })

    it('clears search results when search is cleared', async () => {
      renderDashboard()
      
      const searchInput = screen.getByPlaceholderText('Search by name, idea, description, or owner...')
      await userEvent.type(searchInput, 'E-commerce')
      
      await waitFor(() => {
        expect(screen.getByText('E-commerce Website')).toBeInTheDocument()
        expect(screen.queryByText('Task Manager App')).not.toBeInTheDocument()
      })
      
      await userEvent.clear(searchInput)
      
      await waitFor(() => {
        expect(screen.getByText('E-commerce Website')).toBeInTheDocument()
        expect(screen.getByText('Task Manager App')).toBeInTheDocument()
        expect(screen.getByText('Blog Platform')).toBeInTheDocument()
        expect(screen.getByText('Weather Dashboard')).toBeInTheDocument()
      })
    })
  })

  describe('New Project Creation Workflow', () => {
    it('opens create project modal when new project button is clicked', () => {
      renderDashboard()
      
      const newProjectButton = screen.getByText('+ New Project')
      fireEvent.click(newProjectButton)
      
      expect(screen.getByText('Create New Project')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('e.g., Task Manager App, E-commerce Website')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('e.g., A web app to help teams manage tasks with real-time collaboration')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Any specific requirements, target audience, or technical preferences...')).toBeInTheDocument()
    })

    it('shows create project modal form fields', async () => {
      renderDashboard()
      
      // Open modal
      const newProjectButton = screen.getByText('+ New Project')
      fireEvent.click(newProjectButton)
      
      // Wait for modal to be fully rendered
      await waitFor(() => {
        expect(screen.getByText('Create New Project')).toBeInTheDocument()
      })
      
      // Verify form fields are present
      expect(screen.getByPlaceholderText('e.g., Task Manager App, E-commerce Website')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('e.g., A web app to help teams manage tasks with real-time collaboration')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Any specific requirements, target audience, or technical preferences...')).toBeInTheDocument()
      expect(screen.getByText('Create Project')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('validates required project name', async () => {
      renderDashboard()
      
      // Open modal
      const newProjectButton = screen.getByText('+ New Project')
      fireEvent.click(newProjectButton)
      
      // Wait for modal to be fully rendered
      await waitFor(() => {
        expect(screen.getByText('Create New Project')).toBeInTheDocument()
      })
      
      // Enter some text then clear it to trigger validation
      const nameInput = screen.getByPlaceholderText('e.g., Task Manager App, E-commerce Website')
      await userEvent.type(nameInput, 'test')
      await userEvent.clear(nameInput)
      
      // Blur the input to trigger validation
      fireEvent.blur(nameInput)
      
      // Try to submit without name
      const createButton = screen.getByText('Create Project')
      fireEvent.click(createButton)
      
      // The form should not submit without a valid name
      expect(mockCreateProject).not.toHaveBeenCalled()
    })

    it('validates minimum project name length', async () => {
      renderDashboard()
      
      // Open modal
      const newProjectButton = screen.getByText('+ New Project')
      fireEvent.click(newProjectButton)
      
      // Wait for modal to be fully rendered
      await waitFor(() => {
        expect(screen.getByText('Create New Project')).toBeInTheDocument()
      })
      
      // Enter short name using placeholder text to find input
      const nameInput = screen.getByPlaceholderText('e.g., Task Manager App, E-commerce Website')
      await userEvent.type(nameInput, 'AB')
      
      // Blur to trigger validation
      fireEvent.blur(nameInput)
      
      await waitFor(() => {
        expect(screen.getByText('Project name must be at least 3 characters')).toBeInTheDocument()
      })
    })

    it('handles project creation error', async () => {
      mockCreateProject.mockRejectedValue(new Error('Creation failed'))
      renderDashboard()
      
      // Open modal
      const newProjectButton = screen.getByText('+ New Project')
      fireEvent.click(newProjectButton)
      
      // Fill and submit form using placeholder text to find input
      const nameInput = screen.getByPlaceholderText('e.g., Task Manager App, E-commerce Website')
      await userEvent.type(nameInput, 'Test Project')
      
      const createButton = screen.getByText('Create Project')
      fireEvent.click(createButton)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create project. Please try again.')).toBeInTheDocument()
      })
    })

    it('closes modal when cancel is clicked', () => {
      renderDashboard()
      
      // Open modal
      const newProjectButton = screen.getByText('+ New Project')
      fireEvent.click(newProjectButton)
      
      expect(screen.getByText('Create New Project')).toBeInTheDocument()
      
      // Close modal
      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)
      
      expect(screen.queryByText('Create New Project')).not.toBeInTheDocument()
    })

    it('shows create first project button when no projects exist', () => {
      mockUseProjectStore.mockReturnValue({
        projects: [],
        fetchProjects: mockFetchProjects,
        loading: false,
        error: null,
        deleteProject: mockDeleteProject,
        currentProject: null,
        createProject: mockCreateProject,
        updateProject: vi.fn(),
        setCurrentProject: vi.fn(),
        clearError: vi.fn()
      })
      
      renderDashboard()
      
      expect(screen.getByText('No projects yet')).toBeInTheDocument()
      expect(screen.getByText('Create Your First Project')).toBeInTheDocument()
    })
  })

  describe('Loading and Error States', () => {
    it('shows loading state', () => {
      mockUseProjectStore.mockReturnValue({
        projects: [],
        fetchProjects: mockFetchProjects,
        loading: true,
        error: null,
        deleteProject: mockDeleteProject,
        currentProject: null,
        createProject: mockCreateProject,
        updateProject: vi.fn(),
        setCurrentProject: vi.fn(),
        clearError: vi.fn()
      })
      
      renderDashboard()
      
      expect(screen.getByText('Loading projects...')).toBeInTheDocument()
      // Check for loading spinner by class
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('shows error state', () => {
      mockUseProjectStore.mockReturnValue({
        projects: [],
        fetchProjects: mockFetchProjects,
        loading: false,
        error: 'Failed to load projects',
        deleteProject: mockDeleteProject,
        currentProject: null,
        createProject: mockCreateProject,
        updateProject: vi.fn(),
        setCurrentProject: vi.fn(),
        clearError: vi.fn()
      })
      
      renderDashboard()
      
      expect(screen.getByText('Failed to load projects')).toBeInTheDocument()
    })

    it('handles delete project error gracefully', async () => {
      mockDeleteProject.mockRejectedValue(new Error('Delete failed'))
      vi.mocked(window.confirm).mockReturnValue(true)
      
      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      
      renderDashboard()
      
      const deleteButtons = screen.getAllByTitle('Delete project')
      fireEvent.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to delete project. Please try again.')
      })
      
      alertSpy.mockRestore()
    })
  })

  describe('Queue Monitor Integration', () => {
    it('toggles queue monitor visibility', () => {
      renderDashboard()
      
      expect(screen.queryByTestId('queue-monitor')).not.toBeInTheDocument()
      
      const toggleButton = screen.getByText('Show Queue Monitor')
      fireEvent.click(toggleButton)
      
      expect(screen.getByTestId('queue-monitor')).toBeInTheDocument()
      expect(screen.getByText('Hide Queue Monitor')).toBeInTheDocument()
      
      fireEvent.click(screen.getByText('Hide Queue Monitor'))
      
      expect(screen.queryByTestId('queue-monitor')).not.toBeInTheDocument()
      expect(screen.getByText('Show Queue Monitor')).toBeInTheDocument()
    })
  })
})