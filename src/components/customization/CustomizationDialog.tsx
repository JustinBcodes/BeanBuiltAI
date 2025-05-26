import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { useStore } from '@/store'
import { Settings2 } from 'lucide-react'

interface CustomizationDialogProps {
  type: 'workout' | 'meal'
  day: string
  item: any
  onUpdate: (updatedItem: any) => void
}

export function CustomizationDialog({ type, day, item, onUpdate }: CustomizationDialogProps) {
  const [open, setOpen] = useState(false)
  const [customItem, setCustomItem] = useState(item)
  const { toast } = useToast()
  
  // Fallback data since exerciseDatabase and nutritionDatabase don't exist in store yet
  const exerciseDatabase: Record<string, any[]> = {
    chest: [
      { name: 'Push-ups', sets: 3, reps: '10-15', muscleGroup: 'chest' },
      { name: 'Bench Press', sets: 3, reps: '8-12', muscleGroup: 'chest' },
      { name: 'Dumbbell Flyes', sets: 3, reps: '10-12', muscleGroup: 'chest' }
    ],
    back: [
      { name: 'Pull-ups', sets: 3, reps: '5-10', muscleGroup: 'back' },
      { name: 'Rows', sets: 3, reps: '8-12', muscleGroup: 'back' }
    ],
    legs: [
      { name: 'Squats', sets: 3, reps: '10-15', muscleGroup: 'legs' },
      { name: 'Lunges', sets: 3, reps: '10-12', muscleGroup: 'legs' }
    ]
  }
  const nutritionDatabase = {}

  const handleSave = () => {
    onUpdate(customItem)
    setOpen(false)
    toast({
      title: "Customization saved",
      description: `Your ${type} has been updated successfully.`
    })
  }

  const renderWorkoutCustomization = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Workout Name</Label>
        <Input
          value={customItem.name}
          onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Workout Type</Label>
        <Select
          value={customItem.type}
          onValueChange={(value) => setCustomItem({ ...customItem, type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="strength">Strength</SelectItem>
            <SelectItem value="cardio">Cardio</SelectItem>
            <SelectItem value="hiit">HIIT</SelectItem>
            <SelectItem value="flexibility">Flexibility</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Exercises</Label>
        {customItem.exercises.map((exercise: any, index: number) => (
          <div key={index} className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Label>Exercise {index + 1}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newExercises = [...customItem.exercises]
                  newExercises.splice(index, 1)
                  setCustomItem({ ...customItem, exercises: newExercises })
                }}
              >
                Remove
              </Button>
            </div>
            <Select
              value={exercise.name}
              onValueChange={(value) => {
                if (exerciseDatabase && exercise.muscleGroup && exerciseDatabase[exercise.muscleGroup]) {
                  const newExercise = exerciseDatabase[exercise.muscleGroup].find(
                    (e: any) => e.name === value
                  )
                  if (newExercise) {
                    const newExercises = [...customItem.exercises]
                    newExercises[index] = newExercise
                    setCustomItem({ ...customItem, exercises: newExercises })
                  }
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select exercise" />
              </SelectTrigger>
              <SelectContent>
                {exerciseDatabase && exercise.muscleGroup && exerciseDatabase[exercise.muscleGroup] ? (
                  exerciseDatabase[exercise.muscleGroup].map((e: any) => (
                    <SelectItem key={e.name} value={e.name}>
                      {e.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-exercises" disabled>
                    No exercises available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Sets</Label>
                <Input
                  type="number"
                  value={exercise.sets}
                  onChange={(e) => {
                    const newExercises = [...customItem.exercises]
                    newExercises[index].sets = parseInt(e.target.value)
                    setCustomItem({ ...customItem, exercises: newExercises })
                  }}
                />
              </div>
              <div>
                <Label>Reps</Label>
                <Input
                  value={exercise.reps}
                  onChange={(e) => {
                    const newExercises = [...customItem.exercises]
                    newExercises[index].reps = e.target.value
                    setCustomItem({ ...customItem, exercises: newExercises })
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setCustomItem({
              ...customItem,
              exercises: [
                ...customItem.exercises,
                {
                  name: 'New Exercise',
                  sets: 3,
                  reps: '10-12',
                  muscleGroup: 'chest'
                }
              ]
            })
          }}
        >
          Add Exercise
        </Button>
      </div>
    </div>
  )

  const renderMealCustomization = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Meal Name</Label>
        <Input
          value={customItem.name}
          onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Ingredients</Label>
        {customItem.ingredients.map((ingredient: any, index: number) => (
          <div key={index} className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ingredient {index + 1}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newIngredients = [...customItem.ingredients]
                  newIngredients.splice(index, 1)
                  setCustomItem({ ...customItem, ingredients: newIngredients })
                }}
              >
                Remove
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Name</Label>
                <Input
                  value={ingredient.name}
                  onChange={(e) => {
                    const newIngredients = [...customItem.ingredients]
                    newIngredients[index].name = e.target.value
                    setCustomItem({ ...customItem, ingredients: newIngredients })
                  }}
                />
              </div>
              <div>
                <Label>Amount</Label>
                <Input
                  value={ingredient.amount}
                  onChange={(e) => {
                    const newIngredients = [...customItem.ingredients]
                    newIngredients[index].amount = e.target.value
                    setCustomItem({ ...customItem, ingredients: newIngredients })
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label>Calories</Label>
                <Input
                  type="number"
                  value={ingredient.calories}
                  onChange={(e) => {
                    const newIngredients = [...customItem.ingredients]
                    newIngredients[index].calories = parseInt(e.target.value)
                    setCustomItem({ ...customItem, ingredients: newIngredients })
                  }}
                />
              </div>
              <div>
                <Label>Protein</Label>
                <Input
                  type="number"
                  value={ingredient.protein}
                  onChange={(e) => {
                    const newIngredients = [...customItem.ingredients]
                    newIngredients[index].protein = parseInt(e.target.value)
                    setCustomItem({ ...customItem, ingredients: newIngredients })
                  }}
                />
              </div>
              <div>
                <Label>Carbs</Label>
                <Input
                  type="number"
                  value={ingredient.carbs}
                  onChange={(e) => {
                    const newIngredients = [...customItem.ingredients]
                    newIngredients[index].carbs = parseInt(e.target.value)
                    setCustomItem({ ...customItem, ingredients: newIngredients })
                  }}
                />
              </div>
              <div>
                <Label>Fats</Label>
                <Input
                  type="number"
                  value={ingredient.fats}
                  onChange={(e) => {
                    const newIngredients = [...customItem.ingredients]
                    newIngredients[index].fats = parseInt(e.target.value)
                    setCustomItem({ ...customItem, ingredients: newIngredients })
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setCustomItem({
              ...customItem,
              ingredients: [
                ...customItem.ingredients,
                {
                  name: 'New Ingredient',
                  amount: '1 serving',
                  calories: 0,
                  protein: 0,
                  carbs: 0,
                  fats: 0
                }
              ]
            })
          }}
        >
          Add Ingredient
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Prep Time</Label>
        <Input
          value={customItem.prepTime}
          onChange={(e) => setCustomItem({ ...customItem, prepTime: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Instructions</Label>
        <Input
          value={customItem.instructions}
          onChange={(e) => setCustomItem({ ...customItem, instructions: e.target.value })}
        />
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Customize
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Customize {type === 'workout' ? 'Workout' : 'Meal'} for {day}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {type === 'workout' ? renderWorkoutCustomization() : renderMealCustomization()}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 