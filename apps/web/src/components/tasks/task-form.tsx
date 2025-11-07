import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { CalendarIcon } from 'lucide-react'
import { taskSchema, type TaskFormData } from '@/lib/validations/task.schema'
import { Priority, Status } from '@repo/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { AssigneePicker } from '@/components/users/assignee-picker'
import { cn } from '@/lib/utils'

interface TaskFormProps {
  onSubmit: (data: TaskFormData) => void
  defaultValues?: Partial<TaskFormData>
  isSubmitting?: boolean
  submitLabel?: string
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

export function TaskForm({
  onSubmit,
  defaultValues,
  isSubmitting = false,
  submitLabel = 'Criar Tarefa',
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: Priority.MEDIUM,
      status: Status.TODO,
      ...defaultValues,
    },
  })

  const priority = watch('priority')
  const status = watch('status')
  const assignedUserIds = watch('assignedUserIds') ?? []
  const deadline = watch('deadline')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      {/* Basic Information Section */}
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='title' className='text-sm font-semibold text-gray-700'>
            Título
          </Label>
          <Input
            id='title'
            placeholder='Digite o título da tarefa...'
            className='h-10'
            {...register('title')}
          />
          {errors.title && (
            <p className='text-sm text-destructive'>{errors.title.message}</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='description' className='text-sm font-semibold text-gray-700'>
            Descrição
          </Label>
          <Textarea
            id='description'
            placeholder='Descreva os detalhes da tarefa...'
            rows={4}
            className='break-all resize-none w-full max-w-full'
            {...register('description')}
          />
          {errors.description && (
            <p className='text-sm text-destructive'>
              {errors.description.message}
            </p>
          )}
        </div>
      </div>

      {/* Configuration Section */}
      <div className='space-y-4 pt-4 border-t'>
        <h3 className='text-sm font-semibold text-gray-700'>Configurações</h3>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='priority' className='text-sm font-medium text-gray-600'>
              Prioridade
            </Label>
            <Select
              value={priority}
              onValueChange={(value) => setValue('priority', value as Priority)}
            >
              <SelectTrigger id='priority' className='h-10'>
                <SelectValue placeholder='Selecione' />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.priority && (
              <p className='text-sm text-destructive'>
                {errors.priority.message}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='status' className='text-sm font-medium text-gray-600'>
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(value) => setValue('status', value as Status)}
            >
              <SelectTrigger id='status' className='h-10'>
                <SelectValue placeholder='Selecione' />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className='text-sm text-destructive'>{errors.status.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label className='text-sm font-medium text-gray-600'>Prazo</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className={cn(
                    'w-full h-10 justify-start text-left font-normal',
                    !deadline && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {deadline ? format(deadline, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={deadline}
                  onSelect={(date) => setValue('deadline', date)}
                  defaultMonth={deadline || new Date()}
                  fromDate={new Date()}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.deadline && (
              <p className='text-sm text-destructive'>{errors.deadline.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Assignees Section */}
      <div className='space-y-3 pt-4 border-t'>
        <Label className='text-sm font-semibold text-gray-700'>Responsáveis</Label>
        <AssigneePicker
          value={assignedUserIds}
          onChange={(ids) => setValue('assignedUserIds', ids, { shouldValidate: true })}
        />
        {errors.assignedUserIds && (
          <p className='text-sm text-destructive'>{errors.assignedUserIds.message as string}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className='pt-4'>
        <Button
          type='submit'
          className='w-full h-11 text-base font-medium'
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
