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
  const lastOnboardingStatus = useRef<boolean | null>(null)

  // Enhanced hydration guard - critical for mobile and incognito browsers
  useEffect(() => {
    // Add a small delay to ensure proper hydration on slower devices
    const timer = setTimeout(() => {
      setIsHydrated(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  // Reset initialization when session changes or onboarding status changes
  useEffect(() => {
    // Don't process if session is still loading
    if (status === 'loading') {
      return
    }

    const currentOnboardingStatus = session?.user?.hasCompletedOnboarding ?? false
    
    if (session?.user?.id && session.user.id !== lastSessionId.current) {
      console.log(`🔄 StoreProvider: Session ID changed from ${lastSessionId.current} to ${session.user.id}`)
      lastSessionId.current = session.user.id
      hasInitialized.current = false
    } else if (!session?.user?.id) {
      lastSessionId.current = null
      hasInitialized.current = false
    }

    // Reset if onboarding status changed (important for production)
    if (currentOnboardingStatus !== lastOnboardingStatus.current) {
      console.log(`🔄 StoreProvider: Onboarding status changed from ${lastOnboardingStatus.current} to ${currentOnboardingStatus}`)
      lastOnboardingStatus.current = currentOnboardingStatus
      hasInitialized.current = false
    }
  }, [session?.user?.id, session?.user?.hasCompletedOnboarding, status])

  // Immediately create profile from session if authenticated and no profile exists
  useEffect(() => {
    // Enhanced loading checks for mobile/incognito compatibility
    if (!isHydrated || status === 'loading' || hasInitialized.current) {
      return
    }

    if (status === 'authenticated' && session?.user && !profile) {
      console.log(`🔄 StoreProvider: Creating profile from session data for user ${session.user.id}`)
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
      console.log(`✅ StoreProvider: Profile created with onboarding status: ${newProfile.hasCompletedOnboarding}`)
      setProfile(newProfile)

      // Enhanced async profile fetching with better error handling
      const fetchLatestProfile = async () => {
        try {
          console.log(`🔄 StoreProvider: Fetching latest profile data for user ${session.user.id}`)
          const response = await fetch('/api/user/profile', {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          })

          if (!response.ok) {
            throw new Error(`Profile fetch failed: ${response.status}`)
          }

          const fetchedProfile = await response.json()
          console.log(`✅ StoreProvider: Latest profile fetched`, {
            hasCompletedOnboarding: fetchedProfile.hasCompletedOnboarding,
            profileId: fetchedProfile.id
          })

          // Update profile with latest data
          setProfile(fetchedProfile)

          // Check if we need to generate plans
          const hasValidWorkoutPlan = workoutPlan && 
                                      Array.isArray(workoutPlan.multiWeekSchedules) && 
                                      workoutPlan.multiWeekSchedules.length > 0

          const hasValidNutritionPlan = nutritionPlan && 
                                        Array.isArray(nutritionPlan.multiWeekMealPlans) && 
                                        nutritionPlan.multiWeekMealPlans.length > 0

          // Only generate plans if user has completed onboarding and plans are missing
          if (fetchedProfile.hasCompletedOnboarding && (!hasValidWorkoutPlan || !hasValidNutritionPlan)) {
            console.log(`🔄 StoreProvider: Generating missing plans for completed onboarding user`)
            await generatePlans(fetchedProfile)
            
            // Verify plans were generated
            const finalWorkoutPlan = useStore.getState().workoutPlan;
            const finalNutritionPlan = useStore.getState().nutritionPlan;
            console.log(`✅ StoreProvider: Plan generation completed`, {
              workoutPlanValid: !!(finalWorkoutPlan && Array.isArray(finalWorkoutPlan.multiWeekSchedules)),
              nutritionPlanValid: !!(finalNutritionPlan && Array.isArray(finalNutritionPlan.multiWeekMealPlans))
            })
          }
        } catch (error) {
          console.error("🚨 StoreProvider: Error fetching latest profile:", error)
          // Keep the session-based profile if API fails - important for offline/poor connectivity
        }
      }
      
      // Fetch latest profile data asynchronously
      fetchLatestProfile()
    }
  }, [isHydrated, status, session, profile, setProfile, generatePlans, workoutPlan, nutritionPlan])

  // Enhanced loading state handling for mobile/incognito browsers
  if (status === 'loading') {
    console.log(`🔄 StoreProvider: Session loading...`)
    return <LoadingSkeleton message="Authenticating..." />
  }

  if (status === 'authenticated' && !profile) {
    console.log(`🔄 StoreProvider: Authenticated but no profile - status: ${status}, profile: ${!!profile}`)
    return <LoadingSkeleton message="Loading your profile..." />
  }

  // Profile is ready or user is unauthenticated - let children render
  return null
}

export default function StoreProvider({ children }: StoreProviderProps) {
  return (
    <>
      <ProfileLoader />
      {children}
    </>
  )
} 