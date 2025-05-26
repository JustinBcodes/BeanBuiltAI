'use client'

import { useState } from 'react'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

export function ResetProgress() {
  const { resetProgress } = useStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleReset = async () => {
    try {
      setLoading(true)
      const success = await resetProgress()
      
      if (success) {
        toast({
          title: "Progress Reset",
          description: "Your fitness progress has been reset successfully.",
        })
        setOpen(false)
      } else {
        throw new Error('Failed to reset progress')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset progress. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Reset Progress</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Progress</DialogTitle>
          <DialogDescription>
            Are you sure you want to reset all your fitness data? This will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Clear your workout history</li>
              <li>Reset your current weight to initial weight</li>
              <li>Clear your nutrition plan</li>
              <li>Reset your progress tracking</li>
            </ul>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset Progress'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 