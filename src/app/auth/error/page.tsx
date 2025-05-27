'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

// Force dynamic rendering for NextAuth server-side data
export const dynamic = 'force-dynamic'

export default function AuthErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: { [key: string]: string } = {
    OAuthSignin: "There was an issue initiating the sign-in process with the external provider. Please try again.",
    OAuthCallback: "There was an issue receiving data from the external sign-in provider. Please try again.",
    OAuthCreateAccount: "We couldn&rsquo;t create your account using the external provider. The email might be in use or there was a provider error.",
    EmailCreateAccount: "Failed to create an account using the email provider.",
    Callback: "An error occurred during the sign-in process. Please try again.",
    OAuthAccountNotLinked: "This email is already linked to an account with a different sign-in method. Please use your original sign-in method.",
    EmailSignin: "There was a problem sending the sign-in email. Please check the email address and try again.",
    CredentialsSignin: "The username or password you entered is incorrect. Please check your credentials.",
    SessionRequired: "You need to be signed in to access this page. Please sign in.",
    Default: "An unexpected authentication error occurred. We apologize for the inconvenience.",
  }

  const displayMessage = error ? (errorMessages[error] || errorMessages.Default) : errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-destructive">
            Authentication Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {displayMessage}
          </p>
          <Button
            onClick={() => router.push('/auth/signin')}
            className="w-full"
            variant="default"
          >
            Try Signing In Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 