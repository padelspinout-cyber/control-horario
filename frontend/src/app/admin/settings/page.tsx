'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';

type AuditLog = {
  id: string;
  action: string;
  reason: string;
  previousValue: unknown;
  newValue: unknown;
  createdAt: string;
  targetEmployee: { firstName: string; lastName: string };
};

export default function SettingsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    api.get('/audit-logs').then(setLogs);
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold mb-6">Configuración</h1>

      <section className="rounded-2xl bg-white p-5 shadow-sm mb-6 max-w-xl">
        <h2 className="font-medium mb-2">Conservación de datos</h2>
        <p className="text-sm text-gray-600">
          Los registros horarios se conservan un mínimo de 4 años, conforme al RD-ley 8/2019.
          Ningún registro puede eliminarse; las correcciones quedan documentadas en el historial
          de auditoría.
        </p>
      </section>

      <section className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <h2 className="font-medium p-4 border-b">Historial de auditoría (correcciones)</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Empleado</th>
              <th className="p-3">Acción</th>
              <th className="p-3">Motivo</th>
              <th className="p-3">Antes → Después</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t align-top">
                <td className="p-3">{new Date(log.createdAt).toLocaleString('es-ES')}</td>
                <td className="p-3">
                  {log.targetEmployee.firstName} {log.targetEmployee.lastName}
                </td>
                <td className="p-3">{log.action}</td>
                <td className="p-3">{log.reason}</td>
                <td className="p-3 font-mono text-xs">
                  {JSON.stringify(log.previousValue)} → {JSON.stringify(log.newValue)}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-3 text-center text-gray-500">
                  Sin modificaciones registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </AdminLayout>
  );
}
