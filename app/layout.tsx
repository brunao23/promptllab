import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LaBPrompT - Laboratório de Engenharia de Prompt',
  description: 'Crie, teste, otimize e gerencie prompts de IA de forma profissional e eficiente',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-900 text-gray-100">{children}</body>
    </html>
  );
}

