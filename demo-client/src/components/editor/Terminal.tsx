import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import 'xterm/css/xterm.css';
import { sanitizeLogData } from '../../utils/logSanitizer';
import { 
  PlayIcon, 
  StopIcon, 
  TrashIcon,
  ArrowPathIcon,
  CommandLineIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

type Props = {
  logs: string[];
  onStart: () => void;
  onStop: () => void;
  session: any | null;
  starting: boolean;
  stopping: boolean;
};

const XTerminal = ({ logs, onStart, onStop, session, starting, stopping }: Props) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const webLinksAddon = useRef<WebLinksAddon | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [logCount, setLogCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal with enhanced settings
    terminal.current = new Terminal({
      theme: {
        background: '#1a1a1a',
        foreground: '#e0e0e0',
        cursor: '#00ff41',
        cursorAccent: '#1a1a1a',
        black: '#1a1a1a',
        red: '#ff6b6b',
        green: '#51cf66',
        yellow: '#ffd43b',
        blue: '#74c0fc',
        magenta: '#f06292',
        cyan: '#4dd0e1',
        white: '#e0e0e0',
        brightBlack: '#495057',
        brightRed: '#ff8a80',
        brightGreen: '#69f0ae',
        brightYellow: '#ffff8d',
        brightBlue: '#82b1ff',
        brightMagenta: '#ff80ab',
        brightCyan: '#84ffff',
        brightWhite: '#ffffff'
      },
      fontSize: 13,
      fontFamily: 'JetBrains Mono, Monaco, Menlo, "Ubuntu Mono", monospace',
      fontWeight: 'normal',
      cursorBlink: true,
      allowProposedApi: true,
      convertEol: true,
      disableStdin: true,
      scrollback: 1000,
      tabStopWidth: 4
    });

    // Add addons
    fitAddon.current = new FitAddon();
    webLinksAddon.current = new WebLinksAddon();
    
    terminal.current.loadAddon(fitAddon.current);
    terminal.current.loadAddon(webLinksAddon.current);
    terminal.current.open(terminalRef.current);

    // Fit terminal to container
    if (fitAddon.current) {
      fitAddon.current.fit();
    }

    // Add welcome message with styling
    terminal.current.writeln('\x1b[1;32m🚀 VibeCoders IDE Terminal\x1b[0m');
    terminal.current.writeln('\x1b[90m─────────────────────────────────────\x1b[0m');
    terminal.current.writeln('\x1b[36mReady for development session\x1b[0m');
    terminal.current.writeln('');

    // Handle terminal resize
    const handleResize = () => {
      if (fitAddon.current) {
        try {
          fitAddon.current.fit();
        } catch (error) {
          console.warn('Terminal resize failed:', error);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Resize observer for container changes (with fallback for test environments)
    let resizeObserver: ResizeObserver | null = null;
    
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        setTimeout(handleResize, 100);
      });
      
      if (terminalRef.current) {
        resizeObserver.observe(terminalRef.current);
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
      terminal.current?.dispose();
    };
  }, []);

  // Enhanced log processing with better formatting
  useEffect(() => {
    if (!terminal.current || logs.length === 0) return;

    const lastLog = logs[logs.length - 1];
    setLogCount(prev => prev + 1);
    
    try {
      const sanitizedLog = sanitizeLogData(lastLog);
      if (!sanitizedLog.trim()) return;

      // Parse log level and apply colors
      let formattedLog = sanitizedLog;
      
      // Error detection and coloring
      if (sanitizedLog.toLowerCase().includes('error') || 
          sanitizedLog.toLowerCase().includes('failed') ||
          sanitizedLog.toLowerCase().includes('exception')) {
        formattedLog = `\x1b[1;31m${sanitizedLog}\x1b[0m`; // Bright red
        setErrorCount(prev => prev + 1);
      } else if (sanitizedLog.toLowerCase().includes('warning') || 
                 sanitizedLog.toLowerCase().includes('warn')) {
        formattedLog = `\x1b[1;33m${sanitizedLog}\x1b[0m`; // Bright yellow
      } else if (sanitizedLog.toLowerCase().includes('success') || 
                 sanitizedLog.toLowerCase().includes('completed') ||
                 sanitizedLog.includes('✅')) {
        formattedLog = `\x1b[1;32m${sanitizedLog}\x1b[0m`; // Bright green
      } else if (sanitizedLog.includes('🚀') || sanitizedLog.includes('Starting')) {
        formattedLog = `\x1b[1;36m${sanitizedLog}\x1b[0m`; // Bright cyan
      } else if (sanitizedLog.includes('http://') || sanitizedLog.includes('https://')) {
        // URLs will be automatically linked by WebLinksAddon
        formattedLog = `\x1b[94m${sanitizedLog}\x1b[0m`; // Light blue
      }
      
      terminal.current.writeln(formattedLog);
      
      // Auto-scroll to bottom
      terminal.current.scrollToBottom();
      
    } catch (error) {
      console.warn('Failed to write to terminal:', error);
      terminal.current.writeln(`\x1b[90m[LOG ERROR] ${lastLog.replace(/[\x00-\x1F\x7F]/g, '')}\x1b[0m`);
    }
  }, [logs]);

  // Connection status monitoring
  useEffect(() => {
    const checkConnection = () => {
      // Simple connection check - in real app, this would ping the server
      setIsConnected(navigator.onLine);
    };

    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    
    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  const clearTerminal = () => {
    if (terminal.current) {
      terminal.current.clear();
      setLogCount(0);
      setErrorCount(0);
      
      // Re-add welcome message
      terminal.current.writeln('\x1b[1;32m🚀 VibeCoders IDE Terminal\x1b[0m');
      terminal.current.writeln('\x1b[90m─────────────────────────────────────\x1b[0m');
      terminal.current.writeln('\x1b[36mTerminal cleared\x1b[0m');
      terminal.current.writeln('');
    }
  };

  const getStatusColor = () => {
    if (!isConnected) return 'bg-gray-500';
    if (session) return 'bg-green-500';
    if (starting || stopping) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (session) return `Active (Port: ${session.port})`;
    if (starting) return 'Starting...';
    if (stopping) return 'Stopping...';
    return 'Inactive';
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden border">
      {/* Enhanced Terminal Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
            <CommandLineIcon className="w-4 h-4 text-gray-300" />
            <span className="text-white text-sm font-medium">Terminal</span>
          </div>
          
          <div className="text-xs text-gray-400">
            {getStatusText()}
          </div>
          
          {errorCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-red-400">
              <ExclamationTriangleIcon className="w-3 h-3" />
              <span>{errorCount} errors</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={clearTerminal}
            className="p-1.5 hover:bg-gray-700 rounded text-gray-300 hover:text-white"
            title="Clear Terminal"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
          
          <div className="w-px h-4 bg-gray-600" />
          
          <button
            onClick={onStart}
            disabled={starting || !!session}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
          >
            {starting ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
            {starting ? 'Starting...' : 'Start'}
          </button>
          
          <button
            onClick={onStop}
            disabled={stopping || !session}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
          >
            {stopping ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <StopIcon className="w-4 h-4" />
            )}
            {stopping ? 'Stopping...' : 'Stop'}
          </button>
        </div>
      </div>

      {/* Terminal Container */}
      <div className="flex-1 relative">
        <div 
          ref={terminalRef} 
          className="absolute inset-0 p-2"
          style={{ 
            background: 'linear-gradient(135deg, #1a1a1a 0%, #1e1e1e 100%)'
          }}
        />
        
        {/* Connection Status Overlay */}
        {!isConnected && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white">
              <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="font-medium">Connection Lost</p>
              <p className="text-sm text-gray-300">Check your internet connection</p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Status Bar */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-1.5 border-t border-gray-700 text-xs">
        <div className="flex items-center gap-4 text-gray-400">
          <span>Logs: {logCount}</span>
          {errorCount > 0 && (
            <span className="text-red-400">Errors: {errorCount}</span>
          )}
          <span>Encoding: UTF-8</span>
        </div>
        
        <div className="flex items-center gap-4 text-gray-400">
          {session?.url && (
            <span>
              Preview: 
              <a 
                href={session.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 ml-1 underline"
              >
                {session.url}
              </a>
            </span>
          )}
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      </div>
    </div>
  );
};

export default XTerminal;
