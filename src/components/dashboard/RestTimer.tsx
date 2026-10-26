'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function RestTimer() {
  const [duration, setDuration] = useState(90)
  const [remaining, setRemaining] = useState(90)
  const [running, setRunning] = useState(false)
  const endTime = useRef(0)

  useEffect(() => {
    if (!running) return
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((endTime.current - Date.now()) / 1000))
      setRemaining(seconds)
      if (!seconds) setRunning(false)
    }
    tick()
    const interval = window.setInterval(tick, 250)
    return () => window.clearInterval(interval)
  }, [running])

  function selectDuration(seconds: number) {
    setDuration(seconds)
    setRemaining(seconds)
    setRunning(false)
  }

  return <Card className="h-full rounded-2xl">
    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Timer className="h-5 w-5 text-primary" />Rest timer</CardTitle></CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Take a breather between sets.</p>
      <div role="timer" aria-label="Rest time remaining" className="my-5 text-center text-5xl font-semibold tabular-nums tracking-tight">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</div>
      <div className="mb-4 flex justify-center gap-2">{[30, 60, 90, 120].map(seconds => <Button key={seconds} size="sm" variant={duration === seconds ? 'secondary' : 'ghost'} aria-pressed={duration === seconds} onClick={() => selectDuration(seconds)}>{seconds}s</Button>)}</div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => {
          if (running) setRunning(false)
          else { endTime.current = Date.now() + (remaining || duration) * 1000; setRemaining(remaining || duration); setRunning(true) }
        }}>{running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{running ? 'Pause' : remaining === 0 ? 'Start again' : 'Start'}</Button>
        <Button variant="outline" size="icon" aria-label="Reset rest timer" onClick={() => selectDuration(duration)}><RotateCcw className="h-4 w-4" /></Button>
      </div>
      <p role="status" className="mt-3 min-h-5 text-center text-sm text-primary">{remaining === 0 ? 'Rest complete. Ready for your next set.' : ''}</p>
    </CardContent>
  </Card>
}
