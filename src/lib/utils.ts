import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert kg to lbs
export function kgToLbs(kg: number): number {
  return Number((kg * 2.20462).toFixed(1))
}

// Convert lbs to kg
export function lbsToKg(lbs: number): number {
  return Number((lbs / 2.20462).toFixed(1))
}

// Convert cm to feet and inches
export function cmToFeetInches(cm: number): string {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return `${feet}'${inches}"`
}

// Convert feet and inches to cm
export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54)
}
