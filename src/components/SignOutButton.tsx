'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { Button, ButtonProps } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import React from 'react'

type SignOutButtonProps = Omit<ButtonProps, 'onClick'> & {
  redirectTo?: string;
};

export function SignOutButton({ 
  id, 
  variant = 'default', 
  className,
  redirectTo = '/',
  ...props 
}: SignOutButtonProps) {
  const router = useRouter()
  const resetStore = useStore((state) => state.resetStore)
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false })
      resetStore()
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      })
      router.push(redirectTo)
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Button
      id={id}
      variant={variant}
      onClick={handleSignOut}
      className={className}
      type="button"
      {...props}
    >
      <LogOut className="mr-2 h-4 w-4" />
      <span>Sign Out</span>
    </Button>
  )
} 