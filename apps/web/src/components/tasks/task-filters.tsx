import { Priority, Status } from '@repo/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'

interface TaskFiltersProps {
  search: string
  priority?: Priority
  status?: Status
  onSearchChange: (value: string) => void
  onPriorityChange: (value: Priority | undefined) => void
  onStatusChange: (value: Status | undefined) => void
  onClearFilters: () => void
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

export function TaskFilters({
  search,
  priority,
  status,
  onSearchChange,
  onPriorityChange,
  onStatusChange,
  onClearFilters,
}: TaskFiltersProps) {
  const hasActiveFilters = search !== '' || priority !== undefined || status !== undefined
  const activeFilterCount = [
    search !== '',
    priority !== undefined,
    status !== undefined,
  ].filter(Boolean).length

  return (
    <div className='sticky top-0 z-10 bg-background border-b mb-6 -mx-6 px-6 py-4'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      <div className='space-y-2'>
        <Label htmlFor='search'>Buscar</Label>
        <Input
          id='search'
          placeholder='Buscar tarefas...'
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='priority'>Prioridade</Label>
        <Select
          value={priority ?? 'all'}
          onValueChange={(value) =>
            onPriorityChange(value === 'all' ? undefined : (value as Priority))
          }
        >
          <SelectTrigger id='priority' className='w-full'>
            <SelectValue placeholder='Filtrar por prioridade' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todas</SelectItem>
            {Object.entries(priorityLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='status'>Status</Label>
        <Select
          value={status ?? 'all'}
          onValueChange={(value) =>
            onStatusChange(value === 'all' ? undefined : (value as Status))
          }
        >
          <SelectTrigger id='status' className='w-full'>
            <SelectValue placeholder='Filtrar por status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todos</SelectItem>
            {Object.entries(statusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      </div>

      {hasActiveFilters && (
        <div className='mt-4 flex items-center justify-end'>
          <Button
            variant='outline'
            size='sm'
            onClick={onClearFilters}
            className='text-sm'
          >
            <X className='h-4 w-4 mr-2' />
            Limpar {activeFilterCount} {activeFilterCount === 1 ? 'filtro' : 'filtros'}
          </Button>
        </div>
      )}
    </div>
  )
}
