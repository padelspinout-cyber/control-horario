'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Leave = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
};

const STATUS_LABEL: Record<Leave['status'], string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

export default function VacationsPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const data = await api.get('/leave-requests/mine');
    setLeaves(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/leave-requests', { startDate, endDate, type: 'VACATION' });
      setStartDate('');
      setEndDate('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8 space-y-6">
      <a href="/clock" className="text-sm text-brand underline">
        ← Volver
      </a>
      <h1 className="text-xl font-semibold">Vacaciones</h1>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
        <h2 className="font-medium">Solicitar vacaciones</h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm mb-1">Desde</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Hasta</label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full rounded-lg bg-brand py-2.5 text-white font-medium">
          Solicitar
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="font-medium">Historial</h2>
        {leaves.length === 0 && <p className="text-sm text-gray-500">Sin solicitudes</p>}
        {leaves.map((l) => (
          <div key={l.id} className="rounded-xl bg-white p-4 shadow-sm flex justify-between">
            <span>
              {l.startDate.slice(0, 10)} → {l.endDate.slice(0, 10)}
            </span>
            <span className="text-sm font-medium">{STATUS_LABEL[l.status]}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
