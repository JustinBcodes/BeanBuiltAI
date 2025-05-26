"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dumbbell,
  Apple,
  Target,
  LineChart,
  Home,
  Settings,
  LogOut
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const navItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: Home
  },
  {
    title: 'Workouts',
    href: '/dashboard/workouts',
    icon: Dumbbell
  },
  {
    title: 'Nutrition',
    href: '/dashboard/nutrition',
    icon: Apple
  },
  {
    title: 'Goals',
    href: '/dashboard/goals',
    icon: Target
  },
  {
    title: 'Progress',
    href: '/dashboard/progress',
    icon: LineChart
  }
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <Button
            key={item.href}
            variant={pathname === item.href ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start gap-2',
              pathname === item.href && 'bg-secondary'
            )}
            asChild
          >
            <Link href={item.href}>
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          </Button>
        )
      })}
      <div className="mt-auto pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </nav>
  )
} 