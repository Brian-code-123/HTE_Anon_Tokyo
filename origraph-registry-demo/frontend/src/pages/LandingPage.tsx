import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function LandingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['landing-health'],
    queryFn: api.health,
    refetchInterval: 20000,
  })

  return (
    <div className="landing">
      <header className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">Origraph Platform</p>
          <h1>Trustworthy AI output with proof users can verify.</h1>
          <p>
            Origraph combines invisible watermarking, cryptographic signing, and chain anchoring into one demo-ready
            workflow for technical and business audiences.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/registry/demo/live">
              Start Guided Demo
            </Link>
            <Link className="btn" to="/registry/verify">
              Verify Output
            </Link>
            <Link className="btn" to="/registry/extension">
              Browser Extension
            </Link>
          </div>
        </div>
        <aside className="hero-panel">
          <h3>Live Readiness</h3>
          <ul>
            <li>
              API status: <strong>{isLoading ? 'Checking...' : data?.status ?? 'Unavailable'}</strong>
            </li>
            <li>
              Demo mode: <strong>{isLoading ? '...' : data?.demo_mode ?? 'Unknown'}</strong>
            </li>
            <li>
              Chain: <strong>{isLoading ? '...' : `${data?.chain.length ?? 0} blocks`}</strong>
            </li>
            <li>
              Chain validity: <strong>{isLoading ? '...' : data?.chain.valid ? 'Valid' : 'Needs attention'}</strong>
            </li>
          </ul>
        </aside>
      </header>

      <section className="landing-grid">
        <article className="card tone-blue">
          <h2>1. Watermark</h2>
          <p>Embed invisible metadata in model text payloads without changing visible output.</p>
        </article>
        <article className="card tone-teal">
          <h2>2. Sign + Anchor</h2>
          <p>Authorized issuers sign response hashes and anchor immutable receipts to the provenance chain.</p>
        </article>
        <article className="card tone-amber">
          <h2>3. Verify Anywhere</h2>
          <p>Users or extensions can verify authenticity in one request via the public verification API.</p>
        </article>
      </section>
    </div>
  )
}
