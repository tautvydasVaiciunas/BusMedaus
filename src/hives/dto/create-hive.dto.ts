import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength
} from 'class-validator';
import { HiveStatus } from '../hive.entity';

export class CreateHiveDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  apiaryName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  location?: string;

  @IsOptional()
  @IsEnum(HiveStatus)
  status?: HiveStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  queenStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  temperament?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  healthScore?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  memberIds?: string[];
}
