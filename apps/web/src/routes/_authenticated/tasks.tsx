import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/tasks')({
  component: TasksPage,
})

function TasksPage() {
  return <div>Tasks Page</div>
}
