'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useStore } from '@/store'
import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  LineChart,
  User,
  Lightbulb,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workouts', href: '/dashboard/workouts', icon: Dumbbell },
  { name: 'Nutrition', href: '/dashboard/nutrition', icon: Apple },
  { name: 'Progress', href: '/dashboard/progress', icon: LineChart },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Tips', href: '/dashboard/tips', icon: Lightbulb },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const { profile } = useStore()

  // Hydration guard
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Protected session redirect effects - only run when hydrated
  useEffect(() => {
    if (!isHydrated) return

    if (status === 'unauthenticated') {
      console.log('DashboardLayout: Unauthenticated, redirecting to login')
      router.push('/auth/signin')
    }
  }, [isHydrated, status, router])

  useEffect(() => {
    if (!isHydrated) return

    // Only redirect if authenticated, profile is loaded, onboarding is not complete,
    // and we are not already on the onboarding page (to prevent loops if already there).
    if (status === 'authenticated' && profile && !profile.hasCompletedOnboarding && !pathname.startsWith('/onboarding')) {
      console.log('DashboardLayout: Onboarding incomplete, redirecting to onboarding')
      router.push('/onboarding')
    }
  }, [isHydrated, status, profile?.hasCompletedOnboarding, router, pathname])

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-4 text-lg text-gray-700">Loading...</p>
      </div>
    )
  }

  // Show loading state while checking auth or if profile is not yet loaded for authenticated users
  if (status === 'loading' || (status === 'authenticated' && !profile)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="ml-4 text-lg text-gray-700">Loading dashboard...</p>
      </div>
    )
  }

  // If unauthenticated, useEffect will redirect, render null or minimal loader.
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
         <p className="text-lg text-gray-700">Redirecting to login...</p>
      </div>
    ); // Or a more sophisticated loading/redirecting message
  }

  // If authenticated but onboarding not complete, useEffect will redirect.
  // Render loading state until redirect happens or if already on onboarding page (which this layout wouldn't typically wrap).
  if (status === 'authenticated' && profile && !profile.hasCompletedOnboarding) {
    // If we are somehow on a page that uses DashboardLayout but should be on onboarding
    if (!pathname.startsWith('/onboarding')) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <p className="text-lg text-gray-700">Redirecting to onboarding...</p>
        </div>
      );
    }
    // If already on onboarding, this layout shouldn't be active, but as a fallback:
    return <>{children}</>; 
  }
  
  // If all checks pass (authenticated, profile loaded, onboarding complete), render the layout
  if (status === 'authenticated' && profile && profile.hasCompletedOnboarding) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Mobile sidebar */}
        <div className={cn(
          "fixed inset-0 z-40 lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white"
          >
            <div className="flex h-16 items-center justify-between px-4">
              <h1 className="text-xl font-bold">BeanBuilt AI</h1>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-lg",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5",
                        isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </motion.div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
            <div className="flex h-16 items-center px-4">
              <h1 className="text-xl font-bold">BeanBuilt AI</h1>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-lg",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5",
                        isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
            <button
              type="button"
              className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <main className="flex-1 py-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Fallback for any other state (should ideally not be reached if logic above is complete)
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <p className="text-lg text-gray-700">Something went wrong with the layout.</p>
    </div>
  );
} 