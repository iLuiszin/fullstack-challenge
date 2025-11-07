import { Priority } from '@repo/types'

export const priorityColors: Record<Priority, string> = {
  [Priority.LOW]: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  [Priority.MEDIUM]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  [Priority.HIGH]: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  [Priority.URGENT]: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}
