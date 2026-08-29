import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DUMP — Shared File Drop',
  description: 'Drop files. Grab files. That’s it.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
