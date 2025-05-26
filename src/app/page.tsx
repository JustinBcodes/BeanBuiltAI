import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Utensils, BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'BeanBuilt AI - Your Personal Fitness Assistant',
  description: 'Track workouts, generate meal plans, and hit your goals with AI',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6 md:space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold text-primary">
            Welcome to BeanBuilt AI
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Your Personal Fitness & Nutrition Co-Pilot
          </p>
          <p className="text-lg text-foreground/80">
            Achieve your health goals with AI-powered workout routines, personalized meal plans, and intelligent progress tracking.
          </p>
          <div className="pt-6 md:pt-8">
            <Button
              asChild
              size="lg"
              className="shadow-lg text-lg px-8 py-6"
            >
              <Link href="/dashboard" className="flex items-center gap-2.5">
                Start My Fitness Journey
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16 md:mt-24">
          <div className="bg-card p-6 rounded-lg shadow-md text-center hover:shadow-xl transition-shadow duration-300">
            <div className="flex justify-center mb-4">
                <Zap className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Smart Workout Plans</h3>
            <p className="text-muted-foreground text-sm">
              Get personalized workout routines tailored to your goals and fitness level, powered by AI.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-md text-center hover:shadow-xl transition-shadow duration-300">
            <div className="flex justify-center mb-4">
                <Utensils className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">AI Nutrition Coach</h3>
            <p className="text-muted-foreground text-sm">
              AI-generated meal plans and nutrition tracking to support your fitness journey effectively.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-md text-center hover:shadow-xl transition-shadow duration-300">
            <div className="flex justify-center mb-4">
                <BarChart3 className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Progress Analytics</h3>
            <p className="text-muted-foreground text-sm">
              Track your progress with detailed analytics, insights, and visual charts.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
