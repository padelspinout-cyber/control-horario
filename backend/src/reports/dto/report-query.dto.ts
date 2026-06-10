import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ReportQueryDto {
  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}
