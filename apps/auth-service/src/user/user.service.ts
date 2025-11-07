import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like, In, FindOptionsWhere } from 'typeorm'
import { User } from '../entities/user.entity'
import { RegisterDto } from '@repo/dto'
import { PAGINATION_CONFIG } from '../constants/config.constants'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(registerDto: RegisterDto): Promise<User> {
    const newUser = this.userRepository.create(registerDto);
    return await this.userRepository.save(newUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    return await this.userRepository.findOne({ where: { email: normalizedEmail } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { username } });
  }

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async updateHashedRefreshToken(userId: string, hashedRefreshToken: string | null): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.hashedRefreshToken = hashedRefreshToken || undefined;
      await this.userRepository.save(user);
    }
  }

  async findAll(params: {
    search?: string
    page?: number
    size?: number
    ids?: string[]
  }): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    const {
      search = '',
      page = PAGINATION_CONFIG.DEFAULT_PAGE,
      size = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
      ids,
    } = params
    const skip = (page - 1) * size

    const where: FindOptionsWhere<User> = ids ? { id: In(ids) } : {}

    if (search && !ids) {
      const sanitizedSearch = search.replace(/[%_]/g, '\\$&')
      where.username = Like(`%${sanitizedSearch}%`)
    }

    const [users, total] = await this.userRepository.findAndCount({
      where,
      take: size,
      skip,
      select: ['id', 'username', 'email', 'createdAt'],
      order: { username: 'ASC' },
    })

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / size),
    }
  }
}
