'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useState, useEffect } from 'react'
import { useStore } from '@/store'
import { toast } from '@/components/ui/use-toast'
import { Loader2, RefreshCw, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { data: session } = useSession()
  const { profile, updateProfileStats, resetProgress } = useStore()
  const router = useRouter()
  
  const [name, setName] = useState('')
  const [goalType, setGoalType] = useState<'weight_loss' | 'muscle_gain' | 'general_fitness' | 'strength_gain'>('weight_loss')
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showReonboardDialog, setShowReonboardDialog] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [workoutReminders, setWorkoutReminders] = useState(false)

  // Load data from profile
  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setGoalType(profile.goalType as any || 'weight_loss')
      setExperienceLevel(profile.experienceLevel as any || 'intermediate')
    }
  }, [profile])

  if (!session) {
    return <div>Please sign in to access this page.</div>
  }

  const handleSaveChanges = async () => {
    setIsSaving(true)
    
    try {
      // Update profile through store
      const result = await updateProfileStats({
        name,
        goalType,
        experienceLevel,
      })
      
      if (result.success) {
        toast({
          title: "Settings Saved",
          description: "Your settings have been updated successfully.",
        })
      } else {
        throw new Error(result.error || "Failed to update settings")
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetAllProgress = async () => {
    setIsResetting(true)
    setShowResetDialog(false)
    try {
      await resetProgress()
      toast({
        title: "Progress Reset Successful",
        description: "All your fitness data has been reset. You will now go through onboarding again.",
      })
      router.push('/onboarding')
    } catch (error) {
      console.error("Error resetting progress:", error)
      toast({
        title: "Reset Failed",
        description: "Could not reset your progress. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  const handleReonboard = async () => {
    setIsResetting(true)
    setShowReonboardDialog(false)
    try {
      await resetProgress()
      toast({
        title: "Ready for Re-Onboarding",
        description: "Your plans and progress have been cleared. Let's set up your new fitness journey!",
      })
      router.push('/onboarding')
    } catch (error) {
      console.error("Error initiating re-onboarding:", error)
      toast({
        title: "Action Failed",
        description: "Could not start the re-onboarding process. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  const toggleEmailNotifications = () => {
    setEmailNotifications(prev => !prev)
    toast({
      title: `Email Notifications ${emailNotifications ? 'Disabled' : 'Enabled'}`,
      description: `You will ${emailNotifications ? 'no longer' : 'now'} receive email notifications.`,
    })
  }

  const toggleWorkoutReminders = () => {
    setWorkoutReminders(prev => !prev)
    toast({
      title: `Workout Reminders ${workoutReminders ? 'Disabled' : 'Enabled'}`,
      description: `You will ${workoutReminders ? 'no longer' : 'now'} receive workout reminders.`,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={session.user?.email || ''} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fitness Preferences</CardTitle>
            <CardDescription>Adjust your fitness goals and how you prefer to train. These will affect new plan generations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goalType">Primary Fitness Goal</Label>
              <Select 
                value={goalType}
                onValueChange={(value) => setGoalType(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select goal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight_loss">Weight Loss</SelectItem>
                  <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                  <SelectItem value="general_fitness">General Fitness</SelectItem>
                  <SelectItem value="strength_gain">Strength Gain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Experience Level</Label>
              <Select 
                value={experienceLevel}
                onValueChange={(value) => setExperienceLevel(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="text-md font-semibold mb-2 text-destructive">Danger Zone</h3>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-destructive/30 rounded-md">
                  <div>
                    <p className="font-medium">Reset All Progress</p>
                    <p className="text-xs text-muted-foreground">Clear all workout, nutrition, and weight history. Your plans will be removed, and you will need to complete onboarding again. Basic profile info (name, email, age) will be kept.</p>
                  </div>
                  <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="mt-2 sm:mt-0 sm:ml-4 shrink-0" disabled={isResetting}>
                        {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Reset All Progress
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will permanently clear all your fitness progress (workouts, meals, weight) and remove your current plans. Your basic account details will remain. You will be guided through onboarding again.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetAllProgress} disabled={isResetting} className="bg-destructive hover:bg-destructive/90">
                          {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Yes, Reset Progress
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-border rounded-md">
                  <div>
                    <p className="font-medium">Complete Onboarding Again</p>
                    <p className="text-xs text-muted-foreground">Re-do the onboarding process to generate new plans based on potentially updated preferences or goals. This will clear your current plans and progress. Basic profile info will be kept.</p>
                  </div>
                  <AlertDialog open={showReonboardDialog} onOpenChange={setShowReonboardDialog}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="mt-2 sm:mt-0 sm:ml-4 shrink-0" disabled={isResetting}> 
                        {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />} Re-Onboard
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Complete Onboarding Again?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will clear your current fitness plans and logged progress, allowing you to go through the onboarding process again. Your basic account details will be preserved. Are you sure?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReonboard} disabled={isResetting}>
                          {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Yes, Start Re-Onboarding
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive updates about your progress</p>
              </div>
              <Button 
                variant={emailNotifications ? "default" : "outline"}
                onClick={toggleEmailNotifications}
              >
                {emailNotifications ? "Disable" : "Enable"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Workout Reminders</Label>
                <p className="text-sm text-gray-500">Get reminded about your scheduled workouts</p>
              </div>
              <Button 
                variant={workoutReminders ? "default" : "outline"}
                onClick={toggleWorkoutReminders}
              >
                {workoutReminders ? "Disable" : "Enable"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            onClick={handleSaveChanges}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
} 