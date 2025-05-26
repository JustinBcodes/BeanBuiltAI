'use client'

import Link from 'next/link'
import { UserNav } from './UserNav'
import { Button } from '@/components/ui/button'
import { Menu, Bell, Dumbbell } from 'lucide-react'

interface HeaderProps {
  onMobileMenuToggle: () => void;
  showMenuButton?: boolean;
}

export function Header({ onMobileMenuToggle, showMenuButton = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full bg-card/95 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="container mx-auto px-4 h-16 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {showMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileMenuToggle}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          )}

          <Link href="/dashboard" className="flex items-center space-x-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-foreground hidden sm:inline-block">
              BeanBuilt AI
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <UserNav />
        </div>
      </div>
    </header>
  )
} 