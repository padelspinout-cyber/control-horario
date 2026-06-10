import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ClockEventType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecordEventDto } from './dto/record-event.dto';
import { CorrectEventDto } from './dto/correct-event.dto';
import { computeWorkedMs, startOfDay, startOfMonth, startOfWeek } from '../common/time-calc.util';

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

const NEXT_EVENT: Record<string, ClockEventType[]> = {
  OFF: [ClockEventType.CLOCK_IN],
  WORKING: [ClockEventType.PAUSE_START, ClockEventType.CLOCK_OUT],
  PAUSED: [ClockEventType.PAUSE_END],
};

@Injectable()
export class ClockService {
  constructor(private prisma: PrismaService) {}

  private async getTodayEvents(employeeId: string) {
    const today = startOfDay(new Date());
    return this.prisma.clockEvent.findMany({
      where: { employeeId, timestamp: { gte: today } },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getStatus(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Empleado no encontrado');

    const now = new Date();
    const todayEvents = await this.getTodayEvents(employeeId);
    const today = computeWorkedMs(todayEvents, now);

    const weekEvents = await this.prisma.clockEvent.findMany({
      where: { employeeId, timestamp: { gte: startOfWeek(now) } },
      orderBy: { timestamp: 'asc' },
    });
    const week = computeWorkedMs(weekEvents, now);

    const usedVacationDays = await this.getUsedVacationDays(employeeId);

    return {
      status: today.status,
      hoursToday: today.workedMs / 3_600_000,
      hoursThisWeek: week.workedMs / 3_600_000,
      vacationDaysAvailable: employee.vacationDaysPerYear - usedVacationDays,
    };
  }

  private async getUsedVacationDays(employeeId: string): Promise<number> {
    const approved = await this.prisma.leaveRequest.findMany({
      where: { employeeId, status: 'APPROVED', type: 'VACATION' },
    });
    return approved.reduce((sum, leave) => {
      const days =
        Math.round((leave.endDate.getTime() - leave.startDate.getTime()) / 86_400_000) + 1;
      return sum + days;
    }, 0);
  }

  async recordEvent(
    employeeId: string,
    type: ClockEventType,
    dto: RecordEventDto,
    meta: RequestMeta,
  ) {
    const todayEvents = await this.getTodayEvents(employeeId);
    const { status } = computeWorkedMs(todayEvents);

    const allowed = NEXT_EVENT[status] ?? [];
    if (!allowed.includes(type)) {
      throw new BadRequestException(
        `No se puede registrar "${type}" estando en estado "${status}"`,
      );
    }

    return this.prisma.clockEvent.create({
      data: {
        employeeId,
        type,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });
  }

  async getHistoryForCompanyEmployee(
    companyId: string,
    employeeId: string,
    range: 'day' | 'week' | 'month',
  ) {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, companyId } });
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    return this.getHistory(employeeId, range);
  }

  async getHistory(employeeId: string, range: 'day' | 'week' | 'month') {
    const now = new Date();
    const from =
      range === 'day' ? startOfDay(now) : range === 'week' ? startOfWeek(now) : startOfMonth(now);

    return this.prisma.clockEvent.findMany({
      where: { employeeId, timestamp: { gte: from } },
      orderBy: { timestamp: 'asc' },
    });
  }

  /**
   * Corrige la hora de un evento. Nunca se borra el registro original:
   * se actualiza el timestamp y se deja constancia permanente en AuditLog
   * con el valor anterior, el nuevo y el motivo (trazabilidad para Inspección).
   */
  async correctEvent(
    companyId: string,
    eventId: string,
    performedByUserId: string,
    dto: CorrectEventDto,
  ) {
    const event = await this.prisma.clockEvent.findUnique({
      where: { id: eventId },
      include: { employee: true },
    });
    if (!event || event.employee.companyId !== companyId) {
      throw new NotFoundException('Registro no encontrado');
    }

    const previousValue = { timestamp: event.timestamp };
    const newValue = { timestamp: new Date(dto.newTimestamp) };

    return this.prisma.$transaction([
      this.prisma.clockEvent.update({
        where: { id: eventId },
        data: { timestamp: newValue.timestamp, isCorrected: true },
      }),
      this.prisma.auditLog.create({
        data: {
          targetEmployeeId: event.employeeId,
          performedByUserId,
          entityType: 'ClockEvent',
          entityId: eventId,
          action: 'CORRECTION',
          reason: dto.reason,
          previousValue,
          newValue,
        },
      }),
    ]);
  }
}
