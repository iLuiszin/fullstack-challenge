import { memo } from 'react'
import type { Task } from '@repo/types'
import { TaskCard } from './task-card'

interface TaskListProps {
  tasks: Task[]
}

export const TaskList = memo(function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className='text-center py-12'>
        <p className='text-muted-foreground text-lg'>Nenhuma tarefa encontrada</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
})
