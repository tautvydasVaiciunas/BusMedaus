import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { User } from './user.entity';

interface SafeUser {
  id: string;
  email: string;
  roles: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toSafeUser(user: User): SafeUser {
  const { id, email, roles, isActive, createdAt, updatedAt } = user;
  return { id, email, roles, isActive, createdAt, updatedAt };
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<SafeUser> {
    const entity = await this.usersService.findByIdOrFail(user.userId);
    return toSafeUser(entity);
  }

  @Roles('admin')
  @Get()
  async listUsers(): Promise<SafeUser[]> {
    const users = await this.usersService.listUsers();
    return users.map(toSafeUser);
  }

  @Roles('admin')
  @Post()
  async createUser(@Body() dto: CreateUserDto): Promise<SafeUser> {
    const user = await this.usersService.createUser(dto);
    return toSafeUser(user);
  }

  @Roles('admin')
  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<SafeUser> {
    const user = await this.usersService.updateUser(id, dto);
    return toSafeUser(user);
  }
}
