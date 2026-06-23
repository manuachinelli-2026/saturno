'use client'

const COLORS = {
  green:  { main: '#059669', dim: 'rgba(5,150,105,.10)'  },
  orange: { main: '#d97706', dim: 'rgba(217,119,6,.10)'  },
  red:    { main: '#dc2626', dim: 'rgba(220,38,38,.10)'  },
  blue:   { main: '#2563eb', dim: 'rgba(37,99,235,.10)'  },
  accent: { main: '#7c3aed', dim: 'rgba(124,58,237,.10)' },
}

export default function MetricCard({ label, value, delta, color = 'accent', icon }) {
  const c = COLORS[color] || COLORS.accent

  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px 22px',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '.01em' }}>{label}</span>
        {icon && (
          <span style={{
            fontSize: '16px', background: c.dim, borderRadius: '7px',
            width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {icon}
          </span>
        )}
      </div>
      <div style={{ fontSize: '30px', fontWeight: 700, color: 'var(--text)', lineHeight: 1, letterSpacing: '-.02em' }}>
        {value ?? '—'}
      </div>
      {delta && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: c.main, fontWeight: 500 }}>
          {delta}
        </div>
      )}
    </div>
  )
}
