import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { UserService } from './user.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { DEFAULT_RADIX } from '../constants/config.constants'

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get()
  @ApiOperation({ summary: 'List users with search and pagination' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @ApiQuery({ name: 'ids', required: false, type: String, description: 'Comma-separated user IDs' })
  async listUsers(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('ids') ids?: string,
  ) {
    return this.userService.listUsers({
      search,
      page: page ? parseInt(page, DEFAULT_RADIX) : undefined,
      size: size ? parseInt(size, DEFAULT_RADIX) : undefined,
      ids: ids ? ids.split(',') : undefined,
    })
  }
}
