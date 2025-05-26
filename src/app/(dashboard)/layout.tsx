// import { SignOutButton } from '@/components/SignOutButton' // Unused import

// ... existing imports ...

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout is nested within AppLayout if routes are inside the (dashboard) group.
  // AppLayout already provides the main shell (Header, Sidebar, theme background).
  // This layout can be used for specific structural or contextual elements common to
  // all pages within the (dashboard) group, that should appear *inside* the AppLayout's main content area.
  // For now, it will just render children. If specific dashboard sub-layout is needed, add it here.
  return <>{children}</>;
} 