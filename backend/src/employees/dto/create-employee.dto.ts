import { IsDateString, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  position: string;

  @IsDateString()
  hireDate: string;

  // Si se proporciona, se crea también un usuario de acceso para este empleado
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
