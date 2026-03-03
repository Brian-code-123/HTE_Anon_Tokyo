import { NavLink, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

const registryLinks = [
  { to: '/registry', label: 'Dashboard', end: true },
  { to: '/registry/demo', label: 'Demo' },
  { to: '/registry/demo/live', label: 'Guided' },
  { to: '/registry/companies', label: 'Companies' },
  { to: '/registry/anchor', label: 'Anchor' },
  { to: '/registry/verify', label: 'Verify' },
  { to: '/registry/chain', label: 'Chain' },
  { to: '/registry/extension', label: 'Extension' },
]

export function AppShell() {
  const { data } = useQuery({
    queryKey: ['health'],
    queryFn: api.health,
    refetchInterval: 15000,
  })

  return (
    <div className="shell">
      <header className="shell-header">
        <div className="brand-wrap">
          <NavLink to="/" className="brand-link">
            <span className="brand-icon">⛨</span> Origraph
          </NavLink>
          <span className="brand-subtitle">Verifiable AI Provenance</span>
        </div>
        <div className="status-row">
          <span className={`status-pill ${data?.status === 'ok' ? 'status-ok' : 'status-warn'}`}>
            API {data?.status ?? '...' }
          </span>
          <span className="status-pill">
            Mode {data?.demo_mode ?? '...'}
          </span>
          <span className={`status-pill ${data?.chain?.valid ? 'status-ok' : 'status-warn'}`}>
            Chain {data?.chain?.length ?? 0}
          </span>
        </div>
      </header>

      <nav className="main-nav">
        {registryLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}
