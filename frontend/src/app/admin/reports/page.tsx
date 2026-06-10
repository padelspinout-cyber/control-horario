'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';

type Employee = { id: string; firstName: string; lastName: string };

function startOfMonthStr() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [from, setFrom] = useState(startOfMonthStr());
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/employees').then(setEmployees);
  }, []);

  async function download(path: string, filename: string) {
    setError('');
    try {
      const params = new URLSearchParams({ from, to });
      if (employeeId) params.set('employeeId', employeeId);
      const res = await api.download(`/reports/${path}?${params.toString()}`);
      if (!res.ok) throw new Error('Error al generar el informe');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold mb-6">Informes</h1>

      <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4 max-w-xl">
        <div className="flex gap-3">
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="">Todos los empleados</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <button onClick={() => download('pdf', 'informe.pdf')} className="rounded-lg bg-brand px-4 py-2 text-white text-sm">
            Descargar PDF
          </button>
          <button onClick={() => download('excel', 'informe.xlsx')} className="rounded-lg bg-brand px-4 py-2 text-white text-sm">
            Descargar Excel
          </button>
          <button onClick={() => download('csv', 'informe.csv')} className="rounded-lg bg-brand px-4 py-2 text-white text-sm">
            Descargar CSV
          </button>
        </div>

        <hr />

        <button
          onClick={() => download('inspection', 'informe-inspeccion.pdf')}
          className="w-full rounded-lg bg-gray-900 px-4 py-3 text-white font-medium"
        >
          🛡 Generar Informe de Inspección
        </button>
      </div>
    </AdminLayout>
  );
}
