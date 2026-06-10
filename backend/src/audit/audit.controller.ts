import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AuditController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        targetEmployee: { companyId: user.companyId },
        ...(employeeId ? { targetEmployeeId: employeeId } : {}),
      },
      include: { targetEmployee: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
