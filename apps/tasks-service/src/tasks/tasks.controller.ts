import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { Task, PaginatedTasks } from '@repo/types'
import { CreateTaskDto, UpdateTaskDto, TaskFilters } from '@repo/dto'
import { TasksService } from './tasks.service'

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @MessagePattern('tasks.create')
  async createTask(@Payload() createTaskDto: CreateTaskDto): Promise<Task> {
    return this.tasksService.create(createTaskDto);
  }

  @MessagePattern('tasks.update')
  async updateTask(
    @Payload() data: { id: string; dto: UpdateTaskDto },
  ): Promise<Task> {
    return this.tasksService.update(data.id, data.dto);
  }

  @MessagePattern('tasks.findById')
  async findById(@Payload() data: { id: string }): Promise<Task> {
    return this.tasksService.findOne(data.id);
  }

  @MessagePattern('tasks.findAll')
  async findAll(@Payload() filters: TaskFilters): Promise<PaginatedTasks> {
    return this.tasksService.findAll(filters);
  }

  @MessagePattern('tasks.delete')
  async deleteTask(@Payload() data: { id: string }): Promise<{ success: boolean; id: string }> {
    return this.tasksService.remove(data.id);
  }

  @MessagePattern('tasks.findByUser')
  async findByUser(
    @Payload() data: { userId: string; filters: TaskFilters },
  ): Promise<PaginatedTasks> {
    return this.tasksService.findByUser(data.userId, data.filters);
  }
}
