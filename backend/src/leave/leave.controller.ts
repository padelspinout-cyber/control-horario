import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { LeaveService } from './leave.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { ReviewLeaveDto } from './dto/review-leave.dto';

@Controller('leave-requests')
@UseGuards(JwtAuthGuard)
export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateLeaveDto) {
    if (!user.employeeId) throw new BadRequestException('El usuario no tiene un empleado asociado');
    return this.leaveService.create(user.employeeId, dto);
  }

  @Get('mine')
  findMine(@CurrentUser() user: CurrentUserPayload) {
    if (!user.employeeId) throw new BadRequestException('El usuario no tiene un empleado asociado');
    return this.leaveService.findForEmployee(user.employeeId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.leaveService.findAllForCompany(user.companyId);
  }

  @Patch(':id/review')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  review(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: ReviewLeaveDto,
  ) {
    return this.leaveService.review(user.companyId, id, user.userId, dto.decision);
  }
}
