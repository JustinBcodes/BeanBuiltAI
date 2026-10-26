'use client'

import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { UserNav } from './UserNav'
import { Button } from '@/components/ui/button'
import { Menu, Sparkles } from 'lucide-react'

interface HeaderProps {
  onMobileMenuToggle: () => void;
  showMenuButton?: boolean;
}

export function Header({ onMobileMenuToggle, showMenuButton = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <div className="flex h-[4.5rem] items-center justify-between px-4 md:px-7 lg:px-10">
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

          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="sm:hidden"><BrandLogo compact /></span>
            <span className="hidden sm:block"><BrandLogo /></span>
          </Link>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <Button asChild variant="ghost" className="text-primary"><Link href="/pro"><Sparkles className="mr-2 h-4 w-4" />Pro tools</Link></Button>
          <UserNav />
        </div>
      </div>
    </header>
  )
}
