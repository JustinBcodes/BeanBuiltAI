'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { useSession, signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import styles from './signin.module.css'

export const dynamic = 'force-dynamic'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

const errorMessages: Record<string, string> = {
  OAuthSignin: 'There was an issue starting the sign-in process with Google.',
  OAuthCallback: 'Google sign-in could not be completed. Please try again.',
  OAuthCreateAccount: 'We could not create your account with Google.',
  EmailCreateAccount: 'We could not create an account for this email.',
  Callback: 'There was an error completing sign-in.',
  OAuthAccountNotLinked: 'This email is connected to a different sign-in method.',
  EmailSignin: 'The sign-in email could not be sent.',
  CredentialsSignin: 'Those credentials are not valid.',
  SessionRequired: 'Please sign in to continue.',
  Default: 'Something went wrong while signing in. Please try again.',
}

function AuthLoading({ message }: { message: string }) {
  return (
    <div className={styles.loadingPage}>
      <div className={styles.loadingState}>
        <BrandLogo />
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p>{message}</p>
      </div>
    </div>
  )
}

function SignInContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const requestedFrom = searchParams.get('from') || '/dashboard'
  const from = /^\/(?![\/\\])/.test(requestedFrom) && !/[\\\x00-\x1f]/.test(requestedFrom) ? requestedFrom : '/dashboard'
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    if (status !== 'loading') setSessionChecked(true)
  }, [status])

  useEffect(() => {
    if (sessionChecked && status === 'authenticated' && session?.user) {
      router.replace(from)
    }
  }, [sessionChecked, status, session, from, router])

  const handleSignIn = async () => {
    if (isSigningIn) return
    setIsSigningIn(true)

    try {
      await signIn('google', { callbackUrl: from })
    } catch (signInError) {
      console.error('Sign-in initiation error:', signInError)
      setIsSigningIn(false)
    }
  }

  if (!sessionChecked || status === 'loading') {
    return <AuthLoading message="Checking authentication..." />
  }

  if (status === 'authenticated') {
    return <AuthLoading message="Taking you to your dashboard..." />
  }

  const displayError = error ? errorMessages[error] || errorMessages.Default : null

  return (
    <main className={styles.authPage}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.orbit} aria-hidden="true"><span /></div>

      <Link href="/" className={styles.backLink}>
        <ArrowLeft aria-hidden="true" /> back to home
      </Link>

      <Link href="/" className={styles.brand} aria-label="BeanBuilt AI home">
        <BrandLogo />
      </Link>

      <div className={styles.authLayout}>
        <section className={styles.authIntro}>
          <span className={styles.eyebrow}><Sparkles aria-hidden="true" /> Your plan is waiting</span>
          <h1>Built around <em>you.</em></h1>
          <p>
            One intelligent place for workouts, nutrition, recovery, and the progress that keeps you moving.
          </p>
          <div className={styles.proofRow}>
            <div><strong>Your goals</strong><span>one clear plan</span></div>
            <div><strong>Your pace</strong><span>one day at a time</span></div>
          </div>
        </section>

        <Card className={styles.authCard}>
          <CardHeader className={styles.cardHeader}>
            <span className={styles.cardKicker}>welcome back</span>
            <CardTitle className={styles.cardTitle}>Sign in to BeanBuilt AI</CardTitle>
            <CardDescription className={styles.cardDescription}>
              Continue with Google to access your personalized fitness workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className={styles.cardContent}>
            {displayError && <div className={styles.errorMessage} role="alert">{displayError}</div>}

            <Button onClick={handleSignIn} disabled={isSigningIn} variant="outline" className={styles.googleButton}>
              <span className={styles.googleIconWrap}>
                {isSigningIn ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
              </span>
              <span>{isSigningIn ? 'Connecting securely...' : 'Continue with Google'}</span>
              <ArrowRight className={styles.buttonArrow} aria-hidden="true" />
            </Button>

            <div className={styles.securityNote}>
              <ShieldCheck aria-hidden="true" />
              <span>Your account and fitness data stay private and secure.</span>
            </div>

            <p className={styles.legal}>
              By continuing, you agree to BeanBuilt AI&apos;s Terms and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function SignInPage() { return <Suspense fallback={<AuthLoading message="Loading sign-in..." />}><SignInContent /></Suspense> }
