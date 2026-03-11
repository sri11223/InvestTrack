import type { Metadata } from 'next';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'InvestTrack — Portfolio Dashboard',
  description: 'Real-time portfolio tracking dashboard with live stock data from Yahoo Finance and Google Finance.',
  keywords: ['portfolio', 'stocks', 'dashboard', 'investing', 'NSE', 'BSE'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
