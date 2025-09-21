import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateMediaItemDto } from './dto/create-media-item.dto';
import { UpdateMediaItemDto } from './dto/update-media-item.dto';
import { MediaItem } from './media-item.entity';
import { MediaService } from './media.service';

interface MediaResponse {
  id: string;
  url: string;
  mimeType: string;
  description?: string;
  metadata?: Record<string, unknown> | null;
  inspectionId?: string;
  taskId?: string;
  harvestId?: string;
  auditEventId?: string;
  capturedAt?: Date | null;
  hive: { id: string; name: string };
  uploader: { id: string; email: string };
  createdAt: Date;
  updatedAt: Date;
}

function mapMedia(item: MediaItem): MediaResponse {
  return {
    id: item.id,
    url: item.url,
    mimeType: item.mimeType,
    description: item.description,
    metadata: item.metadata ?? null,
    inspectionId: item.inspectionId ?? undefined,
    taskId: item.taskId ?? undefined,
    harvestId: item.harvestId ?? undefined,
    auditEventId: item.auditEventId ?? undefined,
    capturedAt: item.capturedAt ?? null,
    hive: { id: item.hive.id, name: item.hive.name },
    uploader: { id: item.uploader.id, email: item.uploader.email },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('hives/:hiveId/media')
  async listForHive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('hiveId') hiveId: string
  ): Promise<MediaResponse[]> {
    const items = await this.mediaService.listForHive(user, hiveId);
    return items.map(mapMedia);
  }

  @Get('media/mine')
  async listMine(@CurrentUser() user: AuthenticatedUser): Promise<MediaResponse[]> {
    const items = await this.mediaService.listForUser(user);
    return items.map(mapMedia);
  }

  @Post('media')
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMediaItemDto
  ): Promise<MediaResponse> {
    const item = await this.mediaService.create(user, dto);
    return mapMedia(item);
  }

  @Put('media/:id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateMediaItemDto
  ): Promise<MediaResponse> {
    const item = await this.mediaService.update(user, id, dto);
    return mapMedia(item);
  }

  @Delete('media/:id')
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    await this.mediaService.remove(user, id);
    return { success: true };
  }
}
