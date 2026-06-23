'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/',              label: 'Control' },
  { href: '/conversations', label: 'Conversaciones' },
  { href: '/campaigns',     label: 'Campañas' },
  { href: '/agent',         label: 'Agente' },
  { href: '/lines',         label: 'Líneas' },
]

export default function TopNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 'var(--topnav-height)',
      background: 'rgba(7, 7, 15, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: '4px',
      zIndex: 200,
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        marginRight: '32px', flexShrink: 0,
      }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="5.5" fill="#7c3aed"/>
          <ellipse cx="11" cy="11" rx="10.5" ry="3.2"
            stroke="#a06aff" strokeWidth="1.4" fill="none"
            transform="rotate(-18 11 11)" opacity="0.65"/>
        </svg>
        <span style={{
          fontWeight: 700, fontSize: '13px', letterSpacing: '0.12em',
          color: 'var(--text)', fontFamily: 'Space Grotesk',
          textTransform: 'uppercase', opacity: 0.9,
        }}>
          Saturno
        </span>
      </div>

      {/* Nav items */}
      {NAV.map(({ href, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link key={href} href={href} style={{
            padding: '5px 13px',
            borderRadius: '5px',
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '0.01em',
            color: active ? 'var(--text)' : 'var(--text-muted)',
            background: active ? 'rgba(124,58,237,0.16)' : 'transparent',
            border: active ? '1px solid rgba(124,58,237,0.32)' : '1px solid transparent',
            textDecoration: 'none',
            transition: 'all .12s',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}>
            {label}
          </Link>
        )
      })}

      {/* Right: live indicator */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'var(--green)',
          boxShadow: '0 0 8px rgba(35,209,139,0.6)',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          LIVE
        </span>
      </div>
    </nav>
  )
}
