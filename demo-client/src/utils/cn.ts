// cn.ts
// -----
// Utility function for combining class names
// Simple implementation for className concatenation

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}