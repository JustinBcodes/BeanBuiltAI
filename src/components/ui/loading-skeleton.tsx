import { Loader2 } from 'lucide-react'

interface LoadingSkeletonProps {
  message?: string
}

export function LoadingSkeleton({ 
  message = "Loading..." 
}: LoadingSkeletonProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-gray-700">{message}</p>
      </div>
    </div>
  )
} 