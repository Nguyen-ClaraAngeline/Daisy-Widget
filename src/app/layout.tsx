import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Daisy — widget de réservation',
  description: 'Étude de cas Daisy, sujet B : le widget que l’artisan pose sur son site.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}