import type { NutritionPlan, WorkoutPlan } from '@/types/plan-types'

export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
export function groceryList(plan: NutritionPlan, week: number) {
  const groceries = new Map<string, { item: string; quantities: string[]; meals: string[] }>()
  const schedule = plan.multiWeekMealPlans[week]
  if (!schedule) return []
  for (const day of WEEKDAYS) {
    for (const meal of schedule[day]?.meals || []) {
      for (const ingredient of meal.ingredients || []) {
        const key = ingredient.item.trim().toLowerCase()
        if (!key) continue
        const entry = groceries.get(key) || { item: ingredient.item.trim(), quantities: [], meals: [] }
        // Preserve quantities verbatim: "1 cup" and "100 g" cannot safely be summed.
        entry.quantities.push(ingredient.qty)
        if (!entry.meals.includes(meal.name)) entry.meals.push(meal.name)
        groceries.set(key, entry)
      }
    }
  }
  return Array.from(groceries.values()).sort((a, b) => a.item.localeCompare(b.item))
}

export function escapeCalendarText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
}

// RFC 5545 lines are folded by UTF-8 bytes, including multi-byte exercise names.
function foldLine(line: string) {
  const lines: string[] = []
  let current = ''
  for (const char of line) {
    if (Buffer.byteLength(current + char, 'utf8') > 75) { lines.push(current); current = ' ' }
    current += char
  }
  lines.push(current)
  return lines.join('\r\n')
}

export function workoutCalendar(plan: WorkoutPlan, week: number, monday: string, planId: string) {
  const start = new Date(`${monday}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(monday) || !Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== monday || start.getUTCDay() !== 1) throw new Error('Choose a valid Monday for your calendar week.')
  const date = (value: Date) => value.toISOString().slice(0, 10).replace(/-/g, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BeanBuilt AI//Workout Plan//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
  for (const day of plan.multiWeekSchedules[week] || []) {
    const index = WEEKDAYS.indexOf(day.dayOfWeek.toLowerCase())
    if (index < 0 || day.isRestDay || !day.workoutDetails) continue
    const begins = new Date(start); begins.setUTCDate(begins.getUTCDate() + index)
    const ends = new Date(begins); ends.setUTCDate(ends.getUTCDate() + 1)
    const description = day.workoutDetails.exercises.map(exercise => `${exercise.name}: ${exercise.sets} sets x ${exercise.reps}; rest ${exercise.rest}`).join('\n')
    lines.push('BEGIN:VEVENT', `UID:${escapeCalendarText(planId)}-${week}-${date(begins)}@beanbuiltai.com`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`, `DTSTART;VALUE=DATE:${date(begins)}`, `DTEND;VALUE=DATE:${date(ends)}`, `SUMMARY:${escapeCalendarText(day.workoutDetails.workoutName)}`, `DESCRIPTION:${escapeCalendarText(description)}`, 'END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
