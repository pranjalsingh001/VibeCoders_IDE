import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import WorkspacePage from '../../../pages/WorkspacePage';
import * as fileService from '../../../services/fileService';
import * as executionService from '../../../services/executionService';

// Mock the services
vi.mock('../../../services/fileService');
vi.mock('../../../services/executionService');
vi.mock('../../../stores/authStore', () => ({
  default: vi.fn(() => ({ token: 'mock-token' }))
}));

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn()
  }))
}));

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ value, onChange }) => (
    <textarea 
      data-testid="monaco-editor"
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ))
}));

// Mock xterm
vi.mock('xterm', () => ({
  Terminal: vi.fn(() => ({
    loadAddon: vi.fn(),
    open: vi.fn(),
    writeln: vi.fn(),
    scrollToBottom: vi.fn(),
    dispose: vi.fn(),
    clear: vi.fn()
  }))
}));

vi.mock('xterm-addon-fit', () => ({
  FitAddon: vi.fn(() => ({
    fit: vi.fn()
  }))
}));

vi.mock('@xterm/addon-web-links', () => ({
  WebLinksAddon: vi.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  CodeBracketIcon: () => <div data-testid="code-bracket-icon" />,
  PlayIcon: () => <div data-testid="play-icon" />,
  StopIcon: () => <div data-testid="stop-icon" />,
  CogIcon: () => <div data-testid="cog-icon" />,
  EyeIcon: () => <div data-testid="eye-icon" />,
  ArrowPathIcon: () => <div data-testid="arrow-path-icon" />,
  FolderIcon: () => <div data-testid="folder-icon" />,
  DocumentIcon: () => <div data-testid="document-icon" />,
  ChevronUpIcon: () => <div data-testid="chevron-up-icon" />,
  PlusIcon: () => <div data-testid="plus-icon" />,
  TrashIcon: () => <div data-testid="trash-icon" />,
  PencilIcon: () => <div data-testid="pencil-icon" />,
  EllipsisVerticalIcon: () => <div data-testid="ellipsis-vertical-icon" />,
  XMarkIcon: () => <div data-testid="x-mark-icon" />,
  SparklesIcon: () => <div data-testid="sparkles-icon" />,
  CloudArrowUpIcon: () => <div data-testid="cloud-arrow-up-icon" />,
  CommandLineIcon: () => <div data-testid="command-line-icon" />,
  ExclamationTriangleIcon: () => <div data-testid="exclamation-triangle-icon" />
}));

const mockFileService = fileService as any;
const mockExecutionService = executionService as any;

describe('Enhanced Workspace Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock file service responses
    mockFileService.fileService = {
      list: vi.fn().mockResolvedValue([
        { name: 'src', type: 'dir' },
        { name: 'package.json', type: 'file' }
      ]),
      read: vi.fn().mockResolvedValue('// Mock file content'),
      write: vi.fn().mockResolvedValue(undefined),
      createFolder: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined)
    };
    
    // Mock execution service responses
    mockExecutionService.executionAPI = {
      status: vi.fn().mockResolvedValue({ session: null }),
      start: vi.fn().mockResolvedValue({ 
        success: true, 
        session: { port: 3000, url: 'http://localhost:3000' } 
      }),
      stop: vi.fn().mockResolvedValue({ success: true })
    };
  });

  const renderWorkspace = () => {
    return render(
      <BrowserRouter>
        <WorkspacePage />
      </BrowserRouter>
    );
  };

  it('renders enhanced workspace layout', async () => {
    renderWorkspace();
    
    // Check for main workspace elements
    expect(screen.getByText('Workspace')).toBeInTheDocument();
    expect(screen.getByText('Explorer')).toBeInTheDocument();
    expect(screen.getByText('Terminal')).toBeInTheDocument();
    expect(screen.getByText('Live Preview')).toBeInTheDocument();
  });

  it('displays auto-save toggle', async () => {
    renderWorkspace();
    
    await waitFor(() => {
      expect(screen.getByText(/Auto-save:/)).toBeInTheDocument();
    });
  });

  it('shows execution status indicator', async () => {
    renderWorkspace();
    
    await waitFor(() => {
      expect(screen.getByText('Idle')).toBeInTheDocument();
    });
  });

  it('displays file explorer with management actions', async () => {
    renderWorkspace();
    
    await waitFor(() => {
      expect(screen.getByText('Explorer')).toBeInTheDocument();
      // Check for new file/folder buttons (represented by icons)
      expect(screen.getByTestId('document-icon')).toBeInTheDocument();
      expect(screen.getByTestId('folder-icon')).toBeInTheDocument();
    });
  });

  it('shows enhanced terminal with controls', async () => {
    renderWorkspace();
    
    await waitFor(() => {
      expect(screen.getByText('Terminal')).toBeInTheDocument();
      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });
  });

  it('displays live preview section', async () => {
    renderWorkspace();
    
    await waitFor(() => {
      expect(screen.getByText('Live Preview')).toBeInTheDocument();
      expect(screen.getByText('No Preview Available')).toBeInTheDocument();
    });
  });

  it('handles start session action', async () => {
    renderWorkspace();
    
    await waitFor(() => {
      const startButton = screen.getByText('Start');
      fireEvent.click(startButton);
      expect(mockExecutionService.executionAPI.start).toHaveBeenCalled();
    });
  });

  it('shows AI assist functionality in editor', async () => {
    renderWorkspace();
    
    // The AI assist button should be present (represented by sparkles icon)
    await waitFor(() => {
      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
    });
  });
});