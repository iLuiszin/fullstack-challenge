import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function TaskSkeleton() {
  return (
    <Card className='cursor-pointer hover:shadow-md transition-shadow'>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <Skeleton className='h-7 w-2/3' />
          <div className='flex gap-2'>
            <Skeleton className='h-6 w-16' />
            <Skeleton className='h-6 w-20' />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-5/6' />
        </div>
        <Skeleton className='h-4 w-32 mt-2' />
        <div className='flex gap-2 mt-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-4 w-8' />
        </div>
      </CardContent>
    </Card>
  )
}

export function TaskListSkeleton() {
  return (
    <div className='space-y-4'>
      {Array.from({ length: 5 }).map((_, i) => (
        <TaskSkeleton key={i} />
      ))}
    </div>
  )
}

export function TaskDetailSkeleton() {
  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='flex items-start justify-between'>
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-8 w-3/4' />
              <div className='flex gap-2'>
                <Skeleton className='h-6 w-16' />
                <Skeleton className='h-6 w-20' />
              </div>
            </div>
            <div className='flex gap-2'>
              <Skeleton className='h-9 w-20' />
              <Skeleton className='h-9 w-20' />
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Skeleton className='h-4 w-20 mb-2' />
            <Skeleton className='h-20 w-full' />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Skeleton className='h-4 w-16 mb-2' />
              <Skeleton className='h-4 w-32' />
            </div>
            <div>
              <Skeleton className='h-4 w-24 mb-2' />
              <div className='flex gap-2'>
                <Skeleton className='h-6 w-20' />
                <Skeleton className='h-6 w-20' />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-48' />
        </CardHeader>
        <CardContent className='space-y-4'>
          <Skeleton className='h-24 w-full' />
          <Skeleton className='h-16 w-full' />
        </CardContent>
      </Card>
    </div>
  )
}
