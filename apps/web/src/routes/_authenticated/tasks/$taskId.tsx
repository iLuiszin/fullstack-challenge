import {
  useSuspenseQueries,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { Suspense, useState, useRef, useEffect } from 'react'
import { tasksApi } from '@/lib/api/tasks'
import { queryKeys } from '@/lib/query-keys'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  commentSchema,
  type CommentFormData,
} from '@/lib/validations/comment.schema'
import { TaskForm } from '@/components/tasks/task-form'
import { TaskDetailSkeleton } from '@/components/tasks/task-skeleton'
import { useToast } from '@/hooks/use-toast'
import { Priority, Status, ErrorCode } from '@repo/types'
import type { TaskFormData } from '@/lib/validations/task.schema'
import { priorityColors } from '@/lib/priority-colors'
import { AxiosError } from 'axios'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  User,
  Clock,
  Users,
} from 'lucide-react'
import { useNavigate, createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/layout/page-container'

function TaskDetailErrorComponent({ error }: { error: Error }) {
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const isNotFound =
      error instanceof AxiosError &&
      (error.response?.status === 404 ||
        error.response?.data?.code === ErrorCode.RESOURCE_NOT_FOUND)

    if (isNotFound) {
      toast({
        title: 'Tarefa não encontrada',
        description:
          'A tarefa que você está tentando acessar não existe ou foi removida.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Erro ao carregar tarefa',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
        variant: 'destructive',
      })
    }

    navigate({ to: '/tasks' })
  }, [error, navigate, toast])

  return null
}

export const Route = createFileRoute('/_authenticated/tasks/$taskId')({
  component: TaskDetailPage,
  errorComponent: TaskDetailErrorComponent,
})

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

function TaskDetailPage() {
  const { taskId } = Route.useParams()

  return (
    <PageContainer maxWidth='4xl'>
      <Suspense fallback={<TaskDetailSkeleton />}>
        <TaskDetailContent taskId={taskId} />
      </Suspense>
    </PageContainer>
  )
}

function TaskDetailContent({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTitleVisible, setIsTitleVisible] = useState(true)
  const titleRef = useRef<HTMLHeadingElement>(null)

  const [{ data: task }, { data: commentsData }] = useSuspenseQueries({
    queries: [
      {
        queryKey: queryKeys.tasks.detail(taskId),
        queryFn: () => tasksApi.getTask(taskId),
        retry: false,
      },
      {
        queryKey: queryKeys.tasks.comments(taskId),
        queryFn: () => tasksApi.getComments(taskId),
        retry: false,
      },
    ],
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  })

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => tasksApi.createComment(taskId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.comments(taskId),
      })
      reset()
      toast({
        title: 'Comentário adicionado com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Falha ao adicionar comentário',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
        variant: 'destructive',
      })
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: (data: TaskFormData) => tasksApi.updateTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() })
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.detail(taskId),
      })
      setIsEditDialogOpen(false)
      toast({
        title: 'Tarefa atualizada com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Falha ao atualizar tarefa',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
        variant: 'destructive',
      })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: () => tasksApi.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() })
      toast({
        title: 'Tarefa excluída com sucesso',
      })
      navigate({ to: '/tasks' })
    },
    onError: (error) => {
      toast({
        title: 'Falha ao excluir tarefa',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
        variant: 'destructive',
      })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status: Status) => tasksApi.updateTask(taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() })
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.detail(taskId),
      })
      toast({
        title: 'Status atualizado com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Falha ao atualizar status',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: CommentFormData) => {
    addCommentMutation.mutate(data.content)
  }

  const handleEditTask = (data: TaskFormData) => {
    updateTaskMutation.mutate(data)
  }

  const handleDeleteTask = () => {
    deleteTaskMutation.mutate()
  }

  const handleStatusChange = (status: Status) => {
    updateStatusMutation.mutate(status)
  }

  useEffect(() => {
    const element = titleRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsTitleVisible(entry.isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: '-120px 0px 0px 0px',
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [])

  return (
    <>
      {/* Sticky Header */}
      <div className='sticky top-0 z-10 bg-background border-b mb-6 -mx-6 px-6 py-3'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3 min-w-0 flex-1'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => navigate({ to: '/tasks' })}
              className='flex-shrink-0'
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Voltar
            </Button>
            <h1
              className={`text-lg font-semibold truncate transition-opacity duration-200 ${
                isTitleVisible ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {task.title}
            </h1>
          </div>
          <div className='flex gap-2 flex-shrink-0'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsEditDialogOpen(true)}
              aria-label='Editar tarefa'
            >
              <Pencil className='h-4 w-4 sm:mr-2' />
              <span className='hidden sm:inline'>Editar</span>
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={() => setIsDeleteDialogOpen(true)}
              aria-label='Excluir tarefa'
            >
              <Trash2 className='h-4 w-4 sm:mr-2' />
              <span className='hidden sm:inline'>Excluir</span>
            </Button>
          </div>
        </div>
      </div>

      <Card className='mb-6'>
        <CardHeader className='space-y-4'>
          <CardTitle ref={titleRef} className='text-2xl font-bold break-words'>
            {task.title}
          </CardTitle>

          <div className='flex flex-wrap items-center gap-3 pt-2 border-t border-border'>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-muted-foreground'>Prioridade:</span>
              <Badge className={priorityColors[task.priority]}>
                {priorityLabels[task.priority]}
              </Badge>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-muted-foreground'>Status:</span>
              <Select
                value={task.status}
                onValueChange={handleStatusChange}
                disabled={updateStatusMutation.isPending}
              >
                <SelectTrigger className='w-[160px] h-8'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className='space-y-6'>
          {task.description && (
            <div>
              <h3 className='text-sm font-semibold text-foreground mb-2'>
                Descrição
              </h3>
              <p className='text-muted-foreground leading-relaxed break-all'>
                {task.description}
              </p>
            </div>
          )}

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border'>
            {task.deadline && (
              <div className='flex items-start gap-3 text-muted-foreground'>
                <Calendar className='h-5 w-5 mt-0.5' />
                <div>
                  <p className='text-sm font-medium text-foreground'>Prazo</p>
                  <p className='text-sm'>
                    {new Date(task.deadline).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}

            <div className='flex items-start gap-3 text-muted-foreground'>
              <User className='h-5 w-5 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-foreground'>Criado por</p>
                <p className='text-sm'>
                  {task.creatorName || task.createdBy}
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3 text-muted-foreground'>
              <Clock className='h-5 w-5 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-foreground'>Criado em</p>
                <p className='text-sm'>
                  {new Date(task.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3 text-muted-foreground'>
              <Clock className='h-5 w-5 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-foreground'>
                  Atualizado em
                </p>
                <p className='text-sm'>
                  {new Date(task.updatedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {task.assignees.length > 0 && (
            <div className='flex items-start gap-3 pt-4 border-t border-border text-muted-foreground'>
              <Users className='h-5 w-5 mt-0.5' />
              <div className='flex-1'>
                <p className='text-sm font-medium text-foreground mb-2'>
                  Responsáveis
                </p>
                <div className='flex flex-wrap gap-2'>
                  {task.assignees.map((assignee) => (
                    <Badge
                      key={assignee.id}
                      variant='secondary'
                      className='text-sm'
                    >
                      {assignee.username || assignee.userId}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comentários ({commentsData.total})</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {commentsData.comments.length === 0 ? (
            <p className='text-muted-foreground text-center py-4'>
              Nenhum comentário ainda
            </p>
          ) : (
            commentsData.comments.map((comment) => (
              <div key={comment.id} className='border-l-2 border-border pl-4'>
                <p className='text-sm text-muted-foreground'>
                  {new Date(comment.createdAt).toLocaleString('pt-BR')}
                </p>
                <p className='mt-1'>{comment.content}</p>
              </div>
            ))
          )}

          <form onSubmit={handleSubmit(onSubmit)} className='mt-6 space-y-2'>
            <Label htmlFor='content'>Adicionar Comentário</Label>
            <Textarea
              id='content'
              placeholder='Adicione um comentário...'
              rows={3}
              {...register('content')}
            />
            {errors.content && (
              <p className='text-sm text-destructive'>
                {errors.content.message}
              </p>
            )}
            <Button
              type='submit'
              disabled={addCommentMutation.isPending}
              className='w-full'
            >
              {addCommentMutation.isPending
                ? 'Adicionando...'
                : 'Adicionar Comentário'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
            <DialogDescription>
              Atualize as informações da tarefa
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            onSubmit={handleEditTask}
            defaultValues={{
              title: task.title,
              description: task.description || '',
              priority: task.priority,
              status: task.status,
              deadline: task.deadline
                ? new Date(new Date(task.deadline).setHours(0, 0, 0, 0))
                : undefined,
              assignedUserIds: task.assignees.map((a) => a.userId),
            }}
            isSubmitting={updateTaskMutation.isPending}
            submitLabel='Salvar Alterações'
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Tarefa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteTaskMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeleteTask}
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


