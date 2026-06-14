import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nebula Research — AI Deep Research Platform',
  description: 'Evidence-backed answers synthesized from live web crawling, web searches, and brand intelligence using Context.dev and advanced AI.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen text-slate-100 bg-[#03030d] relative">
        {/* Animated Aurora Background Grid */}
        <div className="aurora"></div>
        <div className="fixed inset-0 grid-bg pointer-events-none z-[-1]"></div>
        
        {/* Content Container */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
