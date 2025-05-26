import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface LoadingProps {
  message?: string
  showSecondaryText?: boolean
}

export function Loading({ 
  message = "Processing your request...", 
  showSecondaryText = true 
}: LoadingProps) {
  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-semibold text-foreground">{message}</p>
        {showSecondaryText && (
          <p className="text-sm text-muted-foreground">
            This may take a few moments, please wait.
          </p>
        )}
      </div>
    </div>
  )
} 