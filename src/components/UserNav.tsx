'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from '@/components/ui/button'
import { LogOut, User, Settings, LifeBuoy, UserCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function UserNav() {
  const { data: session } = useSession()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out failed",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!session) {
    return (
      <Button asChild variant="default" size="sm">
        <Link href="/auth/signin">Sign In</Link>
      </Button>
    )
  }

  const userName = session.user?.name
  const userEmail = session.user?.email
  const userImage = session.user?.image
  const userInitials = userName?.split(' ')
    .map(n => n?.[0])
    .filter(Boolean)
    .join('')
    || userEmail?.[0]
    || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full" 
          aria-label={`User menu for ${userName || 'current user'}`}
        >
          <Avatar className="h-10 w-10 border-2 border-transparent hover:border-primary transition-colors">
            {userImage && <AvatarImage src={userImage} alt={userName || 'User avatar'} />}
            <AvatarFallback className="bg-muted text-primary">
              {userInitials.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-foreground">
              {userName || 'User'}
            </p>
            {userEmail && (
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/profile" passHref legacyBehavior>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <a className="flex w-full items-center">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Profile</span>
              </a>
            </DropdownMenuItem>
          </Link>
          <Link href="/settings" passHref legacyBehavior>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <a className="flex w-full items-center">
                <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Settings</span>
              </a>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut} 
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 