'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearTokens } from '@/lib/api';

type Status = {
  status: 'WORKING' | 'PAUSED' | 'OFF';
  hoursToday: number;
  hoursThisWeek: number;
  vacationDaysAvailable: number;
};

const STATUS_LABEL: Record<Status['status'], string> = {
  WORKING: 'Trabajando',
  PAUSED: 'En pausa',
  OFF: 'Fuera de jornada',
};

const STATUS_COLOR: Record<Status['status'], string> = {
  WORKING: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  OFF: 'bg-gray-100 text-gray-700',
};

export default function ClockPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api.get('/clock/status');
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function action(path: string) {
    setLoading(true);
    setError('');
    try {
      await api.post(`/clock/${path}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearTokens();
    router.replace('/login');
  }

  if (!status) {
    return <main className="flex min-h-screen items-center justify-center">Cargando...</main>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10 gap-8">
      <button onClick={logout} className="absolute top-4 right-4 text-sm text-gray-500">
        Salir
      </button>

      <span className={`rounded-full px-4 py-2 text-lg font-medium ${STATUS_COLOR[status.status]}`}>
        {STATUS_LABEL[status.status]}
      </span>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <button
          disabled={loading || status.status !== 'OFF'}
          onClick={() => action('clock-in')}
          className="col-span-2 rounded-2xl bg-green-500 py-6 text-2xl font-bold text-white disabled:opacity-30"
        >
          🟢 Entrar
        </button>
        <button
          disabled={loading || status.status !== 'WORKING'}
          onClick={() => action('pause')}
          className="rounded-2xl bg-yellow-400 py-6 text-xl font-bold text-white disabled:opacity-30"
        >
          🟡 Pausa
        </button>
        <button
          disabled={loading || status.status !== 'PAUSED'}
          onClick={() => action('resume')}
          className="rounded-2xl bg-blue-500 py-6 text-xl font-bold text-white disabled:opacity-30"
        >
          🔵 Reanudar
        </button>
        <button
          disabled={loading || status.status === 'OFF'}
          onClick={() => action('clock-out')}
          className="col-span-2 rounded-2xl bg-red-500 py-6 text-2xl font-bold text-white disabled:opacity-30"
        >
          🔴 Salir
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-3 gap-4 w-full max-w-sm text-center">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold">{status.hoursToday.toFixed(1)}h</p>
          <p className="text-xs text-gray-500">Hoy</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold">{status.hoursThisWeek.toFixed(1)}h</p>
          <p className="text-xs text-gray-500">Esta semana</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold">{status.vacationDaysAvailable}</p>
          <p className="text-xs text-gray-500">Vacaciones</p>
        </div>
      </div>

      <a href="/vacations" className="text-sm text-brand underline">
        Solicitar vacaciones / ver historial
      </a>
    </main>
  );
}
