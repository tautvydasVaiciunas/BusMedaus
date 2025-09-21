import { IsString, MinLength } from 'class-validator';

export class ManageHiveMemberDto {
  @IsString()
  @MinLength(1)
  userId!: string;
}
