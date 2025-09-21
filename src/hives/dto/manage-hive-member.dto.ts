import { IsString, IsUUID } from 'class-validator';

export class ManageHiveMemberDto {
  @IsString()
  @IsUUID()
  userId!: string;
}
