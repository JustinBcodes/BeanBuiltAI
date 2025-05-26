'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface GoalSettingProps {
  goalType: string
  experienceLevel: string
  weightProgress: {
    current: number
    start: number
    goal: number
    goalType: string
    targetDate: string
  } | null
}

export function GoalSetting({ goalType, experienceLevel, weightProgress }: GoalSettingProps) {
  // Convert kg to pounds for display
  const convertToPounds = (kg: number) => Math.round(kg * 2.20462)
  
  const [currentWeight, setCurrentWeight] = useState(
    weightProgress ? convertToPounds(weightProgress.current) : 0
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleWeightUpdate = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/user/weight/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: currentWeight })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update weight')
      }
      
      // Refresh the page to show updated progress
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update weight')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Goal Type</Label>
              <div className="text-lg font-medium mt-1">{goalType}</div>
            </div>
            <div>
              <Label>Experience Level</Label>
              <div className="text-lg font-medium mt-1">{experienceLevel}</div>
            </div>
            {weightProgress && (
              <>
                <div>
                  <Label>Weight Progress</Label>
                  <div className="mt-2">
                    <Progress 
                      value={((weightProgress.current - weightProgress.start) / 
                        (weightProgress.goal - weightProgress.start)) * 100} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>Start: {convertToPounds(weightProgress.start)} lbs</span>
                      <span>Current: {convertToPounds(weightProgress.current)} lbs</span>
                      <span>Goal: {convertToPounds(weightProgress.goal)} lbs</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Target Date</Label>
                  <div className="text-lg font-medium mt-1">
                    {new Date(weightProgress.targetDate).toLocaleDateString()}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentWeight">Current Weight (lbs)</Label>
              <Input
                id="currentWeight"
                type="number"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(Number(e.target.value))}
                min="0"
                step="1"
              />
            </div>
            {error && <div className="text-red-500">{error}</div>}
            <Button 
              onClick={handleWeightUpdate} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Updating...' : 'Update Weight'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 