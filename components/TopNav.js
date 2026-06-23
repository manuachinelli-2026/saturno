'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from './Icons'

const NAV = [
  { href: '/',                label: 'Dashboard',      icon: 'dashboard' },
  { href: '/pipeline',        label: 'Pipeline',        icon: 'pipeline' },
  { href: '/scraper',         label: 'Scraper',         icon: 'scraper' },
  { href: '/campaigns',       label: 'Campañas',        icon: 'campaigns' },
  { href: '/conversations',   label: 'Conversaciones',  icon: 'conversations' },
  { href: '/revenue',         label: 'Ingresos',        icon: 'revenue' },
  { href: '/clients',         label: 'Clientes',        icon: 'clients' },
  { href: '/lines',           label: 'Líneas',          icon: 'lines' },
  { href: '/agent',           label: 'Agente',          icon: 'bot' },
]

export default function TopNav() {
  const pathname = usePathname()
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 'var(--topnav-height)',
      background: '#ffffff',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: '2px',
      zIndex: 200, overflowX: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginRight: '20px', flexShrink: 0,
      }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="7" fill="var(--accent)" opacity="0.9"/>
          <ellipse cx="14" cy="14" rx="13" ry="4.5" stroke="var(--accent)" strokeWidth="2" fill="none" transform="rotate(-20 14 14)" opacity="0.6"/>
        </svg>
        <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', letterSpacing: '-0.3px' }}>
          Saturno
        </span>
      </div>

      {/* Nav items */}
      {NAV.map(({ href, label, icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link key={href} href={href} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 10px', borderRadius: '6px', fontSize: '13.5px',
            fontWeight: active ? 600 : 400,
            color: active ? 'var(--text)' : 'var(--text-muted)',
            background: active ? 'var(--surface)' : 'transparent',
            textDecoration: 'none', transition: 'all .15s', flexShrink: 0,
            whiteSpace: 'nowrap',
          }}>
            <Icon name={icon} size={14} color={active ? 'var(--accent)' : 'currentColor'} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
