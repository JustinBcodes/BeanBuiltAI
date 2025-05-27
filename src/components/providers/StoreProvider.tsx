'use client'

import React, { ReactNode, useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useStore } from '@/store'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'

interface StoreProviderProps {
  children: ReactNode
}

function ProfileLoader() {
  const { data: session, status } = useSession()
  const { profile, setProfile } = useStore()
  const workoutPlan = useStore(state => state.workoutPlan)
  const nutritionPlan = useStore(state => state.nutritionPlan)
  const generatePlans = useStore(state => state.generatePlans)
  const [isHydrated, setIsHydrated] = useState(false)
  const hasInitialized = useRef(false)
  const lastSessionId = useRef<string | null>(null)

  // Debug logging removed for production

  // Hydration guard
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Reset initialization when session changes
  useEffect(() => {
    if (session?.user?.id && session.user.id !== lastSessionId.current) {
      lastSessionId.current = session.user.id
      hasInitialized.current = false
    } else if (!session?.user?.id) {
      lastSessionId.current = null
      hasInitialized.current = false
    }
  }, [session?.user?.id])

  // Immediately create profile from session if authenticated and no profile exists
  useEffect(() => {
    if (!isHydrated || status === 'loading' || hasInitialized.current) {
      return
    }

    if (status === 'authenticated' && session?.user && !profile) {
      hasInitialized.current = true
      
      // Create profile immediately from session data
      const newProfile = {
        id: session.user.id,
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        hasCompletedOnboarding: session.user.hasCompletedOnboarding ?? false,
        image: session.user.image ?? "",
        // Default values for missing fields
        age: 25,
        height: 70,
        currentWeight: 150,
        targetWeight: 140,
        goalType: 'general_fitness' as const,
        experienceLevel: 'beginner' as const,
        preferredWorkoutDays: ['monday', 'wednesday', 'friday'],
        sex: 'male' as const,
      }
      setProfile(newProfile)
      
      // Async fetch from API to update with latest data
      const fetchLatestProfile = async () => {
        try {
          const response = await fetch('/api/user/profile', {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache'
            }
          })
          
          if (response.ok) {
            const fetchedProfile = await response.json()
            setProfile(fetchedProfile)
            
            // Generate plans if onboarding is complete and plans are missing/invalid
            if (fetchedProfile.hasCompletedOnboarding) {
              const hasValidWorkoutPlan = workoutPlan && 
                Array.isArray(workoutPlan.multiWeekSchedules) && 
                workoutPlan.multiWeekSchedules.length > 0
                
              const hasValidNutritionPlan = nutritionPlan && 
                Array.isArray(nutritionPlan.multiWeekMealPlans) && 
                nutritionPlan.multiWeekMealPlans.length > 0
              
              if (!hasValidWorkoutPlan || !hasValidNutritionPlan) {
                await generatePlans(fetchedProfile)
              }
            }
          }
        } catch (error) {
          console.error("ProfileLoader: Error fetching latest profile:", error)
          // Keep the session-based profile if API fails
        }
      }
      
      // Fetch latest profile data asynchronously
      fetchLatestProfile()
    }
  }, [isHydrated, status, session, profile, setProfile, generatePlans, workoutPlan, nutritionPlan])

  // Show loading until we have either a profile or confirmed unauthenticated status
  if (status === 'loading' || (status === 'authenticated' && !profile)) {
    return <LoadingSkeleton message="Loading your profile..." />
  }

  // Profile is ready or user is unauthenticated - let children render
  return null
}

export function StoreProvider({ children }: StoreProviderProps) {
  return (
    <>
      <ProfileLoader />
      {children}
    </>
  )
} 