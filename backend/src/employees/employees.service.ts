import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.employee.findMany({
      where: { companyId },
      orderBy: { lastName: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    return employee;
  }

  async create(companyId: string, dto: CreateEmployeeDto) {
    let userId: string | undefined;

    if (dto.password) {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          companyId,
          email: dto.email,
          passwordHash,
          role: Role.EMPLOYEE,
        },
      });
      userId = user.id;
    }

    return this.prisma.employee.create({
      data: {
        companyId,
        userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        position: dto.position,
        hireDate: new Date(dto.hireDate),
      },
    });
  }

  async update(companyId: string, id: string, dto: UpdateEmployeeDto) {
    await this.findOne(companyId, id);
    return this.prisma.employee.update({ where: { id }, data: dto });
  }
}
