import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import FileExplorer from '../components/editor/FileExplorer';
import MonacoEditor from '../components/editor/MonacoEditor';
import XTerminal from '../components/editor/Terminal';
import { codegenAPI as codegenService } from '../services/codegenService';
import { fileService } from '../services/fileService';
import useWorkspaceStore from '../stores/workspaceStore';
import { executionAPI } from '../services/executionService';
import Button from '../components/ui/Button';
import useAuthStore from '../stores/authStore';
import { LogStream } from '../components/ui/LogStream';
import { WebSocketStatusIndicator } from '../components/ui/WebSocketStatus';
import { useWebSocket, useExecutionLogs } from '../hooks/useWebSocket';
import { ExecutionLogData } from '../services/websocket';
import { 
  CodeBracketIcon,
  PlayIcon,
  StopIcon,
  CogIcon,
  EyeIcon,
  ArrowPathIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';

const WorkspacePage = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const [genLoading, setGenLoading] = useState(false);
  const [planPreview, setPlanPreview] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [lastExecutionTime, setLastExecutionTime] = useState<string | null>(null);
  const [showLogStream, setShowLogStream] = useState(false);
  
  const { 
    setFiles, 
    currentDir, 
    initializeWorkspace,
    autoSaveEnabled,
    toggleAutoSave,
    openTabs
  } = useWorkspaceStore();
  const token = useAuthStore((s) => s.token);

  // Enhanced WebSocket integration
  const webSocket = useWebSocket({ 
    projectId: projectId || undefined, 
    autoConnect: true 
  });

  // Handle real-time execution logs
  const handleExecutionLog = useCallback((logData: ExecutionLogData) => {
    // Add to terminal logs for backward compatibility
    const formattedLog = `[${new Date(logData.timestamp).toLocaleTimeString()}] ${logData.message}`;
    setTerminalLogs(prev => [...prev, formattedLog]);

    // Update execution status based on log type
    if (logData.type === 'error' || logData.level === 'error') {
      setExecutionStatus('error');
      setLastExecutionTime(logData.timestamp);
    } else if (logData.type === 'info' && logData.message.includes('started')) {
      setExecutionStatus('running');
      setLastExecutionTime(logData.timestamp);
    } else if (logData.type === 'info' && logData.message.includes('stopped')) {
      setExecutionStatus('idle');
      setLastExecutionTime(logData.timestamp);
    }
  }, []);

  // Subscribe to execution logs
  useExecutionLogs(projectId || null, handleExecutionLog);

  useEffect(() => {
    // Initialize workspace and load existing session status
    const initializeAndLoadSession = async () => {
      if (!projectId) return;
      
      try {
        // Initialize workspace store
        await initializeWorkspace(projectId);
        
        // Load existing session status
        const res = await executionAPI.status(projectId);
        if (res?.session) {
          setSession(res.session);
          setExecutionStatus('running');
        }

        // Request execution logs from WebSocket service
        if (webSocket.isConnected) {
          await webSocket.requestExecutionLogs(projectId);
        }
      } catch (e) {
        console.warn('[Workspace] Initialization failed', e);
        setError('Failed to initialize workspace');
      }
    };
    
    initializeAndLoadSession();
  }, [projectId, token, initializeWorkspace]);

  // Helper: refresh file list and update workspace store
  const refreshFileList = async () => {
    if (!projectId) return;
    try {
      const listRes = await fileService.list(projectId, currentDir);
      setFiles(listRes);
      console.log('[Workspace] refreshed file list for dir', currentDir, listRes.length);
    } catch (e: any) {
      console.error('[Workspace] Failed to list files', e);
      setError(e.message || 'Failed to list files');
    }
  };

  // Code generation flow
  const generateCode = async (dryRun = false) => {
    if (!projectId) return;
    setGenLoading(true);
    setError(null);
    setPlanPreview(null);
    try {
      const planRes = await codegenService.createPlan(projectId);
      if (!planRes.success || !planRes.plan) {
        throw new Error('No plan returned');
      }

      setPlanPreview(planRes.plan);

      if (!dryRun) {
        const applyRes = await codegenService.applyPlan(projectId, { dryRun: false });
        if (!applyRes.success) {
          throw new Error('CodeGen apply failed');
        }
        await refreshFileList();
      }
    } catch (e: any) {
      console.error('[Workspace] Code generation failed', e);
      setError(e.message || 'Code generation failed');
    } finally {
      setGenLoading(false);
    }
  };

  const startProject = async () => {
    if (!projectId) { setError('Missing project ID'); return; }
    setStarting(true);
    setError(null);
    setExecutionStatus('running');
    setTerminalLogs(prev => [...prev, '🚀 Starting development session...']);
    
    try {
      const res = await executionAPI.start(projectId);
      
      if (res.success) {
        if (res.session) {
          setSession(res.session);
          setExecutionStatus('success');
          if (res.message === "Using existing session") {
            setTerminalLogs(prev => [...prev, '✅ Connected to existing running session']);
          } else {
            setTerminalLogs(prev => [...prev, `✅ Development server started on port ${res.session.port}`]);
            setTerminalLogs(prev => [...prev, `🌐 Live preview available at: ${res.session.url}`]);
          }
          setLastExecutionTime(new Date().toISOString());
        }
      } else {
        throw new Error(res.message || 'Failed to start session');
      }
    } catch (e: any) {
      console.error('[Workspace] Failed to start session', e);
      const errorMsg = e.response?.data?.message || e.message || 'Failed to start session';
      setError(errorMsg);
      setExecutionStatus('error');
      setTerminalLogs(prev => [...prev, `❌ Error: ${errorMsg}`]);
      setLastExecutionTime(new Date().toISOString());
    } finally {
      setStarting(false);
    }
  };

  const stopProject = async () => {
    if (!projectId) { setError('Missing project ID'); return; }
    setStopping(true);
    setError(null);
    setExecutionStatus('idle');
    setTerminalLogs(prev => [...prev, '🛑 Stopping development session...']);
    
    try {
      const res = await executionAPI.stop(projectId);
      console.log('[Workspace] Session stopped:', res);
      setSession(null);
      setExecutionStatus('idle');
      setTerminalLogs(prev => [...prev, '✅ Development session stopped successfully']);
      setLastExecutionTime(new Date().toISOString());
    } catch (e: any) {
      console.error('[Workspace] Failed to stop session', e);
      const errorMsg = e.message || 'Failed to stop development session';
      setError(errorMsg);
      setExecutionStatus('error');
      setTerminalLogs(prev => [...prev, `❌ Error: ${errorMsg}`]);
      setLastExecutionTime(new Date().toISOString());
    } finally {
      setStopping(false);
    }
  };

  const getExecutionStatusIcon = () => {
    switch (executionStatus) {
      case 'running':
        return <ArrowPathIcon className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <PlayIcon className="w-4 h-4 text-green-500" />;
      case 'error':
        return <StopIcon className="w-4 h-4 text-red-500" />;
      default:
        return <StopIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getExecutionStatusText = () => {
    switch (executionStatus) {
      case 'running':
        return 'Running';
      case 'success':
        return 'Ready';
      case 'error':
        return 'Error';
      default:
        return 'Idle';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <CodeBracketIcon className="w-6 h-6 text-blue-600" />
                Workspace
              </h1>
              <p className="text-sm text-gray-600">Project: {projectId}</p>
            </div>
            
            {/* WebSocket Status */}
            <WebSocketStatusIndicator projectId={projectId} />
            
            {/* Real-time Execution Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              {getExecutionStatusIcon()}
              <span className="text-sm font-medium text-gray-700">
                {getExecutionStatusText()}
              </span>
              {lastExecutionTime && (
                <span className="text-xs text-gray-500">
                  {new Date(lastExecutionTime).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Auto-save Toggle */}
            <button
              onClick={toggleAutoSave}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                autoSaveEnabled 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <CogIcon className="w-4 h-4" />
              Auto-save: {autoSaveEnabled ? 'ON' : 'OFF'}
            </button>

            {/* Log Stream Toggle */}
            <button
              onClick={() => setShowLogStream(!showLogStream)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showLogStream 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <CommandLineIcon className="w-4 h-4" />
              Real-time Logs: {showLogStream ? 'ON' : 'OFF'}
            </button>

            {/* Code Generation Controls */}
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => generateCode(false)} 
                disabled={genLoading}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <CodeBracketIcon className="w-4 h-4" />
                {genLoading ? 'Generating…' : 'Generate Code'}
              </Button>

              <Button 
                variant="secondary" 
                onClick={() => generateCode(true)} 
                disabled={genLoading}
                className="flex items-center gap-2"
              >
                <EyeIcon className="w-4 h-4" />
                Preview Plan
              </Button>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mx-6 mb-3 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            <div className="flex items-center gap-2">
              <StopIcon className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}

        {planPreview && (
          <div className="mx-6 mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <EyeIcon className="w-4 h-4 text-blue-600" />
              <strong className="text-blue-800">Code Generation Plan:</strong>
            </div>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {planPreview.files?.map((f: any, i: number) => (
                <li key={i} className="text-blue-700">
                  <code className="bg-blue-100 px-1 rounded font-mono">{f.path}</code>
                  {f.description && <span className="ml-2 text-blue-600">- {f.description}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Open Tabs Indicator */}
        {openTabs.length > 0 && (
          <div className="px-6 pb-3">
            <div className="text-xs text-gray-500">
              {openTabs.length} file{openTabs.length !== 1 ? 's' : ''} open
              {openTabs.some(tab => tab.isDirty) && (
                <span className="ml-2 text-orange-600">• Unsaved changes</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* Left Sidebar - Enhanced File Explorer */}
        <div className="w-80 flex-shrink-0">
          <FileExplorer projectId={projectId!} />
        </div>

        {/* Center - Enhanced Monaco Editor */}
        <div className="flex-1 min-w-0">
          <MonacoEditor projectId={projectId!} />
        </div>

        {/* Right Sidebar - Terminal & Live Preview */}
        <div className="w-96 flex-shrink-0 flex flex-col gap-4">
          {/* Enhanced Terminal or Real-time Log Stream */}
          <div className="flex-1 min-h-0">
            {showLogStream ? (
              <LogStream 
                projectId={projectId}
                className="h-full"
                autoScroll={true}
                showTimestamps={true}
                showSources={true}
              />
            ) : (
              <XTerminal 
                logs={terminalLogs}
                onStart={startProject}
                onStop={stopProject}
                session={session}
                starting={starting}
                stopping={stopping}
              />
            )}
          </div>

          {/* Enhanced Live Preview */}
          <div className="h-80 bg-white rounded-lg border shadow-sm flex flex-col">
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <EyeIcon className="w-4 h-4" />
                Live Preview
              </h3>
              {session?.url && (
                <a 
                  href={session.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Open in new tab
                </a>
              )}
            </div>
            
            <div className="flex-1">
              {session?.url ? (
                <iframe
                  title="live-preview"
                  src={session.url}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50">
                  <div className="text-center">
                    <EyeIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-medium">No Preview Available</p>
                    <p className="text-xs">Start a development session to view live preview</p>
                  </div>
                </div>
              )}
            </div>
            
            {session?.url && (
              <div className="px-3 py-2 border-t bg-gray-50 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Port: {session.port}</span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Live
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspacePage;