import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateHiveDto } from './dto/create-hive.dto';
import { ManageHiveMemberDto } from './dto/manage-hive-member.dto';
import { UpdateHiveDto } from './dto/update-hive.dto';
import { Hive } from './hive.entity';
import { HivesService } from './hives.service';

interface HiveUserSummary {
  id: string;
  email: string;
  roles: string[];
}

interface HiveResponse {
  id: string;
  name: string;
  description?: string;
  owner: HiveUserSummary;
  members: HiveUserSummary[];
  createdAt: Date;
  updatedAt: Date;
}

function mapUser(user: { id: string; email: string; roles: string[] }): HiveUserSummary {
  return { id: user.id, email: user.email, roles: user.roles };
}

function mapHive(hive: Hive): HiveResponse {
  return {
    id: hive.id,
    name: hive.name,
    description: hive.description,
    owner: mapUser(hive.owner),
    members: hive.members.map(mapUser),
    createdAt: hive.createdAt,
    updatedAt: hive.updatedAt
  };
}

@Controller('hives')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HivesController {
  constructor(private readonly hivesService: HivesService) {}

  @Get()
  async listHives(@CurrentUser() user: AuthenticatedUser): Promise<HiveResponse[]> {
    const hives = await this.hivesService.listHivesForUser(user);
    return hives.map(mapHive);
  }

  @Get(':id')
  async getHive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<HiveResponse> {
    const hive = await this.hivesService.getHiveForUser(user, id);
    return mapHive(hive);
  }

  @Post()
  async createHive(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHiveDto): Promise<HiveResponse> {
    const hive = await this.hivesService.createHive(user, dto);
    return mapHive(hive);
  }

  @Put(':id')
  async updateHive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateHiveDto
  ): Promise<HiveResponse> {
    const hive = await this.hivesService.updateHive(user, id, dto);
    return mapHive(hive);
  }

  @Delete(':id')
  async deleteHive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<{ success: boolean }> {
    await this.hivesService.removeHive(user, id);
    return { success: true };
  }

  @Post(':id/members')
  async addMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') hiveId: string,
    @Body() dto: ManageHiveMemberDto
  ): Promise<HiveResponse> {
    const hive = await this.hivesService.addMember(user, hiveId, dto);
    return mapHive(hive);
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') hiveId: string,
    @Param('memberId') memberId: string
  ): Promise<HiveResponse> {
    const hive = await this.hivesService.removeMember(user, hiveId, memberId);
    return mapHive(hive);
  }
}
