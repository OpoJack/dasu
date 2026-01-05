import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Timing threshold constants (FR-005)
export const TIMING_THRESHOLDS = {
  WARNING_MINUTES: 6,
  URGENT_MINUTES: 12,
} as const

// Timing state type
export type TimingState = 'normal' | 'warning' | 'urgent'

// Get timing state based on order creation time (FR-004, FR-005)
export function getTimingState(createdAt: string): TimingState {
  const minutes = (Date.now() - new Date(createdAt).getTime()) / 60000
  if (minutes >= TIMING_THRESHOLDS.URGENT_MINUTES) return 'urgent'
  if (minutes >= TIMING_THRESHOLDS.WARNING_MINUTES) return 'warning'
  return 'normal'
}

// Get Tailwind classes for timing state (FR-006)
// Uses dark: variant for automatic theme-aware colors
export function getTimingClass(state: TimingState): string {
  switch (state) {
    case 'urgent': return 'text-red-600 dark:text-red-400 font-bold'
    case 'warning': return 'text-orange-600 dark:text-orange-400 font-semibold'
    default: return 'text-muted-foreground'
  }
}

// Format elapsed time for display
export function formatElapsed(createdAt: string, now: number): string {
  const seconds = Math.floor((now - new Date(createdAt).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m ago`
}
