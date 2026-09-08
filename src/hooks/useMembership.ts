'use client'
import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export interface Membership { configured: boolean; pro: boolean; status: string; customer: boolean; cancelAtPeriodEnd: boolean }
export function useMembership() {
  const { data: session } = useSession()
  const [membership, setMembership] = useState<Membership | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/billing/status', { cache: 'no-store', signal })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not load membership.')
      setMembership(data)
    } catch (err) {
      if (signal?.aborted) return
      setError(err instanceof Error ? err.message : 'Could not load membership.')
    } finally { if (!signal?.aborted) setLoading(false) }
  }, [])
  useEffect(() => {
    setMembership(null)
    const controller = new AbortController()
    if (session?.user?.id) void reload(controller.signal)
    return () => controller.abort()
  }, [reload, session?.user?.id])
  return { membership, loading, error, reload }
}
