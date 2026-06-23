'use client'

const PATHS = {
  dashboard: 'M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z',
  pipeline: 'M2 5h12M2 8h9m5 0-3 3-3-3M2 11h6',
  scraper: 'M10.5 10.5l3 3M6.5 11.5a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  campaigns: 'M13 2 7 13l-2-5-5 2',
  conversations: 'M13 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4l1 2 1-2h4a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z',
  revenue: 'M8 2v12M5.5 5.5h4a2 2 0 0 1 0 4h-4v-4zm0 4h4.5a2 2 0 0 1 0 4H5.5',
  clients: 'M11 13v-1a3 3 0 0 0-6 0v1M8 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  lines: 'M5 1h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zm3 10v.01',
  agent: 'M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-4 4h8a5 5 0 0 0-8 0z',
  settings: 'M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 1v1m0 12v1M3.2 3.2l.7.7m8 8 .7.7M1 8h1m12 0h1M3.9 12.1l.7-.7m8-8 .7-.7',
  check: 'M2 8 6 12 14 4',
  x: 'M3 3l10 10M13 3 3 13',
  plus: 'M8 2v12M2 8h12',
  send: 'M13.5 2 2 7l5 2.5 2 5z',
  stop: 'M4 4h8v8H4z',
  play: 'M4 2.5l9 5.5-9 5.5z',
  refresh: 'M13.5 5.5A6 6 0 1 0 14 9m0-6v3.5H10.5',
  trending: 'M1 12 5.5 7l3 3 4-6 3 3',
  user: 'M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 8a5 5 0 0 1 10 0',
  phone: 'M14 11.5A12.5 12.5 0 0 1 2.5 2H1v3.5C1 11.3 4.7 15 10.5 15H14v-3.5z',
  qr: 'M2 2h5v5H2zm7 0h5v5H9zM2 9h5v5H2zm7 4h.01m2 0h.01m-2-2h.01m2 0h.01m-2 2v.01',
  eye: 'M1 8s3-5.5 7-5.5S15 8 15 8s-3 5.5-7 5.5S1 8 1 8zm7 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  bot: 'M8 3a2 2 0 0 0-2 2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2a2 2 0 0 0-2-2zM6 10h.01M10 10h.01',
  wifi: 'M1 6.5a10 10 0 0 1 14 0M3.5 9a6.5 6.5 0 0 1 9 0M6 11.5a3.5 3.5 0 0 1 4 0M8 14v.01',
  alert: 'M8 2 1 14h14L8 2zm0 4v4m0 2v.01',
}

export function Icon({ name, size = 16, color = 'currentColor', style = {} }) {
  const d = PATHS[name] || PATHS.settings
  return (
    <svg
      width={size} height={size} viewBox="0 0 16 16"
      fill="none" stroke={color} strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={style}
    >
      <path d={d} />
    </svg>
  )
}
