import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo, Suspense } from 'react'
import { tasksApi } from '@/lib/api/tasks'
import { queryKeys } from '@/lib/query-keys'
import { TaskList } from '@/components/tasks/task-list'
import { TaskFilters } from '@/components/tasks/task-filters'
import { TaskForm } from '@/components/tasks/task-form'
import { TaskListSkeleton } from '@/components/tasks/task-skeleton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useDebounce } from '@/hooks/use-debounce'
import {
  Priority,
  Status,
  type TaskFilterParams as TaskFiltersType,
} from '@repo/types'
import type { TaskFormData } from '@/lib/validations/task.schema'
import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'

export const Route = createFileRoute('/_authenticated/tasks')({
  component: TasksPage,
})

function TasksPage() {
  const isDetail = useRouterState({
    select: (s) =>
      s.matches.some((m) => m.routeId === '/_authenticated/tasks/$taskId'),
  })

  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [filters, setFilters] = useState<TaskFiltersType>({
    page: 1,
    size: 10,
  })

  const queryFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch || undefined }),
    [filters, debouncedSearch],
  )

  const createTaskMutation = useMutation({
    mutationFn: tasksApi.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() })
      setIsDialogOpen(false)
      toast({
        title: 'Tarefa criada com sucesso!',
        description: 'A tarefa foi adicionada à lista',
      })
    },
    onError: (error) => {
      toast({
        title: 'Falha ao criar tarefa',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
        variant: 'destructive',
      })
    },
  })

  if (isDetail) {
    return (
      <PageContainer>
        <Outlet />
      </PageContainer>
    )
  }

  const handleCreateTask = (data: TaskFormData) => {
    createTaskMutation.mutate(data)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setFilters((prev) => ({ ...prev, page: 1 }))
  }

  const handlePriorityChange = (value: Priority | undefined) => {
    setFilters((prev) => ({ ...prev, priority: value, page: 1 }))
  }

  const handleStatusChange = (value: Status | undefined) => {
    setFilters((prev) => ({ ...prev, status: value, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  const handleClearFilters = () => {
    setSearch('')
    setFilters({
      page: 1,
      size: 10,
    })
  }

  return (
    <PageContainer>
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6'>
        <h1 className='text-3xl font-bold'>Tarefas</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='h-4 w-4 mr-2' />
              Criar Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Criar Nova Tarefa</DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para criar uma nova tarefa
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              onSubmit={handleCreateTask}
              isSubmitting={createTaskMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <TaskFilters
        search={search}
        priority={filters.priority}
        status={filters.status}
        onSearchChange={handleSearchChange}
        onPriorityChange={handlePriorityChange}
        onStatusChange={handleStatusChange}
        onClearFilters={handleClearFilters}
      />

      <Suspense fallback={<TaskListSkeleton />}>
        <TaskListContent
          filters={queryFilters}
          onPageChange={handlePageChange}
        />
      </Suspense>
    </PageContainer>
  )
}

function TaskListContent({
  filters,
  onPageChange,
}: {
  filters: TaskFiltersType
  onPageChange: (page: number) => void
}) {
  const { data } = useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () => tasksApi.getTasks(filters),
    retry: 1,
    placeholderData: {
      tasks: [],
      total: 0,
      page: filters.page ?? 1,
      size: filters.size ?? 10,
      totalPages: 0,
    },
  })

  if (!data) {
    return null
  }

  return (
    <>
      <TaskList tasks={data.tasks} />

      {data.totalPages > 1 && (
        <div className='flex items-center justify-center gap-2 mt-6'>
          <Button
            variant='outline'
            disabled={data.page === 1}
            onClick={() => onPageChange(data.page - 1)}
          >
            Anterior
          </Button>
          <span className='text-sm text-muted-foreground'>
            Página {data.page} de {data.totalPages}
          </span>
          <Button
            variant='outline'
            disabled={data.page === data.totalPages}
            onClick={() => onPageChange(data.page + 1)}
          >
            Próximo
          </Button>
        </div>
      )}
    </>
  )
}
