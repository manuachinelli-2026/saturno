'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV = [
  { href: '/',              label: 'Control' },
  { href: '/conversations', label: 'Conversaciones' },
  { href: '/campaigns',     label: 'Leads' },
  { href: '/agent',         label: 'Agente' },
  { href: '/lines',         label: 'Lineas' },
  { href: '/workflow',      label: 'Workflow' },
]

const MONO = { fontFamily: "'JetBrains Mono', monospace" }

export default function TopNav() {
  const pathname = usePathname()
  const [time, setTime] = useState('')

  useEffect(() => {
    function tick() {
      const now = new Date()
      const h = now.getHours().toString().padStart(2, '0')
      const m = now.getMinutes().toString().padStart(2, '0')
      const s = now.getSeconds().toString().padStart(2, '0')
      setTime(`${h}:${m}:${s}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 'var(--topnav-height)',
      background: 'rgba(7, 7, 15, 0.94)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: '2px',
      zIndex: 200,
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        marginRight: '28px', flexShrink: 0,
        borderLeft: '2px solid var(--accent)',
        paddingLeft: '10px',
      }}>
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="5" fill="#7c3aed"/>
          <ellipse cx="11" cy="11" rx="10.5" ry="3.2"
            stroke="#a06aff" strokeWidth="1.3" fill="none"
            transform="rotate(-18 11 11)" opacity="0.7"/>
          <ellipse cx="11" cy="11" rx="10.5" ry="3.2"
            stroke="rgba(160,106,255,0.25)" strokeWidth="1" fill="none"
            transform="rotate(42 11 11)" opacity="0.4"/>
        </svg>
        <span style={{
          ...MONO,
          fontWeight: 600, fontSize: '13px', letterSpacing: '0.14em',
          color: 'var(--accent-bright)',
          textTransform: 'uppercase',
        }}>
          SATURNO
        </span>
      </div>

      {/* Nav tabs */}
      {NAV.map(({ href, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            style={{
              position: 'relative',
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: active ? 600 : 500,
              letterSpacing: '0.04em',
              color: active ? 'var(--text)' : 'var(--text-muted)',
              background: active ? 'rgba(124,58,237,0.14)' : 'transparent',
              border: active
                ? '1px solid rgba(124,58,237,0.28)'
                : '1px solid transparent',
              borderBottom: active
                ? '1px solid var(--accent-bright)'
                : '1px solid transparent',
              textDecoration: 'none',
              transition: 'color 0.14s, background 0.14s, border-color 0.14s',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              if (!active) e.currentTarget.style.color = 'var(--text)'
            }}
            onMouseLeave={e => {
              if (!active) e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            {label}
          </Link>
        )
      })}

      {/* Right cluster */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'var(--green)',
            boxShadow: '0 0 6px rgba(35,209,139,0.5)',
            animation: 'pulse 2.4s ease-in-out infinite',
          }} />
          <span style={{ ...MONO, fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            LIVE
          </span>
        </div>

        {/* Clock */}
        <span style={{
          ...MONO,
          fontSize: '11px',
          color: 'var(--text-dim)',
          letterSpacing: '0.06em',
          minWidth: '56px',
          textAlign: 'right',
        }}>
          {time}
        </span>
      </div>
    </nav>
  )
}
