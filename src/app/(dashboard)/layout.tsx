// Dashboard layout for protected routes

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  // AppLayout already handles authentication and layout logic
  // Just render children for dashboard pages
  return <>{children}</>
} 