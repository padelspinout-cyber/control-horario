'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';

type Leave = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  employee: { firstName: string; lastName: string };
};

const STATUS_LABEL: Record<Leave['status'], string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

export default function AdminVacationsPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);

  async function load() {
    setLeaves(await api.get('/leave-requests'));
  }

  useEffect(() => {
    load();
  }, []);

  async function review(id: string, decision: 'APPROVED' | 'REJECTED') {
    await api.patch(`/leave-requests/${id}/review`, { decision });
    await load();
  }

  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold mb-6">Vacaciones</h1>

      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Empleado</th>
              <th className="p-3">Periodo</th>
              <th className="p-3">Estado</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-3">{l.employee.firstName} {l.employee.lastName}</td>
                <td className="p-3">
                  {l.startDate.slice(0, 10)} → {l.endDate.slice(0, 10)}
                </td>
                <td className="p-3">{STATUS_LABEL[l.status]}</td>
                <td className="p-3 text-right space-x-2">
                  {l.status === 'PENDING' && (
                    <>
                      <button onClick={() => review(l.id, 'APPROVED')} className="text-green-600 text-sm">
                        Aprobar
                      </button>
                      <button onClick={() => review(l.id, 'REJECTED')} className="text-red-600 text-sm">
                        Rechazar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
