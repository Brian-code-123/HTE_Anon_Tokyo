import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { SectionCard } from '../components/SectionCard'
import { truncate } from '../lib/utils'

export function GuidedDemoPage() {
  const queryClient = useQueryClient()
  const health = useQuery({ queryKey: ['health'], queryFn: api.health, refetchInterval: 15000 })
  const scenario = useQuery({ queryKey: ['scenario'], queryFn: api.scenario })

  const reset = useMutation({
    mutationFn: api.resetDemo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] })
      queryClient.invalidateQueries({ queryKey: ['scenario'] })
      queryClient.invalidateQueries({ queryKey: ['chain-status'] })
      queryClient.invalidateQueries({ queryKey: ['chain-blocks'] })
      localStorage.removeItem('demo_latest_raw_text')
      localStorage.removeItem('demo_latest_watermarked_text')
    },
  })

  const loadFixture = () => {
    if (!scenario.data) return
    localStorage.setItem('demo_latest_raw_text', scenario.data.raw_text)
    localStorage.setItem('demo_latest_watermarked_text', scenario.data.watermarked_text)
  }

  return (
    <div className="page-grid">
      <SectionCard
        title="Guided Demo Control"
        subtitle="Use this page as the stable starting point for presentations."
        actions={
          <>
            <button className="btn" onClick={loadFixture} disabled={!scenario.data}>
              Load Fixture Into Session
            </button>
            <button className="btn btn-danger" onClick={() => reset.mutate()} disabled={reset.isPending}>
              {reset.isPending ? 'Resetting...' : 'Reset Demo State'}
            </button>
          </>
        }
      >
        <div className="two-col">
          <div>
            <h3>Environment</h3>
            <ul className="list">
              <li>API: {health.data?.status ?? '...'}</li>
              <li>Mode: {health.data?.demo_mode ?? '...'}</li>
              <li>Chain blocks: {health.data?.chain.length ?? '...'}</li>
              <li>Chain valid: {health.data?.chain.valid ? 'Yes' : 'No'}</li>
            </ul>
          </div>
          <div>
            <h3>Fixture Scenario</h3>
            <ul className="list">
              <li>Name: {scenario.data?.name ?? '...'}</li>
              <li>Hash: {scenario.data ? truncate(scenario.data.sha256_hash, 14) : '...'}</li>
              <li>Expected first block: #{scenario.data?.expected_first_block ?? '-'}</li>
            </ul>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Flow" subtitle="Recommended speaking sequence for mixed audiences.">
        <ol className="list ordered">
          <li>Open Company Flow and create issuer credentials.</li>
          <li>Generate/paste text, watermark-sign-anchor, then show receipt.</li>
          <li>Open User Flow, load latest output, verify success.</li>
          <li>Tamper one word, verify failure, then show chain explorer.</li>
        </ol>
        <div className="inline-actions">
          <Link to="/registry/demo/company" className="btn btn-primary">
            Company Flow
          </Link>
          <Link to="/registry/demo/user" className="btn btn-primary">
            User Flow
          </Link>
          <Link to="/registry/chain" className="btn">
            Chain Explorer
          </Link>
        </div>
      </SectionCard>
    </div>
  )
}
