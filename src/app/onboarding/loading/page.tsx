'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LoadingPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [checkCount, setCheckCount] = useState(0)
  const maxChecks = 10 // 20 seconds total (2 seconds per check)

  useEffect(() => {
    let isMounted = true

    const checkPlans = async () => {
      try {
        const response = await fetch('/api/user/status')
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Status check failed:', errorData)
          throw new Error(errorData.error || 'Failed to check status')
        }

        const data = await response.json()

        if (data.hasCompletedOnboarding && data.hasWorkoutPlan && data.hasNutritionPlan) {
          if (isMounted && typeof window !== 'undefined') {
            // Use window.location for a hard redirect
            window.location.href = '/dashboard'
          }
          return
        }

        if (isMounted) {
          setCheckCount(prev => prev + 1)
          setProgress((checkCount + 1) * 10)

          if (checkCount >= maxChecks - 1) {
            setError('Plans are taking longer than expected to generate. Please try again.')
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/onboarding'
              }
            }, 3000)
          }
        }
      } catch (error) {
        console.error('Error checking plans:', error)
        if (isMounted) {
          setError('An error occurred while generating your plans. Please try again.')
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/onboarding'
            }
          }, 3000)
        }
      }
    }

    const interval = setInterval(checkPlans, 2000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [checkCount, maxChecks])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {error ? 'Error' : 'Generating Your Personalized Plans'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {error || 'This may take a few moments...'}
          </p>
        </div>

        {!error && (
          <div className="mt-8">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    Progress
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {progress}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div
                  style={{ width: `${progress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          {!error && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
        </div>
      </div>
    </div>
  )
} 