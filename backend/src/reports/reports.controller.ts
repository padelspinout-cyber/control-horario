import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('csv')
  async csv(@CurrentUser() user: CurrentUserPayload, @Query() query: ReportQueryDto, @Res() res: Response) {
    const csv = await this.reportsService.exportCsv(user.companyId, query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="informe.csv"');
    res.send(csv);
  }

  @Get('excel')
  async excel(@CurrentUser() user: CurrentUserPayload, @Query() query: ReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportsService.exportExcel(user.companyId, query);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="informe.xlsx"');
    res.send(buffer);
  }

  @Get('pdf')
  async pdf(@CurrentUser() user: CurrentUserPayload, @Query() query: ReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportsService.exportPdf(user.companyId, query);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="informe.pdf"');
    res.send(buffer);
  }

  @Get('inspection')
  async inspection(@CurrentUser() user: CurrentUserPayload, @Query() query: ReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportsService.inspectionReport(user.companyId, query);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="informe-inspeccion.pdf"');
    res.send(buffer);
  }
}
