'use client'

import { useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function SignInPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const from = searchParams.get('from') || '/dashboard'

  // If already authenticated, middleware will handle redirect
  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Let middleware handle the redirect decision based on onboarding status
      router.push(from)
    }
  }, [session, status, router, from])

  const handleSignIn = async (provider: string) => {
    try {
      // Use dashboard as default callback URL, middleware will handle proper routing
      await signIn(provider, { 
        callbackUrl: '/dashboard',
        redirect: true 
      });
    } catch (err) {
      console.error('Sign in initiation error:', err)
    }
  }

  const errorMessages: { [key: string]: string } = {
    OAuthSignin: "There was an issue starting the sign-in process with the provider.",
    OAuthCallback: "There was an issue during the sign-in callback from the provider.",
    OAuthCreateAccount: "Could not create account. The email might be in use or the provider returned an error.",
    EmailCreateAccount: "Could not create account with the email provider.",
    Callback: "There was an error in the callback handling.",
    OAuthAccountNotLinked: "This email is already associated with another account or a different sign-in method. Try signing in with the original method.",
    EmailSignin: "Could not send the sign-in email. Please try again.",
    CredentialsSignin: "Invalid username or password. Please check your credentials.",
    SessionRequired: "This page requires authentication. Please sign in.",
    Default: "An unknown error occurred during sign-in. Please try again.",
  };

  const displayError = error ? (errorMessages[error] || errorMessages.Default) : null;

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading session...</p>
        </div>
      </div>
    )
  }
  
  if (status === 'authenticated') {
     return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    ); 
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Sign in to BeanBuilt AI</CardTitle>
          <CardDescription className="mt-1">
            Your personal AI fitness assistant awaits!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {displayError && (
            <div className="bg-destructive/10 p-3 rounded-md">
              <p className="text-sm text-center text-destructive font-medium">
                {displayError}
              </p>
            </div>
          )}
          <Button
            onClick={() => handleSignIn('google')}
            variant="outline"
            className="w-full text-foreground hover:bg-accent/50 focus-visible:ring-ring"
          >
            <GoogleIcon className="w-5 h-5 mr-2.5" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 