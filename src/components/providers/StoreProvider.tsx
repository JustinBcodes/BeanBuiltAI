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
  const { profile, setProfile, setWorkoutPlan, setNutritionPlan } = useStore()
  const workoutPlan = useStore(state => state.workoutPlan)
  const nutritionPlan = useStore(state => state.nutritionPlan)
  const generatePlans = useStore(state => state.generatePlans)
  const initializeProgressFromPlans = useStore(state => state.initializeProgressFromPlans)
  const [isHydrated, setIsHydrated] = useState(false)
  const hasInitialized = useRef(false)
  const lastSessionId = useRef<string | null>(null)
  const lastOnboardingStatus = useRef<boolean | null>(null)
  const [profileCreationAttempted, setProfileCreationAttempted] = useState(false)

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
      setProfileCreationAttempted(false)
    } else if (!session?.user?.id) {
      lastSessionId.current = null
      hasInitialized.current = false
      setProfileCreationAttempted(false)
    }

    // Reset if onboarding status changed (important for production)
    if (currentOnboardingStatus !== lastOnboardingStatus.current) {
      console.log(`🔄 StoreProvider: Onboarding status changed from ${lastOnboardingStatus.current} to ${currentOnboardingStatus}`)
      lastOnboardingStatus.current = currentOnboardingStatus
      hasInitialized.current = false
      setProfileCreationAttempted(false)
    }
  }, [session?.user?.id, session?.user?.hasCompletedOnboarding, status])

  // 🧠 3. Zustand + DB Sync / Hydration Strategy - Hydrate from DB instead of regenerating
  useEffect(() => {
    // Enhanced loading checks for mobile/incognito compatibility
    if (!isHydrated || status === 'loading' || hasInitialized.current) {
      return
    }

    if (status === 'authenticated' && session?.user && !profile && !profileCreationAttempted) {
      console.log(`🔄 StoreProvider: Creating profile from session data for user ${session.user.id}`)
      hasInitialized.current = true
      setProfileCreationAttempted(true)
      
      // Create profile immediately from session data - this prevents infinite loading
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

      // Enhanced async profile and plans fetching with DB hydration
      const hydrateFromDatabase = async () => {
        try {
          console.log(`🔄 StoreProvider: Hydrating from database for user ${session.user.id}`)
          
          // Fetch profile data
          const profileResponse = await fetch('/api/user/profile', {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          })

          if (!profileResponse.ok) {
            throw new Error(`Profile fetch failed: ${profileResponse.status}`)
          }

          const fetchedProfile = await profileResponse.json()
          console.log(`✅ StoreProvider: Latest profile fetched`, {
            hasCompletedOnboarding: fetchedProfile.hasCompletedOnboarding,
            profileId: fetchedProfile.id
          })

          // Update profile with latest data
          setProfile(fetchedProfile)

          // 🧠 Hydrate plans from DB instead of regenerating
          if (fetchedProfile.hasCompletedOnboarding) {
            console.log(`🔄 StoreProvider: Fetching existing plans from database...`)
            
            try {
              // Fetch existing workout plan from DB
              const workoutResponse = await fetch('/api/user/workout/plan', {
                method: 'GET',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0',
                },
              })

              // Fetch existing nutrition plan from DB
              const nutritionResponse = await fetch('/api/user/nutrition/plan', {
                method: 'GET',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0',
                },
              })

              let workoutPlanFromDB = null
              let nutritionPlanFromDB = null

              if (workoutResponse.ok) {
                workoutPlanFromDB = await workoutResponse.json()
                console.log(`✅ StoreProvider: Workout plan loaded from DB:`, {
                  planName: workoutPlanFromDB?.planName,
                  hasSchedules: !!workoutPlanFromDB?.multiWeekSchedules
                })
              }

              if (nutritionResponse.ok) {
                nutritionPlanFromDB = await nutritionResponse.json()
                console.log(`✅ StoreProvider: Nutrition plan loaded from DB:`, {
                  planName: nutritionPlanFromDB?.planName,
                  hasMealPlans: !!nutritionPlanFromDB?.multiWeekMealPlans
                })
              }

              // Set plans from DB if they exist
              if (workoutPlanFromDB) {
                setWorkoutPlan(workoutPlanFromDB)
              }
              if (nutritionPlanFromDB) {
                setNutritionPlan(nutritionPlanFromDB)
              }

              // Initialize progress from the loaded plans
              if (workoutPlanFromDB || nutritionPlanFromDB) {
                console.log(`🔄 StoreProvider: Initializing progress from DB plans...`)
                initializeProgressFromPlans(workoutPlanFromDB, nutritionPlanFromDB)
              }

              // Only generate plans if they're missing from DB
              if (!workoutPlanFromDB || !nutritionPlanFromDB) {
                console.log(`🔄 StoreProvider: Some plans missing from DB, generating...`, {
                  needsWorkout: !workoutPlanFromDB,
                  needsNutrition: !nutritionPlanFromDB
                })
                await generatePlans(fetchedProfile)
                
                // Verify plans were generated
                const finalWorkoutPlan = useStore.getState().workoutPlan;
                const finalNutritionPlan = useStore.getState().nutritionPlan;
                console.log(`✅ StoreProvider: Plan generation completed`, {
                  workoutPlanValid: !!(finalWorkoutPlan && Array.isArray(finalWorkoutPlan.multiWeekSchedules)),
                  nutritionPlanValid: !!(finalNutritionPlan && Array.isArray(finalNutritionPlan.multiWeekMealPlans))
                })
              } else {
                console.log(`✅ StoreProvider: All plans loaded from DB, no generation needed`)
              }

            } catch (planError) {
              console.error("🚨 StoreProvider: Error fetching plans from DB:", planError)
              // Fallback to generating plans if DB fetch fails
              console.log(`🔄 StoreProvider: Falling back to plan generation...`)
              await generatePlans(fetchedProfile)
            }
          }
        } catch (error) {
          console.error("🚨 StoreProvider: Error hydrating from database:", error)
          // Keep the session-based profile if API fails - important for offline/poor connectivity
        }
      }
      
      // Hydrate from database asynchronously
      hydrateFromDatabase()
    }
  }, [isHydrated, status, session, profile, setProfile, setWorkoutPlan, setNutritionPlan, generatePlans, initializeProgressFromPlans, profileCreationAttempted])

  // Enhanced loading state handling for mobile/incognito browsers
  if (status === 'loading') {
    console.log(`🔄 StoreProvider: Session loading...`)
    return <LoadingSkeleton message="Authenticating..." />
  }

  // Only show loading if we haven't attempted to create a profile yet
  if (status === 'authenticated' && !profile && !profileCreationAttempted) {
    console.log(`🔄 StoreProvider: Authenticated but no profile - status: ${status}, profile: ${!!profile}, attempted: ${profileCreationAttempted}`)
    return <LoadingSkeleton message="Loading your profile..." />
  }

  // If we've attempted to create a profile but it's still null, there might be an issue
  // Let's create a fallback profile to prevent infinite loading
  if (status === 'authenticated' && session?.user && !profile && profileCreationAttempted) {
    console.warn(`⚠️ StoreProvider: Profile creation attempted but failed, creating fallback profile`)
    const fallbackProfile = {
      id: session.user.id,
      name: session.user.name ?? "User",
      email: session.user.email ?? "",
      hasCompletedOnboarding: session.user.hasCompletedOnboarding ?? false,
      image: session.user.image ?? "",
      age: 25,
      height: 70,
      currentWeight: 150,
      targetWeight: 140,
      goalType: 'general_fitness' as const,
      experienceLevel: 'beginner' as const,
      preferredWorkoutDays: ['monday', 'wednesday', 'friday'],
      sex: 'male' as const,
    }
    setProfile(fallbackProfile)
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