'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const goalTypes = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'general_fitness', label: 'General Fitness' },
  { value: 'strength_gain', label: 'Strength Gain' },
  { value: 'maintenance', label: 'Maintenance' },
]

const experienceLevels = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

// Define the goalType type to match the API schema
type GoalType = 'weight_loss' | 'muscle_gain' | 'general_fitness' | 'strength_gain' | 'maintenance'; 
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export function Profile() {
  const { profile, setProfile, updateProfileStats } = useStore(state => ({
    profile: state.profile,
    setProfile: state.setProfile,
    updateProfileStats: state.updateProfileStats
  }))
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    age: profile?.age || '',
    height: profile?.height || '',
    currentWeight: profile?.currentWeight || '',
    targetWeight: profile?.targetWeight || '',
    goalType: profile?.goalType || '',
    experienceLevel: profile?.experienceLevel || '',
    preferredDays: profile?.preferredWorkoutDays || [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate form data
      if (!formData.name || !formData.age || !formData.height || !formData.currentWeight || !formData.targetWeight || !formData.goalType || !formData.experienceLevel) {
        throw new Error('Please fill in all required fields')
      }

      if (formData.preferredDays.length === 0) {
        throw new Error('Please select at least one preferred workout day')
      }

      // Prepare data for the API
      // Map 'maintenance' to 'general_fitness' since the store doesn't support 'maintenance'
      const mappedGoalType = formData.goalType === 'maintenance' ? 'general_fitness' : formData.goalType;
      
      const profileData = {
        name: formData.name,
        age: Number(formData.age),
        height: Number(formData.height),        // In inches, API will convert to cm
        currentWeight: Number(formData.currentWeight),  // In lbs, API will convert to kg
        targetWeight: Number(formData.targetWeight),    // In lbs, API will convert to kg
        goalType: mappedGoalType as 'weight_loss' | 'muscle_gain' | 'general_fitness' | 'strength_gain',
        experienceLevel: formData.experienceLevel as ExperienceLevel,
        preferredWorkoutDays: formData.preferredDays,
      }

      // Update via the API
      const result = await updateProfileStats(profileData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }
      
      toast({
        title: "Profile Updated",
        description: result.plansRegenerated 
          ? "Your profile and fitness plans have been updated." 
          : "Your profile has been updated successfully.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      toast({
        title: "Update Failed",
        description: err instanceof Error ? err.message : 'Failed to update profile',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter((d: string) => d !== day)
        : [...prev.preferredDays, day]
    }))
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Update your personal information and fitness goals</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="Enter your age"
                  min={16}
                  max={100}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="height">Height (inches)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                  placeholder="Enter your height"
                  min={48}
                  max={96}
                  required
                />
              </div>
              <div>
                <Label htmlFor="currentWeight">Current Weight (lbs)</Label>
                <Input
                  id="currentWeight"
                  type="number"
                  value={formData.currentWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentWeight: e.target.value }))}
                  placeholder="Enter your current weight"
                  min={50}
                  max={500}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetWeight">Target Weight (lbs)</Label>
                <Input
                  id="targetWeight"
                  type="number"
                  value={formData.targetWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetWeight: e.target.value }))}
                  placeholder="Enter your target weight"
                  min={50}
                  max={500}
                  required
                />
              </div>
              <div>
                <Label htmlFor="goalType">Goal Type</Label>
                <Select
                  value={formData.goalType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, goalType: value }))}
                >
                  <SelectTrigger id="goalType">
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTypes.map((goal) => (
                      <SelectItem key={goal.value} value={goal.value}>
                        {goal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="experienceLevel">Experience Level</Label>
              <Select
                value={formData.experienceLevel}
                onValueChange={(value) => setFormData(prev => ({ ...prev, experienceLevel: value }))}
              >
                <SelectTrigger id="experienceLevel">
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Preferred Workout Days</Label>
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 mt-2">
                {daysOfWeek.map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={formData.preferredDays.includes(day) ? "default" : "outline"}
                    onClick={() => handleDayToggle(day)}
                    className="w-full"
                  >
                    {day.slice(0, 3)}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 