import { memo } from 'react'
import { Priority, Status } from '@repo/types'
import type { Task } from '@repo/types'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, User } from 'lucide-react'
import { priorityColors } from '@/lib/priority-colors'

interface TaskCardProps {
  task: Task
}

const priorityLabels: Record<Priority, string> = {
  [Priority.LOW]: 'Baixa',
  [Priority.MEDIUM]: 'Média',
  [Priority.HIGH]: 'Alta',
  [Priority.URGENT]: 'Crítica',
}

const statusLabels: Record<Status, string> = {
  [Status.TODO]: 'Pendente',
  [Status.IN_PROGRESS]: 'Em Andamento',
  [Status.REVIEW]: 'Em Revisão',
  [Status.DONE]: 'Concluída',
}

export const TaskCard = memo(function TaskCard({ task }: TaskCardProps) {
  const visibleAssignees = task.assignees.slice(0, 2)
  const remainingCount = task.assignees.length - visibleAssignees.length

  return (
    <Link
      to='/tasks/$taskId'
      params={{ taskId: task.id }}
      preload='intent'
      className='block'
    >
      <Card className='cursor-pointer hover:shadow-md transition-shadow h-full'>
        <CardHeader className='space-y-3'>
          <div className='flex items-start justify-between gap-4'>
            <CardTitle className='text-lg font-semibold min-w-0 flex-1 break-words'>
              {task.title}
            </CardTitle>
            <div className='flex gap-2 flex-wrap flex-shrink-0'>
              <Badge className={priorityColors[task.priority]}>
                {priorityLabels[task.priority]}
              </Badge>
              <Badge variant='outline'>{statusLabels[task.status]}</Badge>
            </div>
          </div>

          {task.description && (
            <p className='text-sm text-muted-foreground line-clamp-2 leading-relaxed'>
              {task.description}
            </p>
          )}
        </CardHeader>

        <CardContent className='space-y-3'>
          <div className='flex flex-col gap-2'>
            {task.deadline && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Calendar className='h-4 w-4 flex-shrink-0' />
                <span>
                  {new Date(task.deadline).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}

            {task.creatorName && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <User className='h-4 w-4 flex-shrink-0' />
                <span>{task.creatorName}</span>
              </div>
            )}

            {task.assignees.length > 0 && (
              <div className='flex items-start gap-2 text-sm text-muted-foreground'>
                <Users className='h-4 w-4 flex-shrink-0 mt-0.5' />
                <div className='flex flex-wrap gap-1.5 items-center'>
                  {visibleAssignees.map((assignee) => (
                    <Badge
                      key={assignee.id}
                      variant='secondary'
                      className='text-xs'
                    >
                      {assignee.username || assignee.userId}
                    </Badge>
                  ))}
                  {remainingCount > 0 && (
                    <Badge variant='secondary' className='text-xs'>
                      +{remainingCount}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
})
