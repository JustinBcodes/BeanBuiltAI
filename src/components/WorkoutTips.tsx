'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'

interface Tip {
  id: string
  category: 'form' | 'supplements' | 'warmup' | 'cooldown' | 'warning' | 'info'
  content: string
}

const defaultTips: Tip[] = [
  {
    id: '1',
    category: 'form',
    content: 'Always maintain a neutral spine during deadlifts and squats to prevent injury.'
  },
  {
    id: '2',
    category: 'supplements',
    content: 'Consider taking creatine monohydrate 3-5g daily for improved strength and recovery.'
  },
  {
    id: '3',
    category: 'warmup',
    content: 'Start with 5-10 minutes of light cardio followed by dynamic stretching.'
  },
  {
    id: '4',
    category: 'cooldown',
    content: 'End your workout with static stretching to improve flexibility and reduce soreness.'
  },
  {
    id: '5',
    category: 'form',
    content: 'Keep your elbows close to your body during bench press to protect your shoulders.'
  }
]

export function WorkoutTips() {
  const [tips, setTips] = useState<Tip[]>(defaultTips)
  const [showAddTip, setShowAddTip] = useState(false)
  const [newTip, setNewTip] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Tip['category']>('form')

  const addTip = () => {
    if (!newTip.trim()) return

    const tip: Tip = {
      id: Date.now().toString(),
      category: selectedCategory,
      content: newTip.trim()
    }

    setTips([...tips, tip])
    setNewTip('')
    setShowAddTip(false)
  }

  const removeTip = (id: string) => {
    setTips(tips.filter(tip => tip.id !== id))
  }

  const getCategoryColor = (category: Tip['category']) => {
    switch (category) {
      case 'form':
        return 'bg-blue-100 text-blue-800'
      case 'supplements':
        return 'bg-green-100 text-green-800'
      case 'warmup':
        return 'bg-yellow-100 text-yellow-800'
      case 'cooldown':
        return 'bg-purple-100 text-purple-800'
      case 'warning':
        return 'bg-accent text-accent-foreground'
      case 'info':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Workout Tips</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddTip(!showAddTip)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Tip
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {showAddTip && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div>
                <Label>Category</Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as Tip['category'])}
                  className="w-full p-2 border rounded-md mt-1"
                >
                  <option value="form">Form</option>
                  <option value="supplements">Supplements</option>
                  <option value="warmup">Warm-up</option>
                  <option value="cooldown">Cool-down</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
              <div>
                <Label>Tip</Label>
                <Textarea
                  value={newTip}
                  onChange={(e) => setNewTip(e.target.value)}
                  placeholder="Enter your workout tip..."
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddTip(false)}
                >
                  Cancel
                </Button>
                <Button onClick={addTip}>
                  Add Tip
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {tips.map((tip) => (
              <div
                key={tip.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="space-y-2">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(tip.category)}`}>
                    {tip.category.charAt(0).toUpperCase() + tip.category.slice(1)}
                  </span>
                  <p className="text-sm">{tip.content}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTip(tip.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 