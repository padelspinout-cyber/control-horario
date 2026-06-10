'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearTokens } from '@/lib/api';

const NAV = [
  { href: '/admin', label: '📊 Dashboard' },
  { href: '/admin/employees', label: '👥 Empleados' },
  { href: '/admin/records', label: '🕒 Registros' },
  { href: '/admin/vacations', label: '🏖 Vacaciones' },
  { href: '/admin/reports', label: '📄 Informes' },
  { href: '/admin/settings', label: '⚙ Configuración' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearTokens();
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r bg-white p-4 flex flex-col">
        <h1 className="text-lg font-semibold mb-6">Control Horario</h1>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm ${
                pathname === item.href ? 'bg-brand text-white' : 'hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="text-sm text-gray-500 text-left">
          Cerrar sesión
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
