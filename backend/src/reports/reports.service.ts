import { Injectable, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { computeWorkedMs, startOfDay } from '../common/time-calc.util';
import { ReportQueryDto } from './dto/report-query.dto';

export interface DaySummary {
  employeeId: string;
  employeeName: string;
  date: string;
  hoursWorked: number;
  events: { type: string; timestamp: string; isCorrected: boolean }[];
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Agrupa los eventos de fichaje por empleado y día dentro del rango dado.
   * Es la base de todos los informes (PDF/Excel/CSV/Inspección).
   */
  async buildDaySummaries(companyId: string, query: ReportQueryDto): Promise<DaySummary[]> {
    const employees = await this.prisma.employee.findMany({
      where: {
        companyId,
        ...(query.employeeId ? { id: query.employeeId } : {}),
      },
      include: {
        clockEvents: {
          where: {
            timestamp: {
              gte: new Date(query.from),
              lte: new Date(query.to),
            },
          },
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (query.employeeId && employees.length === 0) {
      throw new NotFoundException('Empleado no encontrado');
    }

    const summaries: DaySummary[] = [];

    for (const employee of employees) {
      const byDay = new Map<string, typeof employee.clockEvents>();
      for (const event of employee.clockEvents) {
        const key = startOfDay(event.timestamp).toISOString().slice(0, 10);
        if (!byDay.has(key)) byDay.set(key, []);
        byDay.get(key)!.push(event);
      }

      for (const [date, events] of byDay) {
        const { workedMs } = computeWorkedMs(events);
        summaries.push({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          date,
          hoursWorked: Math.round((workedMs / 3_600_000) * 100) / 100,
          events: events.map((e) => ({
            type: e.type,
            timestamp: e.timestamp.toISOString(),
            isCorrected: e.isCorrected,
          })),
        });
      }
    }

    return summaries.sort((a, b) => a.date.localeCompare(b.date) || a.employeeName.localeCompare(b.employeeName));
  }

  async exportCsv(companyId: string, query: ReportQueryDto): Promise<string> {
    const summaries = await this.buildDaySummaries(companyId, query);
    const header = 'Empleado,Fecha,Horas trabajadas\n';
    const rows = summaries
      .map((s) => `"${s.employeeName}",${s.date},${s.hoursWorked}`)
      .join('\n');
    return header + rows;
  }

  async exportExcel(companyId: string, query: ReportQueryDto): Promise<ExcelJS.Buffer> {
    const summaries = await this.buildDaySummaries(companyId, query);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Registros');
    sheet.columns = [
      { header: 'Empleado', key: 'employeeName', width: 30 },
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Horas trabajadas', key: 'hoursWorked', width: 18 },
    ];
    summaries.forEach((s) => sheet.addRow(s));

    return workbook.xlsx.writeBuffer();
  }

  async exportPdf(companyId: string, query: ReportQueryDto): Promise<Buffer> {
    const summaries = await this.buildDaySummaries(companyId, query);
    return this.renderPdf('Informe de horas', summaries, query);
  }

  /**
   * "Modo Inspección": informe completo por empleado con jornadas, horas
   * extra, ausencias y modificaciones (AuditLog), listo para entregar a la
   * Inspección de Trabajo.
   */
  async inspectionReport(companyId: string, query: ReportQueryDto): Promise<Buffer> {
    const summaries = await this.buildDaySummaries(companyId, query);

    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        targetEmployee: { companyId, ...(query.employeeId ? { id: query.employeeId } : {}) },
        createdAt: { gte: new Date(query.from), lte: new Date(query.to) },
      },
      include: { targetEmployee: true },
      orderBy: { createdAt: 'asc' },
    });

    const leaves = await this.prisma.leaveRequest.findMany({
      where: {
        employee: { companyId, ...(query.employeeId ? { id: query.employeeId } : {}) },
        status: 'APPROVED',
        startDate: { lte: new Date(query.to) },
        endDate: { gte: new Date(query.from) },
      },
      include: { employee: true },
    });

    return this.renderPdf('Informe de Inspección de Trabajo', summaries, query, auditLogs, leaves);
  }

  private renderPdf(
    title: string,
    summaries: DaySummary[],
    query: ReportQueryDto,
    auditLogs: any[] = [],
    leaves: any[] = [],
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text(title, { align: 'center' });
      doc.fontSize(10).text(`Periodo: ${query.from.slice(0, 10)} a ${query.to.slice(0, 10)}`, {
        align: 'center',
      });
      doc.moveDown();

      doc.fontSize(12).text('Jornadas registradas');
      doc.moveDown(0.5);
      const totalsByEmployee = new Map<string, number>();

      summaries.forEach((s) => {
        doc.fontSize(9).text(`${s.date}  -  ${s.employeeName}  -  ${s.hoursWorked} h`);
        totalsByEmployee.set(s.employeeId, (totalsByEmployee.get(s.employeeId) ?? 0) + s.hoursWorked);
      });

      doc.moveDown();
      doc.fontSize(12).text('Totales por empleado');
      doc.moveDown(0.5);
      const employeeNames = new Map(summaries.map((s) => [s.employeeId, s.employeeName]));
      for (const [employeeId, total] of totalsByEmployee) {
        doc.fontSize(9).text(`${employeeNames.get(employeeId)}: ${Math.round(total * 100) / 100} h`);
      }

      if (leaves.length > 0) {
        doc.moveDown();
        doc.fontSize(12).text('Ausencias / Vacaciones aprobadas');
        doc.moveDown(0.5);
        leaves.forEach((l) => {
          doc
            .fontSize(9)
            .text(
              `${l.employee.firstName} ${l.employee.lastName}: ${l.type} del ${l.startDate
                .toISOString()
                .slice(0, 10)} al ${l.endDate.toISOString().slice(0, 10)}`,
            );
        });
      }

      if (auditLogs.length > 0) {
        doc.moveDown();
        doc.fontSize(12).text('Modificaciones de registros (auditoría)');
        doc.moveDown(0.5);
        auditLogs.forEach((log) => {
          doc
            .fontSize(9)
            .text(
              `${log.createdAt.toISOString()} - ${log.targetEmployee.firstName} ${log.targetEmployee.lastName} - ${log.action} - Motivo: ${log.reason}`,
            );
        });
      }

      doc.end();
    });
  }
}
