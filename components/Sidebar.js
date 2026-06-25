'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Sidebar uses hardcoded dark colors regardless of main theme
const S = {
  bg:         '#1c1917',
  surface:    '#292524',
  border:     '#3d3532',
  text:       '#e7e5e4',
  muted:      '#78716c',
  dim:        '#57534e',
  activeText: '#f5f5f4',
  activeBg:   'rgba(124,58,237,.22)',
  activeDot:  '#8b5cf6',
}

const NAV = [
  { href: '/pipeline',       label: 'Pipeline',         icon: '🚀' },
  { href: '/',               label: 'Dashboard',        icon: '📊' },
  { href: '/scraper',        label: 'Scraper',          icon: '🔍' },
  { href: '/campaigns',      label: 'Campañas',         icon: '📢' },
  { href: '/conversations',  label: 'Conversaciones',   icon: '💬' },
  { href: '/revenue',        label: 'Ingresos',         icon: '💰' },
  { href: '/workflow',       label: 'Workflow',         icon: '⚡' },
]

const BOTTOM_NAV = [
  { href: '/config',         label: 'Configuración',    icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href) => href === '/'
    ? pathname === '/'
    : pathname.startsWith(href)

  const NavItem = ({ href, label, icon }) => {
    const active = isActive(href)
    return (
      <Link href={href} style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 12px', borderRadius: '7px', marginBottom: '2px',
        color: active ? S.activeText : S.muted,
        background: active ? S.activeBg : 'transparent',
        fontSize: '14px', fontWeight: active ? 600 : 400,
        textDecoration: 'none', transition: 'background .13s, color .13s',
      }}>
        <span style={{ fontSize: '15px', width: '20px', textAlign: 'center', flexShrink: 0 }}>{icon}</span>
        <span>{label}</span>
        {active && <span style={{ marginLeft: 'auto', width: '5px', height: '5px', borderRadius: '50%', background: S.activeDot, flexShrink: 0 }} />}
      </Link>
    )
  }

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0,
      width: 'var(--sidebar-width)', height: '100vh',
      background: S.bg, borderRight: `1px solid ${S.border}`,
      display: 'flex', flexDirection: 'column',
      zIndex: 100, overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 14px', borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 }}>🪐</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: S.text, lineHeight: 1.2 }}>Saturno</div>
            <div style={{ fontSize: '11px', color: S.dim, marginTop: '1px' }}>Pepino AI Ops</div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, padding: '10px 10px 0' }}>
        {NAV.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      {/* Bottom nav */}
      <div style={{ padding: '8px 10px 16px', borderTop: `1px solid ${S.border}`, flexShrink: 0 }}>
        {BOTTOM_NAV.map(item => <NavItem key={item.href} {...item} />)}
        <div style={{ paddingLeft: '12px', marginTop: '10px', fontSize: '11px', color: S.dim }}>
          v1.0 · Pepino AI
        </div>
      </div>
    </aside>
  )
}
