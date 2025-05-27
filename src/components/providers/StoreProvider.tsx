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

  // Debug logging removed for production

  // Hydration guard
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Reset initialization when session changes or onboarding status changes
  useEffect(() => {
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
  }, [session?.user?.id, session?.user?.hasCompletedOnboarding])

  // Immediately create profile from session if authenticated and no profile exists
  useEffect(() => {
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
      
      // Async fetch from API to update with latest data
      const fetchLatestProfile = async () => {
        try {
          console.log(`🔄 StoreProvider: Fetching latest profile from API`)
          const response = await fetch('/api/user/profile', {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          })
          
          if (response.ok) {
            const fetchedProfile = await response.json()
            console.log(`✅ StoreProvider: Updated profile from API with onboarding status: ${fetchedProfile.hasCompletedOnboarding}`)
            console.log(`🔍 StoreProvider: Profile details:`, {
              goalType: fetchedProfile.goalType,
              experienceLevel: fetchedProfile.experienceLevel,
              currentWeight: fetchedProfile.currentWeight,
              hasCompletedOnboarding: fetchedProfile.hasCompletedOnboarding
            });
            
            setProfile(fetchedProfile)
            
            // Generate plans if onboarding is complete and plans are missing/invalid
            if (fetchedProfile.hasCompletedOnboarding) {
              console.log(`🔍 StoreProvider: Checking existing plans...`);
              
              const hasValidWorkoutPlan = workoutPlan && 
                Array.isArray(workoutPlan.multiWeekSchedules) && 
                workoutPlan.multiWeekSchedules.length > 0
                
              const hasValidNutritionPlan = nutritionPlan && 
                Array.isArray(nutritionPlan.multiWeekMealPlans) && 
                nutritionPlan.multiWeekMealPlans.length > 0
              
              console.log(`🔍 StoreProvider: Plan validation:`, {
                hasValidWorkoutPlan,
                hasValidNutritionPlan,
                workoutPlanExists: !!workoutPlan,
                nutritionPlanExists: !!nutritionPlan
              });
              
              if (!hasValidWorkoutPlan || !hasValidNutritionPlan) {
                console.log(`🔄 StoreProvider: Generating missing plans`)
                await generatePlans(fetchedProfile)
                
                // Verify plans were generated
                const finalWorkoutPlan = useStore.getState().workoutPlan;
                const finalNutritionPlan = useStore.getState().nutritionPlan;
                
                console.log(`✅ StoreProvider: Plan generation completed:`, {
                  workoutPlanGenerated: !!(finalWorkoutPlan && Array.isArray(finalWorkoutPlan.multiWeekSchedules)),
                  nutritionPlanGenerated: !!(finalNutritionPlan && Array.isArray(finalNutritionPlan.multiWeekMealPlans))
                });
              } else {
                console.log(`✅ StoreProvider: Valid plans already exist, skipping generation`);
              }
            }
          } else {
            console.error(`🚨 StoreProvider: Failed to fetch profile - ${response.status}`)
          }
        } catch (error) {
          console.error("🚨 StoreProvider: Error fetching latest profile:", error)
          // Keep the session-based profile if API fails
        }
      }
      
      // Fetch latest profile data asynchronously
      fetchLatestProfile()
    }
  }, [isHydrated, status, session, profile, setProfile, generatePlans, workoutPlan, nutritionPlan])

  // Show loading until we have either a profile or confirmed unauthenticated status
  if (status === 'loading' || (status === 'authenticated' && !profile)) {
    console.log(`🔄 StoreProvider: Showing loading - status: ${status}, profile: ${!!profile}`)
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