'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { useState, useEffect } from 'react'
import { useStore } from '@/store'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'

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
    <div className="app-shell flex h-dvh bg-background text-foreground">
      {/* Sidebar for larger screens - only show if onboarding is complete */}
      {showSidebar && (
        <div className="hidden w-[17rem] shrink-0 lg:block">
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.2 }}
            className="h-screen border-r border-border/70"
          >
            <Sidebar />
          </motion.div>
        </div>
      )}

      <Dialog open={mobileSidebarOpen && !!showSidebar} onOpenChange={setMobileSidebarOpen}>
        <DialogContent className="fixed inset-y-0 left-0 top-0 h-dvh w-80 max-w-[85vw] translate-x-0 translate-y-0 gap-0 rounded-none border-y-0 border-l-0 p-0 sm:rounded-none [&>button]:hidden">
          <DialogTitle className="sr-only">Main navigation</DialogTitle>
          <DialogDescription className="sr-only">Choose a page or close this menu to return to your dashboard.</DialogDescription>
          <Sidebar onClose={() => setMobileSidebarOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Only show Header with hamburger menu if sidebar should be shown */}
        <Header onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} showMenuButton={!!showSidebar} />
        <main className="app-main flex-1 overflow-y-auto p-4 md:p-7 lg:p-10">
          <motion.div
            key={pathname} // Add key to re-trigger animation on route change
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="mx-auto w-full max-w-[86rem]"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
