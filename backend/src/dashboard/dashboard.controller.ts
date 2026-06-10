import { Controller, Get, UseGuards } from '@nestjs/common';
import { LeaveStatus, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { computeWorkedMs, startOfDay } from '../common/time-calc.util';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class DashboardController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getSummary(@CurrentUser() user: CurrentUserPayload) {
    const employees = await this.prisma.employee.findMany({
      where: { companyId: user.companyId },
      include: {
        clockEvents: { where: { timestamp: { gte: startOfDay(new Date()) } } },
      },
    });

    const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');

    let working = 0;
    let onBreak = 0;
    let totalHoursToday = 0;

    for (const employee of activeEmployees) {
      const sorted = [...employee.clockEvents].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );
      const { status, workedMs } = computeWorkedMs(sorted);
      totalHoursToday += workedMs / 3_600_000;
      if (status === 'WORKING') working++;
      if (status === 'PAUSED') onBreak++;
    }

    const pendingLeave = await this.prisma.leaveRequest.count({
      where: { status: LeaveStatus.PENDING, employee: { companyId: user.companyId } },
    });

    return {
      activeEmployees: activeEmployees.length,
      working,
      onBreak,
      absent: activeEmployees.length - working - onBreak,
      hoursRecordedToday: Math.round(totalHoursToday * 100) / 100,
      pendingLeaveRequests: pendingLeave,
    };
  }
}
