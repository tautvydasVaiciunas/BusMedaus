import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMediaItemDto {
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
