import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateCommentDto, PaginatedComments } from '@repo/types';
import { CommentsService } from './comments.service';
import { Comment } from '../entities/comment.entity';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @MessagePattern('tasks.comments.create')
  async createComment(
    @Payload() createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    return this.commentsService.createComment(createCommentDto);
  }

  @MessagePattern('tasks.comments.findByTaskId')
  async findByTaskId(
    @Payload() data: { taskId: string; page: number; size: number },
  ): Promise<PaginatedComments> {
    return this.commentsService.findByTaskId(
      data.taskId,
      data.page,
      data.size,
    );
  }
}

