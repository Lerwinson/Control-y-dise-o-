import type { Metadata } from 'next';
import { Inter, Orbitron } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'], variable: '--font-orbitron', display: 'swap' });

export const metadata: Metadata = {
  title: 'Furniture Structure Designer Pro',
  description: 'Diseño técnico industrial de muebles, sofás, camas y estructuras de madera en 2D y 3D. Desarrollado por Lerwinson Mendoza.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${orbitron.variable}`}>
      <body className="font-sans antialiased text-zinc-100 overflow-x-hidden">
        <div className="bg-aurora fixed inset-0 -z-10" />
        <div className="bg-grid fixed inset-0 -z-10 opacity-[0.07]" />
        {children}
      </body>
    </html>
  );
}
