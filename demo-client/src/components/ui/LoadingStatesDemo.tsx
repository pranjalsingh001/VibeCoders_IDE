// LoadingStatesDemo.tsx
// ---------------------
// Comprehensive demo showcasing all loading states and UI polish improvements
// This component demonstrates the enhanced UX features implemented in task 10

import React, { useState, useEffect } from 'react'
import { 
  WorkflowSkeleton, 
  PlanningSkeleton, 
  AIResponseSkeleton, 
  CodeGenSkeleton,
  OperationLoading,
  ProgressBar
} from './Loading'
import { 
  CircularProgress, 
  StepProgress, 
  AnimatedCounter, 
  PulsingDot, 
  LoadingDots 
} from './ProgressIndicator'
import { 
  AnimationWrapper, 
  StaggeredList, 
  FadeTransition, 
  SlideTransition,
  PulseEffect
} from './AnimationWrapper'
import { Button } from './Button'
import Card from './Card'
import { ToastContainer } from './Toast'
import useUIStore from '../../stores/uiStore'

export const LoadingStatesDemo: React.FC = () => {
  const [progress, setProgress] = useState(0)
  const [showTransition, setShowTransition] = useState(true)
  const [currentDemo, setCurrentDemo] = useState<'skeletons' | 'progress' | 'animations' | 'interactions'>('skeletons')
  const { addToast } = useUIStore()

  // Simulate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 1))
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const steps = [
    { id: '1', label: 'Initialize project', status: 'completed' as const },
    { id: '2', label: 'Generate blueprint', status: 'completed' as const },
    { id: '3', label: 'Create files', status: 'active' as const },
    { id: '4', label: 'Validate code', status: 'pending' as const },
    { id: '5', label: 'Deploy project', status: 'pending' as const }
  ]

  const demoItems = [
    'Enhanced skeleton loading states',
    'Smooth workflow transitions', 
    'Progress indicators with animations',
    'Toast notifications with micro-interactions',
    'Button hover effects and press animations',
    'Card components with lift effects'
  ]

  const showToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: 'Operation completed successfully!',
      error: 'Something went wrong. Please try again.',
      warning: 'Please review your settings before continuing.',
      info: 'New features are now available in the dashboard.'
    }
    
    addToast({
      type,
      message: messages[type],
      actions: type === 'error' ? [
        { label: 'Retry', onClick: () => console.log('Retry clicked') },
        { label: 'Report', onClick: () => console.log('Report clicked'), variant: 'secondary' }
      ] : undefined
    })
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <AnimationWrapper animation="slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-4">
            Loading States & UI Polish Demo
          </h1>
          <p className="text-lg text-secondary-600">
            Showcasing enhanced UX improvements for VibeCoders IDE
          </p>
        </div>
      </AnimationWrapper>

      {/* Demo Navigation */}
      <Card className="mb-8">
        <div className="flex flex-wrap gap-3 justify-center">
          {[
            { key: 'skeletons', label: 'Skeleton Loading' },
            { key: 'progress', label: 'Progress Indicators' },
            { key: 'animations', label: 'Animations' },
            { key: 'interactions', label: 'Micro-interactions' }
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={currentDemo === key ? 'primary' : 'outline'}
              onClick={() => setCurrentDemo(key as any)}
            >
              {label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Skeleton Loading Demo */}
      <FadeTransition show={currentDemo === 'skeletons'}>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-secondary-900">Skeleton Loading States</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-medium mb-4">Workflow Skeleton</h3>
              <WorkflowSkeleton />
            </Card>
            
            <Card>
              <h3 className="text-lg font-medium mb-4">Planning Skeleton</h3>
              <PlanningSkeleton />
            </Card>
            
            <Card>
              <h3 className="text-lg font-medium mb-4">AI Response Skeleton</h3>
              <AIResponseSkeleton type="blueprint" />
            </Card>
            
            <Card>
              <h3 className="text-lg font-medium mb-4">CodeGen Skeleton</h3>
              <CodeGenSkeleton />
            </Card>
          </div>

          <Card>
            <h3 className="text-lg font-medium mb-4">Operation Loading States</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <OperationLoading operation="generating" message="Generating components..." />
              <OperationLoading operation="parsing" message="Parsing AI response..." />
              <OperationLoading operation="validating" message="Validating files..." />
              <OperationLoading operation="saving" message="Saving changes..." />
            </div>
          </Card>
        </div>
      </FadeTransition>

      {/* Progress Indicators Demo */}
      <FadeTransition show={currentDemo === 'progress'}>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-secondary-900">Progress Indicators</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-medium mb-4">Circular Progress</h3>
              <div className="flex justify-around items-center">
                <CircularProgress progress={progress} size="sm" />
                <CircularProgress progress={progress} size="md" color="success" />
                <CircularProgress progress={progress} size="lg" color="warning" />
                <CircularProgress progress={progress} size="xl" color="error" />
              </div>
            </Card>
            
            <Card>
              <h3 className="text-lg font-medium mb-4">Step Progress</h3>
              <StepProgress steps={steps} />
            </Card>
            
            <Card>
              <h3 className="text-lg font-medium mb-4">Progress Bars</h3>
              <div className="space-y-4">
                <ProgressBar 
                  progress={progress} 
                  label="Overall Progress" 
                  color="primary" 
                />
                <ProgressBar 
                  progress={Math.min(100, progress * 1.2)} 
                  label="File Generation" 
                  color="success" 
                />
                <ProgressBar 
                  progress={Math.min(100, progress * 0.8)} 
                  label="Validation" 
                  color="warning" 
                />
              </div>
            </Card>
            
            <Card>
              <h3 className="text-lg font-medium mb-4">Animated Elements</h3>
              <div className="flex justify-around items-center">
                <div className="text-center">
                  <PulsingDot color="primary" size="lg" />
                  <p className="text-sm mt-2">Active</p>
                </div>
                <div className="text-center">
                  <LoadingDots color="success" size="md" />
                  <p className="text-sm mt-2">Processing</p>
                </div>
                <div className="text-center">
                  <AnimatedCounter value={progress * 10} suffix=" files" />
                  <p className="text-sm mt-2">Generated</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </FadeTransition>

      {/* Animations Demo */}
      <FadeTransition show={currentDemo === 'animations'}>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-secondary-900">Smooth Animations</h2>
          
          <Card>
            <h3 className="text-lg font-medium mb-4">Entrance Animations</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {['fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'zoom'].map((animation, index) => (
                <AnimationWrapper
                  key={`${animation}-${progress}`} // Force re-render for demo
                  animation={animation as any}
                  delay={index * 100}
                  className="p-4 bg-primary-50 rounded-lg text-center"
                >
                  <div className="text-sm font-medium text-primary-700">
                    {animation}
                  </div>
                </AnimationWrapper>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-medium mb-4">Staggered List Animation</h3>
            <StaggeredList staggerDelay={150} animation="slide-up">
              {demoItems.map((item, index) => (
                <div key={index} className="p-3 bg-secondary-50 rounded-lg mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span className="text-secondary-700">{item}</span>
                  </div>
                </div>
              ))}
            </StaggeredList>
          </Card>

          <Card>
            <h3 className="text-lg font-medium mb-4">Transition Controls</h3>
            <div className="space-y-4">
              <Button onClick={() => setShowTransition(!showTransition)}>
                Toggle Transition Demo
              </Button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SlideTransition show={showTransition} direction="left">
                  <div className="p-6 bg-success-50 rounded-lg">
                    <h4 className="font-medium text-success-800">Slide Left</h4>
                    <p className="text-success-600">This content slides in from the left</p>
                  </div>
                </SlideTransition>
                
                <SlideTransition show={showTransition} direction="right">
                  <div className="p-6 bg-warning-50 rounded-lg">
                    <h4 className="font-medium text-warning-800">Slide Right</h4>
                    <p className="text-warning-600">This content slides in from the right</p>
                  </div>
                </SlideTransition>
              </div>
            </div>
          </Card>
        </div>
      </FadeTransition>

      {/* Micro-interactions Demo */}
      <FadeTransition show={currentDemo === 'interactions'}>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-secondary-900">Micro-interactions</h2>
          
          <Card>
            <h3 className="text-lg font-medium mb-4">Enhanced Buttons</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
              <Button loading>Loading Button</Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-medium mb-4">Interactive Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card variant="default">
                <h4 className="font-medium mb-2">Default Card</h4>
                <p className="text-sm text-secondary-600">Standard card with subtle shadow</p>
              </Card>
              <Card variant="elevated">
                <h4 className="font-medium mb-2">Elevated Card</h4>
                <p className="text-sm text-secondary-600">Card with enhanced shadow</p>
              </Card>
              <Card variant="interactive" hover>
                <h4 className="font-medium mb-2">Interactive Card</h4>
                <p className="text-sm text-secondary-600">Hover me for lift effect!</p>
              </Card>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-medium mb-4">Toast Notifications</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => showToast('success')}>
                Success Toast
              </Button>
              <Button variant="outline" onClick={() => showToast('error')}>
                Error Toast
              </Button>
              <Button variant="outline" onClick={() => showToast('warning')}>
                Warning Toast
              </Button>
              <Button variant="outline" onClick={() => showToast('info')}>
                Info Toast
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-medium mb-4">Pulse Effects</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <PulseEffect color="primary" intensity="subtle">
                <div className="p-4 bg-primary-100 rounded-lg text-center">
                  <div className="text-primary-700 font-medium">Subtle</div>
                </div>
              </PulseEffect>
              <PulseEffect color="success" intensity="medium">
                <div className="p-4 bg-success-100 rounded-lg text-center">
                  <div className="text-success-700 font-medium">Medium</div>
                </div>
              </PulseEffect>
              <PulseEffect color="warning" intensity="strong">
                <div className="p-4 bg-warning-100 rounded-lg text-center">
                  <div className="text-warning-700 font-medium">Strong</div>
                </div>
              </PulseEffect>
              <PulseEffect color="error" intensity="medium">
                <div className="p-4 bg-error-100 rounded-lg text-center">
                  <div className="text-error-700 font-medium">Error</div>
                </div>
              </PulseEffect>
            </div>
          </Card>
        </div>
      </FadeTransition>

      <ToastContainer />
    </div>
  )
}

export default LoadingStatesDemo