import './globals.css'
import TopNav from '@/components/TopNav'

export const metadata = {
  title: 'Saturno — Pepino AI',
  description: 'Panel de operaciones: Scraping, WhatsApp, IA y Conversiones',
  icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }] },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 'var(--topnav-height)' }}>
        <TopNav />
        <main style={{ minHeight: 'calc(100vh - var(--topnav-height))', background: 'var(--bg)' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
