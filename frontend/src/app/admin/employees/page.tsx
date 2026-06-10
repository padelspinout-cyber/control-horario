'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string;
  status: 'ACTIVE' | 'INACTIVE';
};

const empty = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  hireDate: '',
  password: '',
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setEmployees(await api.get('/employees'));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const payload: Record<string, string> = { ...form };
      if (!payload.password) delete payload.password;
      if (!payload.phone) delete payload.phone;
      await api.post('/employees', payload);
      setForm(empty);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  async function toggleStatus(emp: Employee) {
    await api.patch(`/employees/${emp.id}`, {
      status: emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    });
    await load();
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Empleados</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-brand px-4 py-2 text-white text-sm font-medium"
        >
          {showForm ? 'Cancelar' : '+ Nuevo empleado'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-2 gap-3 rounded-2xl bg-white p-5 shadow-sm">
          <input
            placeholder="Nombre"
            required
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            placeholder="Apellidos"
            required
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            placeholder="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            placeholder="Teléfono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            placeholder="Puesto"
            required
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            type="date"
            required
            value={form.hireDate}
            onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            placeholder="Contraseña de acceso (opcional)"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="col-span-2 rounded-lg border border-gray-300 px-3 py-2"
          />
          {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
          <button type="submit" className="col-span-2 rounded-lg bg-brand py-2.5 text-white font-medium">
            Guardar
          </button>
        </form>
      )}

      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Email</th>
              <th className="p-3">Puesto</th>
              <th className="p-3">Estado</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3">{e.firstName} {e.lastName}</td>
                <td className="p-3">{e.email}</td>
                <td className="p-3">{e.position}</td>
                <td className="p-3">
                  <span className={e.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-400'}>
                    {e.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => toggleStatus(e)} className="text-brand text-sm">
                    {e.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
