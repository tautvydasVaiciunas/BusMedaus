import { IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNotificationSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  token!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  platform?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
