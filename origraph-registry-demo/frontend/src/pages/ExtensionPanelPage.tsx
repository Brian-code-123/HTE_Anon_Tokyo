import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { JsonBlock } from '../components/JsonBlock'
import { SectionCard } from '../components/SectionCard'

export function ExtensionPanelPage() {
  const [sample, setSample] = useState('')
  const [error, setError] = useState('')

  const verify = useMutation({
    mutationFn: () => api.verify(sample),
    onSuccess: () => setError(''),
    onError: (mutationError: Error) => setError(mutationError.message),
  })

  return (
    <div className="page-grid">
      <SectionCard title="Browser Extension Integration" subtitle="Operational handoff between extension detections and registry verification.">
        <ol className="list ordered">
          <li>Load unpacked extension from the <code>extension/</code> directory.</li>
          <li>Set extension backend URL to <code>http://127.0.0.1:5050</code>.</li>
          <li>Use Selection Scan or Auto-Detect modes on target pages.</li>
          <li>Forward detected text to <code>/api/registry/verify</code> for provenance proof.</li>
        </ol>
      </SectionCard>

      <SectionCard title="Quick Verify Playground" subtitle="Simulate extension-to-backend verification payloads.">
        <label>
          Captured text
          <textarea value={sample} onChange={(event) => setSample(event.target.value)} rows={8} />
        </label>
        <button className="btn btn-primary" onClick={() => verify.mutate()} disabled={verify.isPending || !sample.trim()}>
          {verify.isPending ? 'Verifying...' : 'Verify via API'}
        </button>
        {error ? <p className="feedback error">{error}</p> : null}
      </SectionCard>

      {verify.data ? (
        <SectionCard title="API Response">
          <JsonBlock value={verify.data} />
        </SectionCard>
      ) : null}
    </div>
  )
}
