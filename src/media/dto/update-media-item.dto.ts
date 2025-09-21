import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMediaItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  mimeType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MinLength(1)
  inspectionId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  taskId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  harvestId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  auditEventId?: string;

  @IsOptional()
  @IsDateString()
  capturedAt?: string;
}
