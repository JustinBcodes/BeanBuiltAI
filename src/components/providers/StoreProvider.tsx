'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useStore } from '@/store'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/types/plan-types'

export default function StoreProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const userId = session?.user?.id
  const profile = useStore(state => state.profile)
  const [readyUser, setReadyUser] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const isPublic = ['/', '/login', '/register', '/privacy', '/terms', '/about', '/pricing'].includes(pathname) || pathname.startsWith('/auth/')

  useEffect(() => {
    if (status === 'loading') return
    setReadyUser(null)
    setError(false)
    const store = useStore.getState()
    if (!userId || store.profile?.id !== userId) store.resetStore()
    if (!userId) {
      useStore.persist.clearStorage()
      return
    }
    const controller = new AbortController()
    let active = true
    const hydrate = async () => {
      try {
        const response = await fetch('/api/user/profile', { cache: 'no-store', signal: controller.signal })
        if (!response.ok) throw new Error('Could not load your profile')
        const fetchedProfile: Profile = await response.json()
        if (!active) return
        if (fetchedProfile.id !== userId) throw new Error('Account mismatch')
        useStore.getState().setProfile(fetchedProfile)
        if (fetchedProfile.hasCompletedOnboarding) {
          const state = useStore.getState()
          const fetchPlan = async (kind: 'workout' | 'nutrition') => {
            const result = await fetch(`/api/user/${kind}/plan`, { cache: 'no-store', signal: controller.signal })
            if (result.status === 404) return null
            if (!result.ok) throw new Error('Could not load your plans')
            return result.json()
          }
          const [workout, nutrition] = await Promise.all([
            fetchPlan('workout'),
            fetchPlan('nutrition'),
          ])
          if (!active) return
          const workoutChanged = JSON.stringify(workout?.multiWeekSchedules?.[0] ?? null) !== JSON.stringify(state.workoutPlan?.multiWeekSchedules?.[0] ?? null)
          const nutritionChanged = JSON.stringify(nutrition?.multiWeekMealPlans?.[0] ?? null) !== JSON.stringify(state.nutritionPlan?.multiWeekMealPlans?.[0] ?? null)
          const savedWorkout = state.workoutProgress
          const savedNutrition = state.nutritionProgress
          if (workout && workoutChanged) useStore.getState().setWorkoutPlan(workout)
          if (nutrition && nutritionChanged) useStore.getState().setNutritionPlan(nutrition)
          if ((!savedWorkout && workout) || (!savedNutrition && nutrition)) useStore.getState().initializeProgressFromPlans(workout, nutrition)
          useStore.setState({
            ...(!workout ? { workoutPlan: null, workoutProgress: null } : !workoutChanged && savedWorkout ? { workoutProgress: savedWorkout } : {}),
            ...(!nutrition ? { nutritionPlan: null, nutritionProgress: null } : !nutritionChanged && savedNutrition ? { nutritionProgress: savedNutrition } : {}),
          })
        } else {
          useStore.setState({ workoutPlan: null, nutritionPlan: null, workoutProgress: null, nutritionProgress: null, weightProgress: null })
        }
        if (active) setReadyUser(userId)
      } catch {
        if (active) setError(true)
      }
    }
    void hydrate()
    return () => { active = false; controller.abort() }
  }, [userId, status, retry])

  // Never render private pages with a previous account's persisted data.
  if (!isPublic && status !== 'unauthenticated' && (status === 'loading' || readyUser !== userId || profile?.id !== userId)) {
    if (error) return <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center"><h1 className="text-xl font-semibold">Your account could not be loaded</h1><p className="text-sm text-muted-foreground">Check your connection and try again.</p><Button onClick={() => setRetry(value => value + 1)}>Try again</Button></div>
    return <LoadingSkeleton message="Loading your account..." />
  }
  if (!isPublic && status === 'unauthenticated' && profile) return <LoadingSkeleton message="Clearing account data..." />
  return <>{children}</>
}
