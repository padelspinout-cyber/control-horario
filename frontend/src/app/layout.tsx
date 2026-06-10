import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Control Horario',
  description: 'Registro de jornada laboral',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
