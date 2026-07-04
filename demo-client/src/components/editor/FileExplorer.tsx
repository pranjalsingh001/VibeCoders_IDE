// FileExplorer.tsx
// ----------------
// Enhanced file explorer with folder navigation and management actions

import { useEffect, useState } from 'react'
import { fileService } from '../../services/fileService'
import useWorkspaceStore from '../../stores/workspaceStore'
import { 
  FolderIcon, 
  DocumentIcon, 
  ChevronUpIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'

type Props = { projectId: string }

const FileExplorer = ({ projectId }: Props) => {
  const { files, setFiles, openTab, currentDir, setCurrentDir } = useWorkspaceStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: any } | null>(null)
  const [showNewFileModal, setShowNewFileModal] = useState(false)
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newItemName, setNewItemName] = useState('')

  useEffect(() => {
    const loadFiles = async () => {
      setLoading(true)
      try {
        const list = await fileService.list(projectId, currentDir)
        setFiles(list)
        setError(null)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    loadFiles()
  }, [projectId, currentDir, setFiles])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleClick = async (file: { name: string; type: 'file' | 'dir' }) => {
    if (file.type === 'dir') {
      // Navigate into directory
      const newDir = currentDir === '/' ? `/${file.name}` : `${currentDir}/${file.name}`
      setCurrentDir(newDir)
    } else {
      // Open file in tab
      const filePath = currentDir === '/' ? file.name : `${currentDir}/${file.name}`
      try {
        const content = await fileService.read(projectId, filePath)
        openTab(filePath, content)
      } catch (e: any) {
        setError(`Failed to open file: ${e.message}`)
      }
    }
  }

  const handleRightClick = (e: React.MouseEvent, file: any) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file
    })
  }

  const handleGoUp = () => {
    if (currentDir === '/') return
    const parts = currentDir.split('/').filter(Boolean)
    parts.pop()
    const newDir = parts.length > 0 ? '/' + parts.join('/') : '/'
    setCurrentDir(newDir)
  }

  const handleCreateFile = async () => {
    if (!newItemName.trim()) return
    
    try {
      const filePath = currentDir === '/' ? newItemName : `${currentDir}/${newItemName}`
      await fileService.write(projectId, filePath, '')
      
      // Refresh file list
      const list = await fileService.list(projectId, currentDir)
      setFiles(list)
      
      setShowNewFileModal(false)
      setNewItemName('')
    } catch (e: any) {
      setError(`Failed to create file: ${e.message}`)
    }
  }

  const handleCreateFolder = async () => {
    if (!newItemName.trim()) return
    
    try {
      const folderPath = currentDir === '/' ? newItemName : `${currentDir}/${newItemName}`
      await fileService.createFolder(projectId, folderPath)
      
      // Refresh file list
      const list = await fileService.list(projectId, currentDir)
      setFiles(list)
      
      setShowNewFolderModal(false)
      setNewItemName('')
    } catch (e: any) {
      setError(`Failed to create folder: ${e.message}`)
    }
  }

  const handleDeleteFile = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return
    
    try {
      const filePath = currentDir === '/' ? fileName : `${currentDir}/${fileName}`
      await fileService.delete(projectId, filePath)
      
      // Refresh file list
      const list = await fileService.list(projectId, currentDir)
      setFiles(list)
      
      setContextMenu(null)
    } catch (e: any) {
      setError(`Failed to delete file: ${e.message}`)
    }
  }

  const getFileIcon = (file: { name: string; type: 'file' | 'dir' }) => {
    if (file.type === 'dir') {
      return <FolderIcon className="w-4 h-4 text-blue-500" />
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase()
    const iconClass = "w-4 h-4"
    
    // Color code by file type
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

  return (
    <div className="bg-white border rounded-lg h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <h2 className="font-semibold text-gray-800">Explorer</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNewFileModal(true)}
            className="p-1 hover:bg-gray-200 rounded"
            title="New File"
          >
            <DocumentIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="p-1 hover:bg-gray-200 rounded"
            title="New Folder"
          >
            <FolderIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-3 py-2 text-sm text-gray-600 border-b">
        <div className="flex items-center gap-1">
          <span>📁</span>
          <span>{currentDir === '/' ? 'Root' : currentDir}</span>
          {currentDir !== '/' && (
            <button
              onClick={handleGoUp}
              className="ml-2 p-1 hover:bg-gray-100 rounded"
              title="Go Up"
            >
              <ChevronUpIcon className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading && (
          <div className="text-sm text-gray-500 p-2">Loading...</div>
        )}
        
        {error && (
          <div className="text-sm text-red-600 p-2 bg-red-50 rounded mb-2">
            {error}
          </div>
        )}
        
        <div className="space-y-1">
          {files.map((file) => (
            <div
              key={file.name}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer group"
              onClick={() => handleClick(file)}
              onContextMenu={(e) => handleRightClick(e, file)}
            >
              {getFileIcon(file)}
              <span className="flex-1 text-sm truncate">{file.name}</span>
              {file.size && (
                <span className="text-xs text-gray-400">
                  {(file.size / 1024).toFixed(1)}KB
                </span>
              )}
              <button
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRightClick(e, file)
                }}
              >
                <EllipsisVerticalIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border shadow-lg rounded-md py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => {
              // Handle rename
              setContextMenu(null)
            }}
          >
            <PencilIcon className="w-3 h-3" />
            Rename
          </button>
          <button
            className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
            onClick={() => handleDeleteFile(contextMenu.file.name)}
          >
            <TrashIcon className="w-3 h-3" />
            Delete
          </button>
        </div>
      )}

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-80">
            <h3 className="font-semibold mb-3">Create New File</h3>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Enter file name..."
              className="w-full p-2 border rounded mb-3"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowNewFileModal(false)
                  setNewItemName('')
                }}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFile}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-80">
            <h3 className="font-semibold mb-3">Create New Folder</h3>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Enter folder name..."
              className="w-full p-2 border rounded mb-3"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowNewFolderModal(false)
                  setNewItemName('')
                }}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileExplorer
