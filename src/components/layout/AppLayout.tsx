'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { useState, useEffect } from 'react'
import { useStore } from '@/store'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const profile = useStore(state => state.profile)

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const isLandingPage = pathname === '/'
  const isAuthPage = pathname.startsWith('/auth/')
  const isOnboardingPage = pathname.startsWith('/onboarding')
  
  // For landing page, auth pages, just render children without app shell
  if (isLandingPage || isAuthPage) {
    return <>{children}</>; 
  }

  // Show sidebar only if onboarding is complete and we're not on onboarding page
  const showSidebar = profile?.hasCompletedOnboarding && !isOnboardingPage

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar for larger screens - only show if onboarding is complete */}
      {showSidebar && (
        <div className="hidden lg:block">
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.2 }}
            className="h-screen border-r border-border"
          >
            <Sidebar />
          </motion.div>
        </div>
      )}

      {/* Mobile Sidebar (Drawer) - controlled by Header, only shown if onboarding complete */}
      <AnimatePresence>
        {mobileSidebarOpen && showSidebar && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            {/* Sidebar content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.3 }}
              className="relative z-50 h-full w-80 max-w-[80%] bg-card shadow-xl border-r border-border"
            >
              <Sidebar onClose={() => setMobileSidebarOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Only show Header with hamburger menu if sidebar should be shown */}
        <Header onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} showMenuButton={!!showSidebar} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <motion.div
            key={pathname} // Add key to re-trigger animation on route change
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
} 