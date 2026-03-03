import { Link } from 'react-router-dom'
import { SectionCard } from '../components/SectionCard'

export function DemoOverviewPage() {
  return (
    <div className="page-grid">
      <SectionCard title="Demo Tracks" subtitle="Choose the flow that matches your audience and timing.">
        <div className="route-cards">
          <Link to="/registry/demo/live" className="route-card">
            <h3>Guided Live Demo</h3>
            <p>Operator-safe default path with health checks and fixture controls.</p>
          </Link>
          <Link to="/registry/demo/company" className="route-card">
            <h3>Company Flow</h3>
            <p>Generate, watermark, sign, and anchor output as an authorized issuer.</p>
          </Link>
          <Link to="/registry/demo/user" className="route-card">
            <h3>User Flow</h3>
            <p>Verify provenance from a receiver perspective and test tamper detection.</p>
          </Link>
          <Link to="/registry/extension" className="route-card">
            <h3>Extension Flow</h3>
            <p>Show browser-assisted verification and API handoff behavior.</p>
          </Link>
        </div>
      </SectionCard>
    </div>
  )
}
