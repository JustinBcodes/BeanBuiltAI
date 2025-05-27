'use client'

import React, { ReactNode, useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useStore } from '@/store'

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

  // Main profile loading and syncing logic
  useEffect(() => {
    if (!isHydrated || status === 'loading' || hasInitialized.current) {
      return
    }

    if (status === 'unauthenticated') {
      return
    }

    if (!session?.user?.id) {
      return
    }

    hasInitialized.current = true

    async function initializeProfile() {
      // Additional safety check for TypeScript
      if (!session?.user?.id) {
        console.error('ProfileLoader: Session or user ID is null')
        return
      }

      try {
        // Always try to fetch the latest profile from API first
        const response = await fetch('/api/user/profile', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        if (response.ok) {
          const fetchedProfile = await response.json()
          console.log('ProfileLoader: Loaded profile from API:', { 
            hasCompletedOnboarding: fetchedProfile.hasCompletedOnboarding 
          })
          
          // Set the profile from API data
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
              console.log('ProfileLoader: Generating plans for completed profile')
              await generatePlans(fetchedProfile)
            }
          }
        } else if (response.status === 404) {
          // Profile doesn't exist in DB, create from session data
          console.log('ProfileLoader: Creating profile from session data')
          const newProfile = {
            id: session.user.id,
            name: session.user.name || '',
            email: session.user.email || '',
            hasCompletedOnboarding: session.user.hasCompletedOnboarding || false,
            // Add default values for required fields
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
        } else if (response.status === 401) {
          console.log('ProfileLoader: Unauthorized, skipping profile load')
          return
        } else {
          console.error("ProfileLoader: Failed to fetch profile", response.status)
          
          // Fallback to session data if API fails
          if (!profile) {
            console.log('ProfileLoader: Using session fallback')
            const fallbackProfile = {
              id: session.user.id,
              name: session.user.name || '',
              email: session.user.email || '',
              hasCompletedOnboarding: session.user.hasCompletedOnboarding || false,
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
        }
      } catch (error) {
        console.error("ProfileLoader: Error in initializeProfile:", error)
        hasInitialized.current = false // Allow retry on error
      }
    }

    // Use a small delay to prevent race conditions
    const timeoutId = setTimeout(initializeProfile, 50)
    return () => clearTimeout(timeoutId)
  }, [isHydrated, status, session, profile, setProfile, generatePlans, workoutPlan, nutritionPlan])

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