import NextAuthSessionProvider from '@/components/providers/SessionProvider'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import StoreProvider from '@/components/providers/StoreProvider'
import { AppLayout } from '@/components/layout/AppLayout'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from "@/components/providers/ThemeProvider"

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'BeanBuilt AI - Your Personal Fitness & Nutrition Coach',
  description: 'AI-powered fitness and nutrition coaching platform',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <NextAuthSessionProvider>
            <StoreProvider>
              <AppLayout>
                {children}
              </AppLayout>
              <Toaster />
            </StoreProvider>
          </NextAuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
