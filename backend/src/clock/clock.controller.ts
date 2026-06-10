import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ClockEventType, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ClockService } from './clock.service';
import { RecordEventDto } from './dto/record-event.dto';
import { CorrectEventDto } from './dto/correct-event.dto';

@Controller('clock')
@UseGuards(JwtAuthGuard)
export class ClockController {
  constructor(private clockService: ClockService) {}

  @Get('status')
  getStatus(@CurrentUser() user: CurrentUserPayload) {
    this.requireEmployee(user);
    return this.clockService.getStatus(user.employeeId!);
  }

  @Get('history')
  getHistory(
    @CurrentUser() user: CurrentUserPayload,
    @Query('range') range: 'day' | 'week' | 'month' = 'day',
    @Query('employeeId') employeeId?: string,
  ) {
    if (user.role === Role.ADMIN && employeeId) {
      return this.clockService.getHistoryForCompanyEmployee(user.companyId, employeeId, range);
    }
    this.requireEmployee(user);
    return this.clockService.getHistory(user.employeeId!, range);
  }

  @Post('clock-in')
  clockIn(@CurrentUser() user: CurrentUserPayload, @Body() dto: RecordEventDto, @Req() req: Request) {
    return this.record(user, ClockEventType.CLOCK_IN, dto, req);
  }

  @Post('pause')
  pause(@CurrentUser() user: CurrentUserPayload, @Body() dto: RecordEventDto, @Req() req: Request) {
    return this.record(user, ClockEventType.PAUSE_START, dto, req);
  }

  @Post('resume')
  resume(@CurrentUser() user: CurrentUserPayload, @Body() dto: RecordEventDto, @Req() req: Request) {
    return this.record(user, ClockEventType.PAUSE_END, dto, req);
  }

  @Post('clock-out')
  clockOut(@CurrentUser() user: CurrentUserPayload, @Body() dto: RecordEventDto, @Req() req: Request) {
    return this.record(user, ClockEventType.CLOCK_OUT, dto, req);
  }

  @Patch(':id/correct')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  correct(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: CorrectEventDto,
  ) {
    return this.clockService.correctEvent(user.companyId, id, user.userId, dto);
  }

  private record(
    user: CurrentUserPayload,
    type: ClockEventType,
    dto: RecordEventDto,
    req: Request,
  ) {
    this.requireEmployee(user);
    return this.clockService.recordEvent(user.employeeId!, type, dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  private requireEmployee(user: CurrentUserPayload) {
    if (!user.employeeId) {
      throw new BadRequestException('El usuario no tiene un empleado asociado');
    }
  }
}
