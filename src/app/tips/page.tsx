'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { tips, getAllTipCategories } from '@/lib/tips'

export default function TipsPage() {
  const [activeCategory, setActiveCategory] = useState('bulking')
  const categories = getAllTipCategories()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workout Tips</h1>
        <p className="text-gray-500">Expert fitness advice for your fitness journey</p>
      </div>

      <Tabs defaultValue={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full flex mb-6 overflow-auto">
          {categories.map(category => (
            <TabsTrigger 
              key={category} 
              value={category}
              className="flex-1 capitalize"
            >
              {tips[category].title}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{tips[category].title} Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {tips[category].tips.map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 text-primary font-semibold mr-2">{index + 1}.</span>
                      <p>{tip}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
} 