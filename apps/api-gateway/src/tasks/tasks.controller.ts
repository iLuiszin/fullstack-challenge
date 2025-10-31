import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateTaskDto,
  UpdateTaskDto,
  CreateCommentDto,
  TaskFilters,
} from '@repo/types';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../auth';
import { CurrentUser } from '@repo/decorators';
import type { JwtPayload } from '@repo/types';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TasksController {
  constructor(@Inject('TASKS') private readonly tasksClient: ClientProxy) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  async createTask(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const taskData = {
      ...createTaskDto,
      createdBy: user.id,
      correlationId: uuidv4(),
    };
    return firstValueFrom(this.tasksClient.send('tasks.create', taskData));
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with filters' })
  async getTasks(@Query() filters: TaskFilters) {
    return firstValueFrom(this.tasksClient.send('tasks.findAll', filters));
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get tasks for a specific user' })
  async getTasksByUser(
    @Param('userId') userId: string,
    @Query() filters: TaskFilters,
  ) {
    return firstValueFrom(
      this.tasksClient.send('tasks.findByUser', { userId, filters }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  async getTaskById(@Param('id') id: string) {
    return firstValueFrom(this.tasksClient.send('tasks.findById', { id }));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task' })
  async updateTask(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const taskData = {
      ...updateTaskDto,
      updatedBy: user.id,
      correlationId: uuidv4(),
    };
    return firstValueFrom(
      this.tasksClient.send('tasks.update', { id, dto: taskData }),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  async deleteTask(@Param('id') id: string) {
    return firstValueFrom(this.tasksClient.send('tasks.delete', { id }));
  }

  @Post(':taskId/comments')
  @ApiOperation({ summary: 'Create a comment on a task' })
  async createComment(
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const commentData = {
      ...createCommentDto,
      taskId,
      authorId: user.id,
      correlationId: uuidv4(),
    };
    return firstValueFrom(
      this.tasksClient.send('tasks.comments.create', commentData),
    );
  }

  @Get(':taskId/comments')
  @ApiOperation({ summary: 'Get comments for a task' })
  async getComments(
    @Param('taskId') taskId: string,
    @Query('page') page?: number,
    @Query('size') size?: number,
  ) {
    return firstValueFrom(
      this.tasksClient.send('tasks.comments.findByTaskId', {
        taskId,
        page: page || 1,
        size: size || 10,
      }),
    );
  }
}
