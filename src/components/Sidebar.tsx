import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/SignOutButton'
import { useStore } from '@/store'
import {
  Home,
  Dumbbell,
  Apple,
  Target,
  Settings,
  LogOut,
  Activity,
  LineChart,
  X,
  Lightbulb
} from 'lucide-react'

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home
  },
  {
    title: 'Workouts',
    href: '/workouts',
    icon: Dumbbell
  },
  {
    title: 'Nutrition',
    href: '/nutrition',
    icon: Apple
  },
  {
    title: 'Progress',
    href: '/progress',
    icon: LineChart
  },
  {
    title: 'Goals',
    href: '/goals',
    icon: Target
  },
  {
    title: 'Tips',
    href: '/tips',
    icon: Lightbulb
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings
  }
]

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const profile = useStore((state) => state.profile)

  if (status !== 'authenticated') {
    return null
  }

  // Make sure current route is highlighted correctly by normalizing paths
  const normalizedPathname = pathname.endsWith('/') 
    ? pathname.slice(0, -1) 
    : pathname;

  return (
    <div className="flex flex-col h-full w-full bg-card">
      <div className="flex-1 py-6 overflow-y-auto">
        <div className="px-4 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              BeanBuilt AI
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome, {profile?.name || 'User'}
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          )}
        </div>
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const href = item.href.endsWith('/') ? item.href.slice(0, -1) : item.href;
            const isActive = normalizedPathname === href || 
                            (href !== '/dashboard' && 
                             normalizedPathname.startsWith(href));
            
            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )} />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t border-border">
        <SignOutButton variant="ghost" className="w-full justify-start text-foreground/70 hover:text-foreground" />
      </div>
    </div>
  )
} 