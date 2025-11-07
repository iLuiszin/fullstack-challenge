import { IsString, IsEnum, IsOptional, IsObject, MinLength, IsUUID, IsBoolean, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { NotificationType } from '@repo/types'
import type { NotificationMetadata } from '@repo/types'

export class CreateNotificationDto {
  @IsString()
  @IsUUID()
  userId!: string

  @IsEnum(NotificationType)
  type!: NotificationType

  @IsString()
  @MinLength(1)
  message!: string

  @IsOptional()
  @IsObject()
  metadata?: NotificationMetadata
}

export class NotificationQueryDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number

  @ApiPropertyOptional({ description: 'Page size', example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  size?: number

  @ApiPropertyOptional({ description: 'Return only unread notifications', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  unreadOnly?: boolean
}
