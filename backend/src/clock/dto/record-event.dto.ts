import { IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';

export class RecordEventDto {
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
