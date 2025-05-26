'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Loader2 } from 'lucide-react'

interface WeightEntry {
  date: string
  weight: number
}

interface WeightProgressProps {
  currentWeight: number
  targetWeight: number
  weightHistory: WeightEntry[]
}

export function WeightProgress({ currentWeight, targetWeight, weightHistory }: WeightProgressProps) {
  const [newWeight, setNewWeight] = useState(currentWeight.toString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const progress = ((currentWeight - targetWeight) / (currentWeight - targetWeight)) * 100

  const updateWeight = async () => {
    const weight = parseFloat(newWeight)
    if (isNaN(weight) || weight <= 0) {
      setError('Please enter a valid weight')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/user/weight/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight })
      })

      if (!response.ok) {
        throw new Error('Failed to update weight')
      }

      setSuccess(true)
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update weight')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weight Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Current Weight</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="Enter your current weight"
                  className="flex-1"
                />
                <Button
                  onClick={updateWeight}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update'
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label>Progress to Goal</Label>
              <Progress value={progress} className="mt-2" />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Current: {currentWeight} lbs</span>
                <span>Goal: {targetWeight} lbs</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-500 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 text-primary rounded-md">
              Weight updated successfully!
            </div>
          )}

          <div className="space-y-2">
            <Label>Weight History</Label>
            <div className="space-y-2">
              {weightHistory.map((entry, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded-md"
                >
                  <span className="text-sm text-gray-600">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                  <span className="font-medium">
                    {entry.weight} lbs
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 