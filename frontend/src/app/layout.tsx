import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { CommandPalette } from '@/components/search/CommandPalette';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'Peblo Notes',
  description: 'AI-powered, elegant note-taking workspace.',
  openGraph: {
    title: 'Peblo Notes',
    description: 'AI-powered, elegant note-taking workspace.',
    images: [{ url: '/og-image.png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-background text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CommandPalette />
            {children}
            <Toaster position="bottom-right" richColors theme="system" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
