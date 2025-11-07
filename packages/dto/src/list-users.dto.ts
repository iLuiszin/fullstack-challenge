import { IsString, IsOptional, IsArray, IsInt, Min, IsUUID } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class ListUsersDto {
  @ApiPropertyOptional({
    description: 'Search by username',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number

  @ApiPropertyOptional({
    description: 'Page size',
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  size?: number

  @ApiPropertyOptional({
    description: 'Filter by specific user IDs',
    isArray: true,
    type: String,
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  ids?: string[]
}
