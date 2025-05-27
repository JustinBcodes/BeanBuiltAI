'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
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
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'

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
  const pathname = usePathname()
  const { status } = useSession()
  const { profile } = useStore()

  // Show loading while session is loading or profile is not yet hydrated
  // Middleware ensures that if we reach this component, user is authenticated and should have access
  if (status === 'loading' || !profile) {
    return <LoadingSkeleton message="Loading dashboard..." />
  }

  // If we reach here, middleware has ensured user is authenticated and profile is loaded
  // Just render the dashboard layout - no redirect logic needed
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
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1">
              {/* Search or breadcrumbs could go here */}
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* User menu would go here */}
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 