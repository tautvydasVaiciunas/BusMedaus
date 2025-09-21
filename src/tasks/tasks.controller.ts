import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { Task } from './task.entity';
import { TasksService } from './tasks.service';

interface TaskUserSummary {
  id: string;
  email: string;
  roles: string[];
}

interface TaskHiveSummary {
  id: string;
  name: string;
}

interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  dueDate?: Date | null;
  inspectionId?: string;
  templateId?: string;
  hive: TaskHiveSummary;
  assignedTo?: TaskUserSummary | null;
  createdBy: TaskUserSummary;
  createdAt: Date;
  updatedAt: Date;
}

function mapUser(user?: { id: string; email: string; roles: string[] } | null): TaskUserSummary | null {
  if (!user) {
    return null;
  }
  return { id: user.id, email: user.email, roles: user.roles };
}

function mapTask(task: Task): TaskResponse {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ?? null,
    inspectionId: task.inspectionId ?? undefined,
    templateId: task.templateId ?? undefined,
    hive: { id: task.hive.id, name: task.hive.name },
    assignedTo: mapUser(task.assignedTo),
    createdBy: mapUser(task.createdBy)!,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('hives/:hiveId/tasks')
  async listTasks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('hiveId') hiveId: string
  ): Promise<TaskResponse[]> {
    const tasks = await this.tasksService.listTasksForHive(user, hiveId);
    return tasks.map(mapTask);
  }

  @Get('tasks/:id')
  async getTask(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<TaskResponse> {
    const task = await this.tasksService.getTask(user, id);
    return mapTask(task);
  }

  @Post('tasks')
  async createTask(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTaskDto): Promise<TaskResponse> {
    const task = await this.tasksService.createTask(user, dto);
    return mapTask(task);
  }

  @Put('tasks/:id')
  async updateTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto
  ): Promise<TaskResponse> {
    const task = await this.tasksService.updateTask(user, id, dto);
    return mapTask(task);
  }

  @Patch('tasks/:id/status')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto
  ): Promise<TaskResponse> {
    const task = await this.tasksService.updateTaskStatus(user, id, dto);
    return mapTask(task);
  }

  @Delete('tasks/:id')
  async deleteTask(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    await this.tasksService.removeTask(user, id);
    return { success: true };
  }
}
