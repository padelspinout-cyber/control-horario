import { IsDateString, IsString, MinLength } from 'class-validator';

export class CorrectEventDto {
  @IsDateString()
  newTimestamp: string;

  @IsString()
  @MinLength(5)
  reason: string;
}
