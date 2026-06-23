import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata = {
  title: 'Saturno — Pepino AI',
  description: 'Panel de operaciones: Scraping, WhatsApp, IA y Conversiones',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <main style={{
          marginLeft: 'var(--sidebar-width)',
          flex: 1,
          minHeight: '100vh',
          background: 'var(--bg)',
          overflowX: 'hidden',
        }}>
          {children}
        </main>
      </body>
    </html>
  )
}
