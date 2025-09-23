import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TasksService } from './tasks.service';
import { TaskPresenter, toTaskPresenter, toTaskPresenterList } from './task.presenter';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('hives/:hiveId/tasks')
  async listTasks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('hiveId') hiveId: string
  ): Promise<TaskPresenter[]> {
    const tasks = await this.tasksService.listTasksForHive(user, hiveId);
    return toTaskPresenterList(tasks);
  }

  @Get('tasks/:id')
  async getTask(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<TaskPresenter> {
    const task = await this.tasksService.getTask(user, id);
    return toTaskPresenter(task);
  }

  @Post('tasks')
  async createTask(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTaskDto): Promise<TaskPresenter> {
    const task = await this.tasksService.createTask(user, dto);
    return toTaskPresenter(task);
  }

  @Put('tasks/:id')
  async updateTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto
  ): Promise<TaskPresenter> {
    const task = await this.tasksService.updateTask(user, id, dto);
    return toTaskPresenter(task);
  }

  @Patch('tasks/:id/status')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto
  ): Promise<TaskPresenter> {
    const task = await this.tasksService.updateTaskStatus(user, id, dto);
    return toTaskPresenter(task);
  }

  @Delete('tasks/:id')
  async deleteTask(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    await this.tasksService.removeTask(user, id);
    return { success: true };
  }

  @Get('tasks')
  async listAccessible(@CurrentUser() user: AuthenticatedUser): Promise<TaskPresenter[]> {
    const tasks = await this.tasksService.listAccessibleTasks(user);
    return toTaskPresenterList(tasks);
  }
}
