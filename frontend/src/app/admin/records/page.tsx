'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';

type Employee = { id: string; firstName: string; lastName: string };
type ClockEvent = {
  id: string;
  type: string;
  timestamp: string;
  isCorrected: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  CLOCK_IN: '🟢 Entrada',
  PAUSE_START: '🟡 Pausa',
  PAUSE_END: '🔵 Reanuda',
  CLOCK_OUT: '🔴 Salida',
};

export default function RecordsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [range, setRange] = useState<'day' | 'week' | 'month'>('day');
  const [events, setEvents] = useState<ClockEvent[]>([]);
  const [editing, setEditing] = useState<ClockEvent | null>(null);
  const [newTimestamp, setNewTimestamp] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    api.get('/employees').then((data: Employee[]) => {
      setEmployees(data);
      if (data.length > 0) setEmployeeId(data[0].id);
    });
  }, []);

  async function load() {
    if (!employeeId) return;
    const data = await api.get(`/clock/history?range=${range}&employeeId=${employeeId}`);
    setEvents(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, range]);

  function startEdit(event: ClockEvent) {
    setEditing(event);
    setNewTimestamp(event.timestamp.slice(0, 16));
    setReason('');
  }

  async function saveCorrection() {
    if (!editing) return;
    await api.patch(`/clock/${editing.id}/correct`, {
      newTimestamp: new Date(newTimestamp).toISOString(),
      reason,
    });
    setEditing(null);
    await load();
  }

  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold mb-6">Registros</h1>

      <div className="flex gap-3 mb-4">
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2"
        >
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.firstName} {e.lastName}
            </option>
          ))}
        </select>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as 'day' | 'week' | 'month')}
          className="rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="day">Día actual</option>
          <option value="week">Semana actual</option>
          <option value="month">Mes actual</option>
        </select>
      </div>

      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Tipo</th>
              <th className="p-3">Fecha y hora</th>
              <th className="p-3">Corregido</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id} className="border-t">
                <td className="p-3">{TYPE_LABEL[ev.type] ?? ev.type}</td>
                <td className="p-3">{new Date(ev.timestamp).toLocaleString('es-ES')}</td>
                <td className="p-3">{ev.isCorrected ? 'Sí' : '-'}</td>
                <td className="p-3 text-right">
                  <button onClick={() => startEdit(ev)} className="text-brand text-sm">
                    Corregir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-3">
            <h2 className="font-medium">Corregir registro</h2>
            <input
              type="datetime-local"
              value={newTimestamp}
              onChange={(e) => setNewTimestamp(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <textarea
              placeholder="Motivo de la corrección (obligatorio)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="flex-1 rounded-lg border py-2">
                Cancelar
              </button>
              <button
                onClick={saveCorrection}
                disabled={reason.length < 5}
                className="flex-1 rounded-lg bg-brand py-2 text-white disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
