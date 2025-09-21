import { IsOptional, IsString, IsUrl, IsUUID, MaxLength } from 'class-validator';

export class CreateMediaItemDto {
  @IsUUID()
  hiveId!: string;

  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  metadata?: string;
}
