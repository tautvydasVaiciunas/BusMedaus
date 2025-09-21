import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength
} from 'class-validator';
import { TaskStatus } from '../task-status.enum';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  assignedToId?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsBoolean()
  unassign?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  inspectionId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  templateId?: string;
}
