// MonacoEditor.tsx
// ----------------
// Enhanced Monaco editor with file tabs, syntax highlighting, and auto-save

import { useEffect, useRef, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import useWorkspaceStore from '../../stores/workspaceStore'
import { fileService } from '../../services/fileService'
import { 
  XMarkIcon, 
  DocumentIcon,
  SparklesIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'

type Props = { projectId: string }

const MonacoEditor = ({ projectId }: Props) => {
  const {
    openTabs,
    activeTabId,
    activeFile,
    fileContent,
    autoSaveEnabled,
    aiAssistVisible,
    closeTab,
    setActiveTab,
    updateTabContent,
    markTabDirty,
    toggleAIAssist
  } = useWorkspaceStore()

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  const editorRef = useRef<any>(null)

  const activeTab = openTabs.find(tab => tab.id === activeTabId)

  // Auto-save functionality
  const autoSave = useCallback(async (tabId: string, content: string, filePath: string) => {
    if (!autoSaveEnabled) return
    
    try {
      await fileService.write(projectId, filePath, content)
      markTabDirty(tabId, false)
      console.log(`[AutoSave] Saved ${filePath}`)
    } catch (e) {
      console.error('[AutoSave Error]', e)
    }
  }, [projectId, autoSaveEnabled, markTabDirty])

  // Handle content changes with auto-save debouncing
  const handleChange = useCallback((value: string | undefined) => {
    if (value === undefined || !activeTab) return
    
    updateTabContent(activeTab.id, value)
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    // Set new auto-save timeout
    if (autoSaveEnabled) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave(activeTab.id, value, activeTab.filePath)
      }, 2000) // 2 second delay
    }
  }, [activeTab, updateTabContent, autoSave, autoSaveEnabled])

  // Manual save
  const handleSave = async () => {
    if (!activeTab) return
    
    try {
      await fileService.write(projectId, activeTab.filePath, activeTab.content)
      markTabDirty(activeTab.id, false)
      
      // Clear auto-save timeout since we just saved
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    } catch (e) {
      console.error('[Manual Save Error]', e)
    }
  }

  // Save all tabs
  const handleSaveAll = async () => {
    const dirtyTabs = openTabs.filter(tab => tab.isDirty)
    
    for (const tab of dirtyTabs) {
      try {
        await fileService.write(projectId, tab.filePath, tab.content)
        markTabDirty(tab.id, false)
      } catch (e) {
        console.error(`[Save All Error] ${tab.filePath}:`, e)
      }
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault()
          if (e.shiftKey) {
            handleSaveAll()
          } else {
            handleSave()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeTab])

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    const iconClass = "w-3 h-3"
    
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext || '')) {
      return <DocumentIcon className={`${iconClass} text-yellow-500`} />
    } else if (['py'].includes(ext || '')) {
      return <DocumentIcon className={`${iconClass} text-green-500`} />
    } else if (['html', 'css', 'scss'].includes(ext || '')) {
      return <DocumentIcon className={`${iconClass} text-purple-500`} />
    } else if (['json', 'yaml', 'yml'].includes(ext || '')) {
      return <DocumentIcon className={`${iconClass} text-orange-500`} />
    }
    
    return <DocumentIcon className={`${iconClass} text-gray-500`} />
  }

  if (openTabs.length === 0) {
    return (
      <div className="h-full border rounded-lg flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <DocumentIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p className="text-lg font-medium">No files open</p>
          <p className="text-sm">Select a file from the explorer to start editing</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full border rounded-lg overflow-hidden flex flex-col bg-white">
      {/* Tab Bar */}
      <div className="flex items-center bg-gray-100 border-b overflow-x-auto">
        <div className="flex">
          {openTabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-3 py-2 border-r cursor-pointer min-w-0 ${
                tab.id === activeTabId
                  ? 'bg-white border-b-2 border-blue-500'
                  : 'hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {getFileIcon(tab.fileName)}
              <span className="text-sm truncate max-w-32">
                {tab.fileName}
                {tab.isDirty && <span className="text-orange-500 ml-1">●</span>}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
                className="p-0.5 hover:bg-gray-300 rounded"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        
        {/* Editor Actions */}
        <div className="flex items-center gap-2 ml-auto px-3">
          <button
            onClick={toggleAIAssist}
            className={`p-1.5 rounded text-sm flex items-center gap-1 ${
              aiAssistVisible 
                ? 'bg-purple-100 text-purple-700' 
                : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="AI Assist"
          >
            <SparklesIcon className="w-4 h-4" />
          </button>
          
          {openTabs.some(tab => tab.isDirty) && (
            <button
              onClick={handleSaveAll}
              className="p-1.5 hover:bg-gray-200 rounded text-sm flex items-center gap-1 text-gray-600"
              title="Save All (Ctrl+Shift+S)"
            >
              <CloudArrowUpIcon className="w-4 h-4" />
            </button>
          )}
          
          <div className="text-xs text-gray-500">
            {autoSaveEnabled ? 'Auto-save: ON' : 'Auto-save: OFF'}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          theme="vs-dark"
          language={activeTab?.language || 'plaintext'}
          value={activeTab?.content || ''}
          onChange={handleChange}
          onMount={(editor) => {
            editorRef.current = editor
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true
            }
          }}
        />
        
        {/* AI Assist Panel */}
        {aiAssistVisible && (
          <div className="absolute top-0 right-0 w-80 h-full bg-white border-l shadow-lg">
            <div className="p-4 border-b bg-purple-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-purple-800 flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" />
                  AI Assist
                </h3>
                <button
                  onClick={toggleAIAssist}
                  className="p-1 hover:bg-purple-200 rounded"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                <button className="w-full p-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded border">
                  💡 Explain this code
                </button>
                <button className="w-full p-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded border">
                  🔧 Suggest improvements
                </button>
                <button className="w-full p-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded border">
                  🐛 Find potential bugs
                </button>
                <button className="w-full p-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded border">
                  📝 Add comments
                </button>
                <button className="w-full p-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded border">
                  🧪 Generate tests
                </button>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
                <p className="font-medium mb-1">💡 Tip</p>
                <p>Select code in the editor to get context-specific suggestions.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-gray-100 border-t text-xs text-gray-600">
        <div className="flex items-center gap-4">
          {activeTab && (
            <>
              <span>{activeTab.language}</span>
              <span>UTF-8</span>
              <span>LF</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {activeTab?.isDirty && (
            <span className="text-orange-600">Unsaved changes</span>
          )}
          <span>Ln 1, Col 1</span>
        </div>
      </div>
    </div>
  )
}

export default MonacoEditor
