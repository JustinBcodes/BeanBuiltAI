'use client'

import { useSession } from 'next-auth/react'
import { UpdateStats } from '@/components/dashboard/UpdateStats'

export default function StatsPage() {
  const { data: session } = useSession()

  if (!session) {
    return <div>Please sign in to access this page.</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Update Stats</h1>
        <p className="text-gray-500">Update your fitness goals and current stats</p>
      </div>

      <UpdateStats />
    </div>
  )
} 