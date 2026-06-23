'use client'

const COLORS = {
  green:  { main: 'var(--green)',  dim: 'var(--green-dim)'  },
  orange: { main: 'var(--orange)', dim: 'var(--orange-dim)' },
  red:    { main: 'var(--red)',    dim: 'var(--red-dim)'    },
  blue:   { main: 'var(--blue)',   dim: 'var(--blue-dim)'   },
  accent: { main: 'var(--accent-bright)', dim: 'var(--accent-dim)' },
}

export default function MetricCard({ label, value, delta, color = 'accent' }) {
  const c = COLORS[color] || COLORS.accent

  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '16px 18px',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{
        fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)',
        letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: '10px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '28px', fontWeight: 500,
        color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.02em',
      }}>
        {value ?? '—'}
      </div>
      {delta && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: c.main, fontWeight: 500, fontFamily: "'JetBrains Mono', monospace" }}>
          {delta}
        </div>
      )}
    </div>
  )
}
