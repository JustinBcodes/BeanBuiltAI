'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useStore } from '@/store'
import type { ProfileStatsUpdateData } from '@/store' // Import the type
import { useSession } from 'next-auth/react' // Import useSession for update function
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

const goalTypes = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'general_fitness', label: 'General Fitness' },
  { value: 'strength_gain', label: 'Strength Gain' },
  // Added maintenance to align with a previous version if it was intended
  { value: 'maintenance', label: 'Maintain Weight' }, 
];

const experienceLevels = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const KG_TO_LBS = 2.20462;
const INCHES_TO_CM = 2.54;
const CM_TO_INCHES = 1 / INCHES_TO_CM;

// Convert CM to feet and inches
function cmToFeetAndInches(cm: number | null | undefined) {
  if (cm === null || cm === undefined || isNaN(cm) || cm <= 0) return { feet: '', inches: '' };
  const totalInches = cm * CM_TO_INCHES;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet: String(feet), inches: String(inches) };
}

// Convert KG to lbs
function kgToLbs(kg: number | null | undefined) {
  if (kg === null || kg === undefined || isNaN(kg)) return '';
  return String(parseFloat((kg * KG_TO_LBS).toFixed(1)));
}

export function UpdateStats() {
  // Get profile from store but prevent unnecessary re-renders
  const profile = useStore(state => state.profile);
  const storeUpdateProfileStats = useStore(state => state.updateProfileStats);
  
  const { update: updateSession } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const isSubmitting = useRef(false);
  
  // Use a ref to track if initial profile data was loaded
  const profileLoaded = useRef(false);
  
  const [formData, setFormData] = useState({
    name: '',
    currentWeightLbs: '',
    targetWeightLbs: '',
    goalType: '',
    experienceLevel: '',
    heightFeet: '',
    heightInches: '',
    preferredWorkoutDays: [] as string[],
    // Add age and sex if they should be updatable here, API schema supports them
    // age: '',
    // sex: '',
  });

  // Load profile data only once or when profile changes significantly
  useEffect(() => {
    if (profile && (!profileLoaded.current || !formData.name)) {
      profileLoaded.current = true;
      
      // Convert values from API/DB format
      const { feet, inches } = cmToFeetAndInches(profile.height);
      setFormData({
        name: profile.name || '',
        currentWeightLbs: kgToLbs(profile.currentWeight),
        targetWeightLbs: kgToLbs(profile.targetWeight),
        goalType: profile.goalType || '',
        experienceLevel: profile.experienceLevel || '',
        heightFeet: feet,
        heightInches: inches,
        preferredWorkoutDays: profile.preferredWorkoutDays || [],
      });
    } else if (!profile) {
      // Reset form if profile becomes null (e.g., after reset progress)
      profileLoaded.current = false;
      setFormData({
        name: '',
        currentWeightLbs: '',
        targetWeightLbs: '',
        goalType: '',
        experienceLevel: '',
        heightFeet: '',
        heightInches: '',
        preferredWorkoutDays: [] as string[],
      });
    }
  }, [profile]);

  const handleInputChange = useCallback((field: string, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleWorkoutDaysChange = useCallback((day: string) => {
    setFormData(prev => {
      const newWorkoutDays = prev.preferredWorkoutDays.includes(day)
        ? prev.preferredWorkoutDays.filter(d => d !== day)
        : [...prev.preferredWorkoutDays, day];
      return { ...prev, preferredWorkoutDays: newWorkoutDays };
    });
  }, []);

  // Memoize the Select handlers to prevent multiple renders
  const handleGoalTypeChange = useCallback((value: string) => {
    if (value !== formData.goalType) {
      handleInputChange('goalType', value);
    }
  }, [formData.goalType, handleInputChange]);

  const handleExperienceLevelChange = useCallback((value: string) => {
    if (value !== formData.experienceLevel) {
      handleInputChange('experienceLevel', value);
    }
  }, [formData.experienceLevel, handleInputChange]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (loading || isSubmitting.current) return;
    
    isSubmitting.current = true;
    setLoading(true);
    setFormError('');
    
    const heightInTotalInches = formData.heightFeet && formData.heightInches 
      ? (parseInt(formData.heightFeet) * 12) + parseInt(formData.heightInches)
      : undefined;

    // Validate core fields have values
    if (!formData.name?.trim()) {
      setFormError('Name is required');
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    if (heightInTotalInches !== undefined && (heightInTotalInches < 36 || heightInTotalInches > 96)) {
      setFormError('Height must be between 3 and 8 feet');
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    const payload: ProfileStatsUpdateData = {
      name: formData.name || undefined,
      currentWeight: parseFloat(formData.currentWeightLbs) || undefined,
      targetWeight: parseFloat(formData.targetWeightLbs) || undefined,
      height: heightInTotalInches,
      goalType: formData.goalType as ProfileStatsUpdateData['goalType'],
      experienceLevel: formData.experienceLevel as ProfileStatsUpdateData['experienceLevel'],
      preferredWorkoutDays: formData.preferredWorkoutDays,
      // age: formData.age ? parseInt(formData.age) : undefined, // if age field is added
      // sex: formData.sex as ProfileStatsUpdateData['sex'], // if sex field is added
    };

    try {
      const result = await storeUpdateProfileStats(payload);
      if (result.success) {
        toast({
          title: "Stats Updated Successfully",
          description: `Your profile has been updated.${result.plansRegenerated ? ' Your plans have been regenerated based on new stats.' : ''}`,
        });
        
        // Use a non-blocking approach to update session
        fetch('/api/auth/session', { method: 'GET' });
      } else {
        throw new Error(result.error || "Failed to update stats.");
      }
    } catch (error) {
      console.error("Error updating stats:", error);
      setFormError(error instanceof Error ? error.message : 'An unknown error occurred.');
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Could not update your stats. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  // Memoize the Select components to prevent re-renders
  const goalTypeSelect = useMemo(() => (
    <div className="space-y-1.5">
      <Label htmlFor="goalType">Primary Fitness Goal</Label>
      <Select value={formData.goalType || undefined} onValueChange={handleGoalTypeChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select your main goal" />
        </SelectTrigger>
        <SelectContent>
          {goalTypes.map((goal) => (
            <SelectItem key={goal.value} value={goal.value}>{goal.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ), [formData.goalType, handleGoalTypeChange]);

  const experienceLevelSelect = useMemo(() => (
    <div className="space-y-1.5">
      <Label htmlFor="experienceLevel">Experience Level</Label>
      <Select value={formData.experienceLevel || undefined} onValueChange={handleExperienceLevelChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select fitness level" />
        </SelectTrigger>
        <SelectContent>
          {experienceLevels.map((level) => (
            <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ), [formData.experienceLevel, handleExperienceLevelChange]);

  if (!profile && loading) { // Show loading only if profile is null AND initial load might be happening
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading profile data...</p>
      </div>
    );
  }
  // If profile is definitively null after loading (e.g. not logged in, or error state), 
  // this component might show nothing or a message. 
  // For now, it relies on parent to handle non-onboarded state.
  // The form itself will be blank if profile is null due to useEffect.

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Update Your Stats</CardTitle>
        <p className="text-sm text-muted-foreground">
          Keep your profile up-to-date for the most accurate plan personalization.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="E.g., Alex Johnson" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="currentWeightLbs">Current Weight (lbs)</Label>
              <Input id="currentWeightLbs" type="number" value={formData.currentWeightLbs} onChange={(e) => handleInputChange('currentWeightLbs', e.target.value)} required min="50" max="700" step="0.1" placeholder="E.g., 150.5"/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="targetWeightLbs">Target Weight (lbs)</Label>
              <Input id="targetWeightLbs" type="number" value={formData.targetWeightLbs} onChange={(e) => handleInputChange('targetWeightLbs', e.target.value)} required min="50" max="700" step="0.1" placeholder="E.g., 140.0"/>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Height</Label>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Input id="heightFeet" type="number" min="3" max="8" required placeholder="Feet" value={formData.heightFeet} onChange={(e) => handleInputChange('heightFeet', e.target.value)} />
                <span className="text-xs text-muted-foreground pl-1">ft</span>
              </div>
              <div className="flex-1 space-y-1">
                <Input id="heightInches" type="number" min="0" max="11" required placeholder="Inches" value={formData.heightInches} onChange={(e) => handleInputChange('heightInches', e.target.value)} />
                <span className="text-xs text-muted-foreground pl-1">in</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goalTypeSelect}
            {experienceLevelSelect}
          </div>

          <div className="space-y-3">
            <Label>Preferred Workout Days (select at least one)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {daysOfWeek.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`stat-day-${day}`}
                    checked={formData.preferredWorkoutDays.includes(day)}
                    onCheckedChange={() => handleWorkoutDaysChange(day)}
                  />
                  <Label htmlFor={`stat-day-${day}`} className="font-normal cursor-pointer">{day}</Label>
                </div>
              ))}
            </div>
          </div>

          {formError && (
            <p className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-md">{formError}</p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading || !profile}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            {loading ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
// State flow: UpdateStats updates Zustand store, which is read by all dashboard and section components. Changes are persisted via zustand/middleware/persist. 