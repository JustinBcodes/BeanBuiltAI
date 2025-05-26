'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, Minus, Info } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const initialData = [
  { name: 'Mon', weight: 165, workouts: 2, calories: 1800 },
  { name: 'Tue', weight: 164, workouts: 1, calories: 1850 },
  { name: 'Wed', weight: 164, workouts: 3, calories: 1750 },
  { name: 'Thu', weight: 163, workouts: 2, calories: 1900 },
  { name: 'Fri', weight: 163, workouts: 2, calories: 1800 },
  { name: 'Sat', weight: 162, workouts: 1, calories: 1950 },
  { name: 'Sun', weight: 162, workouts: 0, calories: 2000 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border">
        <p className="font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
            {entry.name === 'weight' ? ' lbs' : entry.name === 'calories' ? ' cal' : ' workouts'}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function ProgressGraph() {
  const [metric, setMetric] = useState('weight')
  const [data, setData] = useState(initialData)
  const [targetValue, setTargetValue] = useState({
    weight: 160,
    workouts: 3,
    calories: 2000
  })

  const getYAxisDomain = () => {
    switch (metric) {
      case 'weight':
        return [160, 170]
      case 'workouts':
        return [0, 5]
      case 'calories':
        return [1500, 2100]
      default:
        return [0, 100]
    }
  }

  const handleUpdateValue = (day: string, increment: boolean) => {
    setData(prevData => {
      return prevData.map(item => {
        if (item.name === day) {
          const currentValue = item[metric as keyof typeof item] as number
          const newValue = increment ? currentValue + 1 : currentValue - 1
          
          // Validate the new value
          const [min, max] = getYAxisDomain()
          if (newValue >= min && newValue <= max) {
            return { ...item, [metric]: newValue }
          }
          return item
        }
        return item
      })
    })

    toast({
      title: "Progress Updated",
      description: `Updated ${metric} for ${day}`,
    })
  }

  const getMetricLabel = () => {
    switch (metric) {
      case 'weight':
        return 'lbs'
      case 'workouts':
        return 'workouts'
      case 'calories':
        return 'calories'
      default:
        return ''
    }
  }

  const getMetricDescription = () => {
    switch (metric) {
      case 'weight':
        return 'Track your daily weight progress'
      case 'workouts':
        return 'Record your daily workout sessions'
      case 'calories':
        return 'Monitor your daily calorie intake'
      default:
        return ''
    }
  }

  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl font-bold">Weekly Progress</CardTitle>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getMetricDescription()}</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Target: {targetValue[metric as keyof typeof targetValue]} {getMetricLabel()}
            </p>
          </div>
        </div>
        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weight">Weight (lbs)</SelectItem>
            <SelectItem value="workouts">Workouts</SelectItem>
            <SelectItem value="calories">Calories</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={getYAxisDomain()} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={targetValue[metric as keyof typeof targetValue]} 
                stroke="#8884d8" 
                strokeDasharray="3 3" 
                label={{ 
                  value: 'Target', 
                  position: 'right',
                  fill: '#8884d8'
                }} 
              />
              <Bar 
                dataKey={metric} 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center gap-2">
          {data.map((day) => (
            <div key={day.name} className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleUpdateValue(day.name, false)}
                className="h-8 w-8"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{day.name}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleUpdateValue(day.name, true)}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 