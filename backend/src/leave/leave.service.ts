import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { ReviewDecision } from './dto/review-leave.dto';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  create(employeeId: string, dto: CreateLeaveDto) {
    return this.prisma.leaveRequest.create({
      data: {
        employeeId,
        type: dto.type ?? LeaveType.VACATION,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
      },
    });
  }

  findForEmployee(employeeId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { employeeId },
      orderBy: { startDate: 'desc' },
    });
  }

  findAllForCompany(companyId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { employee: { companyId } },
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async review(companyId: string, id: string, reviewedById: string, decision: ReviewDecision) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!leave || leave.employee.companyId !== companyId) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    if (leave.status !== LeaveStatus.PENDING) {
      throw new ForbiddenException('La solicitud ya ha sido revisada');
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: decision as unknown as LeaveStatus,
        reviewedById,
        reviewedAt: new Date(),
      },
    });
  }
}
