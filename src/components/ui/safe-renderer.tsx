'use client'

import React, { ReactNode, ErrorInfo, Component } from 'react'
import { ErrorMessage } from '@/components/ui/error-message'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

type ErrorBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

interface SafeRendererProps<T> {
  data: T | null | undefined
  children: (data: T) => ReactNode
  isValid?: (data: any) => data is T
  loadingComponent?: ReactNode
  errorComponent?: ReactNode
  onRetry?: () => void
}

export function SafeRenderer<T>({
  data,
  children,
  isValid,
  loadingComponent,
  errorComponent,
  onRetry
}: SafeRendererProps<T>): JSX.Element {
  // If custom validator is provided, use it, otherwise use a simple existence check
  const validateData = (value: any): value is T => {
    if (isValid) {
      return isValid(value)
    }
    return value !== null && value !== undefined
  }

  // Default loading component
  const defaultLoadingComponent = (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )

  // Default error component
  const defaultErrorComponent = (
    <ErrorMessage 
      text="Unable to display this content. The data may be invalid or missing."
      actionText={onRetry ? "Try Again" : undefined}
      action={onRetry}
    />
  )

  // Show loading state
  if (data === undefined) {
    return <>{loadingComponent || defaultLoadingComponent}</>
  }

  // Show error state
  if (!validateData(data)) {
    return <>{errorComponent || defaultErrorComponent}</>
  }

  // Render with valid data, wrapped in an error boundary
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border rounded-lg bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-700 mb-2">Something went wrong</h3>
          <p className="text-red-600 mb-4">An error occurred while displaying this content.</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          )}
        </div>
      }
    >
      {children(data)}
    </ErrorBoundary>
  )
} 