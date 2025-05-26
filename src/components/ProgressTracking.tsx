'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, TrendingUp, TrendingDown, Target } from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

// Helper function to convert kg to pounds
const kgToLbs = (kg: number): number => {
  return Math.round(kg * 2.20462 * 10) / 10; // Round to 1 decimal place
}

// Helper function to convert pounds to kg
const lbsToKg = (lbs: number): number => {
  return Math.round(lbs / 2.20462 * 10) / 10; // Round to 1 decimal place
}

export function ProgressTracking() {
  const { toast } = useToast()
  const {
    profile,
    weightProgress,
    updateWeightProgress,
    updateCurrentWeight,
  } = useStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newWeight, setNewWeight] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWeight || isNaN(Number(newWeight))) return

    setIsSubmitting(true)
    setError(null)

    try {
      const weightInLbs = Number(newWeight)
      const weightInKg = lbsToKg(weightInLbs)
      
      // Update current weight in the store (which is stored in kg)
      updateCurrentWeight(weightInKg)
      
      // Update weight progress
      await updateWeightProgress(weightInKg)
      
      setNewWeight('')
      
      toast({
        title: "Weight Updated",
        description: "Your weight has been logged successfully.",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update weight')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button
            onClick={() => setError(null)}
            className="mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Required</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please complete your profile to start tracking progress.</p>
        </CardContent>
      </Card>
    )
  }

  // Convert weights from kg to lbs for display
  const currentWeightLbs = kgToLbs(profile.currentWeight)
  const targetWeightLbs = kgToLbs(profile.targetWeight)
  
  // Calculate weight difference in lbs
  const weightDifference = currentWeightLbs - targetWeightLbs
  
  // Calculate progress percentage based on starting weight and current progress
  const startWeight = weightProgress?.weights[0] 
    ? kgToLbs(weightProgress.weights[0]) 
    : currentWeightLbs
  
  const totalWeightToLose = Math.abs(startWeight - targetWeightLbs)
  const weightLostSoFar = Math.abs(startWeight - currentWeightLbs)
  const progressPercentage = totalWeightToLose > 0 
    ? Math.min(100, (weightLostSoFar / totalWeightToLose) * 100)
    : 0

  // Create chart data from weightProgress if available, converting to lbs
  const chartData = weightProgress ? 
    weightProgress.dates.map((date, index) => ({
      date: new Date(date).toLocaleDateString(),
      weight: kgToLbs(weightProgress.weights[index])
    })) : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weight Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Weight (lbs)</Label>
                <Input
                  value={currentWeightLbs.toFixed(1)}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label>Target Weight (lbs)</Label>
                <Input
                  value={targetWeightLbs.toFixed(1)}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div>
              <Label>Progress to Goal</Label>
              <div className="flex items-center gap-2">
                <Progress value={progressPercentage} />
                <span className="text-sm text-gray-500">
                  {Math.abs(weightDifference).toFixed(1)} lbs to go
                </span>
              </div>
            </div>

            <form onSubmit={handleWeightSubmit} className="space-y-4">
              <div>
                <Label>Add New Weight Entry</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="Enter weight in lbs"
                    min={0}
                    step={0.1}
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting || !newWeight}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Add'
                    )}
                  </Button>
                </div>
              </div>
            </form>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis 
                    domain={['dataMin - 5', 'dataMax + 5']} 
                    label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip formatter={(value) => [`${value} lbs`, 'Weight']} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Goal</p>
                      <p className="text-2xl font-bold">{targetWeightLbs.toFixed(1)} lbs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    {weightDifference > 0 ? (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-primary" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Progress</p>
                      <p className="text-2xl font-bold">
                        {Math.abs(weightDifference).toFixed(1)} lbs
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Entries</p>
                      <p className="text-2xl font-bold">{weightProgress ? weightProgress.dates.length : 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 