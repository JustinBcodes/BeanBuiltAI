'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card'
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle } from 'lucide-react'
import { useStore } from '@/store'
import { useToast } from '@/components/ui/use-toast'
import { Loading } from '@/components/ui/loading'

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function OnboardingPage() {
  // ALL HOOKS MUST BE AT THE TOP LEVEL
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const setProfile = useStore(state => state.setProfile);
  const setWorkoutPlan = useStore(state => state.setWorkoutPlan);
  const setNutritionPlan = useStore(state => state.setNutritionPlan);
  const initializeProgressFromPlans = useStore(state => state.initializeProgressFromPlans);
  const { toast } = useToast()
  
  const isSubmitting = useRef(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [redirectReady, setRedirectReady] = useState(false) // For redirecting to dashboard
  
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    age: '',
    sex: '',
    currentWeight: '',
    targetWeight: '',
    heightFeet: '',
    heightInches: '',
    goalType: '',
    experienceLevel: '',
    workoutDays: [] as string[],
    weakPoints: '',
    favoriteFoods: '',
    allergies: '',
    targetDate: '',
  })

  // Memoize handlers to prevent re-creation on each render
  const handleInputChange = useCallback((field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, []); // Empty dependency array as setFormData is stable

  const handleWorkoutDaysChange = useCallback((day: string) => {
    setFormData(prev => {
      const newWorkoutDays = prev.workoutDays.includes(day)
        ? prev.workoutDays.filter(d => d !== day)
        : [...prev.workoutDays, day];
      return { ...prev, workoutDays: newWorkoutDays };
    });
  }, []); // Empty dependency array, relies on setFormData

  const handleSexChange = useCallback((value: string) => {
    // Check value against formData.sex is not strictly needed here due to how Select works
    // but can be kept for clarity if preferred. handleInputChange is memoized.
    handleInputChange('sex', value);
  }, [handleInputChange]);

  const handleGoalTypeChange = useCallback((value: string) => {
    handleInputChange('goalType', value);
  }, [handleInputChange]);

  const handleExperienceLevelChange = useCallback((value: string) => {
    handleInputChange('experienceLevel', value);
  }, [handleInputChange]);

  // useEffects are also hooks and must be at the top level or called unconditionally
  useEffect(() => {
    if (session?.user?.name && !formData.name) {
      setFormData(prev => ({ ...prev, name: session.user.name || '' }));
    }
  }, [session?.user?.name, formData.name]);

  useEffect(() => {
    if (redirectReady) {
      router.push('/dashboard');
    }
  }, [redirectReady, router]);

  // useEffect for redirecting if not authenticated
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [sessionStatus, router]);

  // Memoize Select components (these are hook calls via useMemo)
  const sexSelect = useMemo(() => (
    <div className="space-y-1.5 md:col-span-2">
      <Label htmlFor="sex">Sex</Label>
      <Select value={formData.sex || undefined} onValueChange={handleSexChange}>
        <SelectTrigger id="sex">
          <SelectValue placeholder="Select your biological sex" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="male">Male</SelectItem>
          <SelectItem value="female">Female</SelectItem>
        </SelectContent>
      </Select>
      {!formData.sex && <p className="text-xs text-destructive mt-1">This field is required</p>}
    </div>
  ), [formData.sex, handleSexChange]);

  const goalTypeSelect = useMemo(() => (
    <div className="space-y-1.5">
      <Label htmlFor="goalType">Primary Fitness Goal</Label>
      <Select value={formData.goalType || undefined} onValueChange={handleGoalTypeChange}>
        <SelectTrigger id="goalType">
          <SelectValue placeholder="Select your main goal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="weight_loss">Weight Loss</SelectItem>
          <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
          <SelectItem value="general_fitness">General Fitness</SelectItem>
          <SelectItem value="strength_gain">Strength Gain</SelectItem>
        </SelectContent>
      </Select>
      {!formData.goalType && <p className="text-xs text-destructive mt-1">This field is required</p>}
    </div>
  ), [formData.goalType, handleGoalTypeChange]);

  const experienceLevelSelect = useMemo(() => (
    <div className="space-y-1.5">
      <Label htmlFor="experienceLevel">Experience Level</Label>
      <Select value={formData.experienceLevel || undefined} onValueChange={handleExperienceLevelChange}>
        <SelectTrigger id="experienceLevel">
          <SelectValue placeholder="Select your current fitness level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="beginner">Beginner (New to structured exercise)</SelectItem>
          <SelectItem value="intermediate">Intermediate (Consistent exercise for 6+ months)</SelectItem>
          <SelectItem value="advanced">Advanced (Consistent exercise for 1+ years)</SelectItem>
        </SelectContent>
      </Select>
      {!formData.experienceLevel && <p className="text-xs text-destructive mt-1">This field is required</p>}
    </div>
  ), [formData.experienceLevel, handleExperienceLevelChange]);

  // Conditional returns AFTER all hooks have been called.
  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // This isLoading state is for the form submission, not session loading.
  if (isLoading) {
    return <Loading message="Sit tight! We're crafting your personalized fitness and nutrition plans..." />;
  }

  // If session is not authenticated, the useEffect above will trigger a redirect.
  // Render a loading/redirecting message until the redirect happens.
  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Redirecting to sign in...</p>
        <Loader2 className="ml-2 h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // At this point, sessionStatus should be 'authenticated'.
  // If for some reason session is null even if authenticated, it's an edge case, treat as loading/error.
  if (!session) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Authenticating...</p>
        <Loader2 className="ml-2 h-8 w-8 animate-spin text-primary" />
      </div>
    ); 
  }

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return "Please enter your name";
    if (!formData.age) return "Please enter your age";
    if (!formData.sex) return "Please select your sex";
    if (!formData.heightFeet || !formData.heightInches) return "Please enter your height";
    if (!formData.currentWeight) return "Please enter your current weight";
    if (!formData.targetWeight) return "Please enter your target weight";
    if (!formData.goalType) return "Please select your fitness goal";
    if (!formData.experienceLevel) return "Please select your experience level";
    if (formData.workoutDays.length === 0) return "Please select at least one preferred workout day";
    
    // Validate numeric ranges
    if (Number(formData.age) < 13 || Number(formData.age) > 100) return "Age must be between 13 and 100";
    if (Number(formData.heightFeet) < 3 || Number(formData.heightFeet) > 8) return "Height (feet) must be between 3 and 8";
    if (Number(formData.heightInches) < 0 || Number(formData.heightInches) > 11) return "Height (inches) must be between 0 and 11";
    if (Number(formData.currentWeight) < 50 || Number(formData.currentWeight) > 700) return "Current weight must be between 50 and 700 lbs";
    if (Number(formData.targetWeight) < 50 || Number(formData.targetWeight) > 700) return "Target weight must be between 50 and 700 lbs";
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (isLoading || redirectReady || isSubmitting.current) {
      return;
    }
    
    isSubmitting.current = true;
    setIsLoading(true)
    setFormError('')
    
    const validationError = validateForm();
    if (validationError) {
      console.warn('[Onboarding] Validation Error:', validationError);
      setFormError(validationError);
      setIsLoading(false);
      isSubmitting.current = false;
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    try {
      const heightInInches = (parseInt(formData.heightFeet) * 12) + parseInt(formData.heightInches)

      const submissionData = {
        name: formData.name.trim(),
        age: parseInt(formData.age),
        sex: formData.sex,
        currentWeight: parseFloat(formData.currentWeight),
        targetWeight: parseFloat(formData.targetWeight),
        height: heightInInches,
        goalType: formData.goalType,
        experienceLevel: formData.experienceLevel,
        preferredWorkoutDays: formData.workoutDays,
        weakPoints: formData.weakPoints.split(',').map(s => s.trim()).filter(s => s),
        favoriteFoods: formData.favoriteFoods.split(',').map(s => s.trim()).filter(s => s),
        allergies: formData.allergies.split(',').map(s => s.trim()).filter(s => s),
        targetDate: formData.targetDate || undefined,
      }

      toast({
        title: "Saving profile & generating your plans...",
        description: "This may take a few moments. Please wait.",
      })

      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      })
      

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response from API.' }))
        console.error('[Onboarding] API Error Data:', errorData);
        throw new Error(errorData.error || 'An API error occurred.')
      }

      const result = await response.json();
      
      if (result.user && result.workoutPlan && result.nutritionPlan) {
        const profileToStore = {
          id: session?.user?.id || '',
          email: session?.user?.email || '',
          name: result.user.name || '',
          age: result.user.age || 0,
          sex: result.user.sex || '',
          height: result.user.height,
          currentWeight: result.user.weight,
          targetWeight: result.user.targetWeight,
          goalType: result.user.goalType || '',
          experienceLevel: result.user.experienceLevel || '',
          preferredWorkoutDays: result.user.preferredWorkoutDays || [],
          hasCompletedOnboarding: true,
        };

        const updateStore = () => {
          setWorkoutPlan(result.workoutPlan);
          setNutritionPlan(result.nutritionPlan);
          setProfile(profileToStore);
          
          setTimeout(() => {
            initializeProgressFromPlans(result.workoutPlan, result.nutritionPlan);
          }, 0);
        };

        updateStore();
        
        toast({
          title: "Welcome to BeanBuilt AI!",
          description: "Your personalized fitness plan has been generated.",
          duration: 5000,
        });
        
        fetch('/api/auth/session', { method: 'GET' }).finally(() => {
          setRedirectReady(true);
        });

      } else {
        console.error('[Onboarding] Incomplete data received from server. Result:', result);
        throw new Error('Incomplete data received from server');
      }
    } catch (error) {
      console.error('[Onboarding] Error in handleSubmit catch block:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setFormError(`Failed to save profile or generate plans: ${errorMessage}`);
      toast({
        title: "Onboarding Error",
        description: `An error occurred: ${errorMessage}. Please try again.`, 
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
    }
  }

  // The main return for the authenticated and ready state
  return (
    <div className="min-h-screen bg-background py-8 md:py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Tell Us About Yourself
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            This information will help us create your personalized fitness and nutrition plans.
          </p>
        </div>

        {formError && (
          <div className="mb-6 p-4 border border-destructive bg-destructive/10 text-destructive rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p>{formError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => handleInputChange('name', e.target.value)} 
                  required 
                  placeholder="E.g., Alex Johnson" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="age">Age</Label>
                <Input 
                  id="age" 
                  type="number" 
                  value={formData.age} 
                  onChange={(e) => handleInputChange('age', e.target.value)} 
                  required 
                  min="13" 
                  max="100" 
                  placeholder="Years" 
                />
              </div>
              {sexSelect} {/* useMemo hook result used here */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Body Measurements</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label>Height</Label>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <Input 
                      id="heightFeet" 
                      type="number" 
                      min="3" 
                      max="8" 
                      required 
                      placeholder="Feet" 
                      value={formData.heightFeet} 
                      onChange={(e) => handleInputChange('heightFeet', e.target.value)} 
                    />
                    <span className="text-xs text-muted-foreground pl-1">ft</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Input 
                      id="heightInches" 
                      type="number" 
                      min="0" 
                      max="11" 
                      required 
                      placeholder="Inches" 
                      value={formData.heightInches} 
                      onChange={(e) => handleInputChange('heightInches', e.target.value)} 
                    />
                    <span className="text-xs text-muted-foreground pl-1">in</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currentWeight">Current Weight (lbs)</Label>
                <Input 
                  id="currentWeight" 
                  type="number" 
                  value={formData.currentWeight} 
                  onChange={(e) => handleInputChange('currentWeight', e.target.value)} 
                  required 
                  min="50" 
                  max="700" 
                  step="0.1" 
                  placeholder="E.g., 150.5"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="targetWeight">Target Weight (lbs)</Label>
                <Input 
                  id="targetWeight" 
                  type="number" 
                  value={formData.targetWeight} 
                  onChange={(e) => handleInputChange('targetWeight', e.target.value)} 
                  required 
                  min="50" 
                  max="700" 
                  step="0.1" 
                  placeholder="E.g., 140.0"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fitness Goals & Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {goalTypeSelect} {/* useMemo hook result used here */}
              {experienceLevelSelect} {/* useMemo hook result used here */}

              <div className="space-y-1.5">
                <Label htmlFor="targetDate">Target Date (Optional)</Label>
                <Input 
                  id="targetDate" 
                  type="date" 
                  value={formData.targetDate} 
                  onChange={(e) => handleInputChange('targetDate', e.target.value)} 
                />
                <p className="text-xs text-muted-foreground pl-1">When do you aim to achieve this goal?</p>
              </div>

              <div className="space-y-3">
                <Label>Preferred Workout Days (select at least one)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`day-${day}`}
                        checked={formData.workoutDays.includes(day)}
                        onCheckedChange={() => handleWorkoutDaysChange(day)}
                      />
                      <Label htmlFor={`day-${day}`} className="font-normal cursor-pointer">{day}</Label>
                    </div>
                  ))}
                </div>
                {formData.workoutDays.length === 0 && (
                  <p className="text-xs text-destructive">Please select at least one workout day</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workout Preferences & Focus (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label htmlFor="weakPoints">Weak Points / Areas to Focus On</Label>
                <Textarea
                  id="weakPoints"
                  value={formData.weakPoints}
                  onChange={(e) => handleInputChange('weakPoints', e.target.value)}
                  placeholder="E.g., lower back, shoulder mobility, core strength (comma-separated)"
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground pl-1">Help us tailor your plan by listing areas you'd like to improve.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nutrition Details (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="favoriteFoods">Favorite Foods</Label>
                <Textarea
                  id="favoriteFoods"
                  value={formData.favoriteFoods}
                  onChange={(e) => handleInputChange('favoriteFoods', e.target.value)}
                  placeholder="E.g., chicken breast, broccoli, sweet potatoes, almonds (comma-separated)"
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground pl-1">List some healthy foods you enjoy. We'll try to include them!</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="allergies">Allergies or Foods to Avoid</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                  placeholder="E.g., peanuts, shellfish, gluten (comma-separated)"
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground pl-1">Please list any food allergies or dietary restrictions.</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col items-center pt-4">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full md:w-auto" 
              disabled={isLoading || redirectReady || isSubmitting.current}
            >
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />} 
              {isLoading ? 'Generating Your Plan...' : 'Complete Onboarding & Generate Plan'}
            </Button>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              By completing onboarding, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
} 