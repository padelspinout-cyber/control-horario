'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';

type Summary = {
  activeEmployees: number;
  working: number;
  onBreak: number;
  absent: number;
  hoursRecordedToday: number;
  pendingLeaveRequests: number;
};

const CARDS: { key: keyof Summary; label: string }[] = [
  { key: 'activeEmployees', label: 'Empleados activos' },
  { key: 'working', label: 'Trabajando' },
  { key: 'absent', label: 'Ausentes' },
  { key: 'hoursRecordedToday', label: 'Horas registradas hoy' },
  { key: 'pendingLeaveRequests', label: 'Solicitudes pendientes' },
];

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    api.get('/dashboard').then(setSummary);
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CARDS.map((c) => (
            <div key={c.key} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-3xl font-bold">{summary[c.key]}</p>
              <p className="text-sm text-gray-500">{c.label}</p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
