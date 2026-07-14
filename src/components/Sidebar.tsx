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
    <aside className="flex h-full w-full flex-col bg-card/80 backdrop-blur-xl">
      <div className="flex-1 overflow-y-auto py-6">
        <div className="mb-9 flex items-center justify-between px-5">
          <div>
            <Link href="/dashboard" className="flex items-center gap-2.5 text-foreground no-underline">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground shadow-[0_0_22px_hsl(var(--primary)/0.2)]">B</span>
              <span className="text-base font-extrabold tracking-[-0.03em]">beanbuilt ai</span>
            </Link>
            <p className="mt-3 max-w-[12rem] truncate text-xs text-muted-foreground">
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
        <nav className="space-y-1.5 px-3">
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
                  'group flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[0_8px_26px_hsl(var(--primary)/0.12)]'
                    : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                )} />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="mt-auto border-t border-border/70 p-4">
        <SignOutButton variant="ghost" className="w-full justify-start rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground" />
      </div>
    </aside>
  )
}
