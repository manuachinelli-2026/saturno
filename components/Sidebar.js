'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/',               label: 'Dashboard',       icon: '🪐' },
  { href: '/scraper',        label: 'Scraper',          icon: '🔍' },
  { href: '/campaigns',      label: 'Campañas',         icon: '📢' },
  { href: '/conversations',  label: 'Conversaciones',   icon: '💬' },
  { href: '/revenue',        label: 'Ingresos',         icon: '💰' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: 'var(--sidebar-width)',
      height: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      padding: '0 0 16px',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border)',
        marginBottom: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🪐</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', lineHeight: 1.2 }}>Saturno</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>Pepino AI Ops</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '4px 10px' }}>
        {NAV.map(({ href, label, icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '2px',
                color: active ? 'var(--text)' : 'var(--text-muted)',
                background: active ? 'var(--accent-dim)' : 'transparent',
                fontSize: '14px',
                fontWeight: active ? 600 : 400,
                transition: 'background 0.15s, color 0.15s',
                textDecoration: 'none',
              }}
            >
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{icon}</span>
              {label}
              {active && (
                <span style={{
                  marginLeft: 'auto',
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 20px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Pepino AI · v1.0</div>
      </div>
    </aside>
  )
}
