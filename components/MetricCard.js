'use client'

const COLORS = {
  green:  { main: 'var(--green)',  dim: 'var(--green-dim)'  },
  orange: { main: 'var(--orange)', dim: 'var(--orange-dim)' },
  red:    { main: 'var(--red)',    dim: 'var(--red-dim)'    },
  blue:   { main: 'var(--blue)',   dim: 'var(--blue-dim)'   },
  accent: { main: 'var(--accent)', dim: 'var(--accent-dim)' },
}

export default function MetricCard({ label, value, delta, color = 'accent', icon }) {
  const c = COLORS[color] || COLORS.accent

  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        {icon && (
          <span style={{
            fontSize: '18px',
            background: c.dim,
            borderRadius: 'var(--radius-sm)',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {icon}
          </span>
        )}
      </div>
      <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      {delta && (
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: c.main,
          fontWeight: 500,
        }}>
          {delta}
        </div>
      )}
    </div>
  )
}
