import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import WorkspacePage from './pages/WorkspacePage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './router/ProtectedRoute'
import WorkflowPage from './pages/WorkflowPage'
import { ToastContainer } from './components/ui/Toast'
import useUIStore from './stores/uiStore'
import { LoadingOverlay } from './components/ui/Loading'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { ConnectionIndicator } from './components/ui/ConnectionStatus'

// Import dev utilities in development mode
if (import.meta.env.DEV) {
  import('./utils/devUtils')
  import('./utils/apiTest')
  import('./utils/debugRoutes')
  import('./utils/workflowDebug')
}

const App = () => {
  const { globalLoading, loadingMessage } = useUIStore()
  
  // Restore user session on app load
  React.useEffect(() => {
    const restoreSession = async () => {
      const { default: useAuthStore } = await import('./stores/authStore')
      await useAuthStore.getState().restoreSession()
    }
    
    restoreSession()
  }, [])
  
  return (
    <ErrorBoundary>
      {/* Connection Status Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <ConnectionIndicator />
      </div>
      
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/workflow"
          element={
            <ProtectedRoute>
              <WorkflowPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/workspace"
          element={
            <ProtectedRoute>
              <WorkspacePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      
      {/* Global UI Components */}
      <ToastContainer />
      {globalLoading && <LoadingOverlay message={loadingMessage || undefined} />}
    </ErrorBoundary>
  )
}

export default App
