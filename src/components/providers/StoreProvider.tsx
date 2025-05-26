'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useStore } from '@/store'

interface StoreProviderProps {
  children: ReactNode
}

function ProfileLoader() {
  const { data: session, status } = useSession()
  const profile = useStore(state => state.profile)
  const workoutPlan = useStore(state => state.workoutPlan)
  const nutritionPlan = useStore(state => state.nutritionPlan)
  const setProfile = useStore(state => state.setProfile)
  const generatePlans = useStore(state => state.generatePlans)
  const [isHydrated, setIsHydrated] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Hydration guard
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    async function loadProfileAndGeneratePlans() {
      // Don't proceed if not hydrated, already initialized, or session is loading
      if (!isHydrated || hasInitialized || status === 'loading') {
        return;
      }

      if (!session?.user) {
        return;
      }
      
      setHasInitialized(true);
      
      try {
        // Load profile from API if we don't have one
        if (!profile) {
          const response = await fetch('/api/user/profile', {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache'
            }
          })
          
          if (response.ok) {
            const fetchedProfile = await response.json()
            setProfile(fetchedProfile)
            
            // Generate plans immediately after setting profile
            if (fetchedProfile.hasCompletedOnboarding) {
              try {
                await generatePlans(fetchedProfile)
              } catch (planError) {
                console.error("ProfileLoader: Error generating plans:", planError)
              }
            }
          } else if (response.status === 401) {
            return;
          } else {
            console.error("ProfileLoader: Failed to fetch profile", response.status, response.statusText)
            // Don't generate fallback plans if we can't fetch profile - let components handle it
          }
        } else {
          // Profile exists, check if we need to generate plans
          
          // Check if plans are actually valid, not just if they exist
          const hasValidWorkoutPlan = workoutPlan && 
            Array.isArray(workoutPlan.multiWeekSchedules) && 
            workoutPlan.multiWeekSchedules.length > 0 &&
            Array.isArray(workoutPlan.multiWeekSchedules[0]) &&
            workoutPlan.multiWeekSchedules[0].length === 7
            
          const hasValidNutritionPlan = nutritionPlan && 
            Array.isArray(nutritionPlan.multiWeekMealPlans) && 
            nutritionPlan.multiWeekMealPlans.length > 0 &&
            nutritionPlan.multiWeekMealPlans[0] &&
            typeof nutritionPlan.multiWeekMealPlans[0] === 'object'
          
          if (profile.hasCompletedOnboarding && (!hasValidWorkoutPlan || !hasValidNutritionPlan)) {
            try {
              await generatePlans(profile)
            } catch (planError) {
              console.error("ProfileLoader: Error generating plans for existing profile:", planError)
            }
          }
        }
      } catch (error) {
        console.error("ProfileLoader: Error loading profile or generating plans:", error)
        // Reset initialization flag on error to allow retry
        setHasInitialized(false);
      }
    }

    // Only run once per session when hydrated
    if (isHydrated && !hasInitialized && status !== 'loading') {
      const timeoutId = setTimeout(() => {
        loadProfileAndGeneratePlans()
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [session, status, isHydrated, hasInitialized]) // Simplified dependencies

  return null // This component doesn't render anything
}

export function StoreProvider({ children }: StoreProviderProps) {
  return (
    <>
      <ProfileLoader />
      {children}
    </>
  )
} 