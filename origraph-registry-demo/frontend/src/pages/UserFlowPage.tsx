import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { JsonBlock } from '../components/JsonBlock'
import { SectionCard } from '../components/SectionCard'

export function UserFlowPage() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState('')

  const verify = useMutation({
    mutationFn: () => api.verify(text),
    onSuccess: (data) => {
      setResult(data)
      setError('')
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message)
      setResult(null)
    },
  })

  const loadLocal = () => {
    const cached = localStorage.getItem('demo_latest_watermarked_text')
    if (!cached) {
      setError('No local handoff found. Anchor output in Company Flow first.')
      return
    }
    setText(cached)
    setError('')
  }

  const loadLatest = async () => {
    try {
      const latest = await api.latestResponse()
      setText(latest.watermarked_text || '')
      setError('')
    } catch (latestError) {
      setError(latestError instanceof Error ? latestError.message : 'Failed to load latest response')
    }
  }

  return (
    <div className="page-grid">
      <SectionCard
        title="End User Verification"
        subtitle="Simulate what a receiver sees when validating AI output provenance."
        actions={
          <>
            <button className="btn" onClick={loadLocal}>
              Load Local Handoff
            </button>
            <button className="btn" onClick={loadLatest}>
              Load Latest Anchored
            </button>
          </>
        }
      >
        <label>
          Text to verify
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={10} />
        </label>
        <button className="btn btn-primary" onClick={() => verify.mutate()} disabled={verify.isPending || !text.trim()}>
          {verify.isPending ? 'Verifying...' : 'Verify Provenance'}
        </button>
        {error ? <p className="feedback error">{error}</p> : null}
      </SectionCard>

      {result ? (
        <SectionCard title="Verification Result">
          <JsonBlock value={result} />
        </SectionCard>
      ) : null}
    </div>
  )
}
