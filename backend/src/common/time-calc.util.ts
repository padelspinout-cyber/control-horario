import { ClockEvent, ClockEventType } from '@prisma/client';

export type EmployeeStatus = 'WORKING' | 'PAUSED' | 'OFF';

/**
 * Calcula el estado actual y los milisegundos trabajados a partir de una
 * lista de eventos ordenada cronológicamente (ascendente).
 * Una jornada "abierta" (sin CLOCK_OUT) computa hasta `now`.
 */
export function computeWorkedMs(events: ClockEvent[], now: Date = new Date()): {
  workedMs: number;
  status: EmployeeStatus;
} {
  let workedMs = 0;
  let segmentStart: Date | null = null;
  let paused = false;
  let status: EmployeeStatus = 'OFF';

  for (const event of events) {
    switch (event.type) {
      case ClockEventType.CLOCK_IN:
        segmentStart = event.timestamp;
        paused = false;
        status = 'WORKING';
        break;
      case ClockEventType.PAUSE_START:
        if (segmentStart) {
          workedMs += event.timestamp.getTime() - segmentStart.getTime();
          segmentStart = null;
        }
        paused = true;
        status = 'PAUSED';
        break;
      case ClockEventType.PAUSE_END:
        segmentStart = event.timestamp;
        paused = false;
        status = 'WORKING';
        break;
      case ClockEventType.CLOCK_OUT:
        if (segmentStart) {
          workedMs += event.timestamp.getTime() - segmentStart.getTime();
          segmentStart = null;
        }
        paused = false;
        status = 'OFF';
        break;
    }
  }

  // Jornada abierta: sumar hasta el momento actual
  if (segmentStart && status === 'WORKING') {
    workedMs += now.getTime() - segmentStart.getTime();
  }

  return { workedMs, status: paused ? 'PAUSED' : status };
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = domingo
  const diff = (day === 0 ? -6 : 1) - day; // lunes como inicio de semana
  d.setDate(d.getDate() + diff);
  return d;
}

export function startOfMonth(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}
