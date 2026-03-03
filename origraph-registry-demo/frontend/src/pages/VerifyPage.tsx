import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { JsonBlock } from '../components/JsonBlock'
import { SectionCard } from '../components/SectionCard'

export function VerifyPage() {
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const verify = useMutation({
    mutationFn: () => api.verify(text),
    onSuccess: () => setError(''),
    onError: (mutationError: Error) => setError(mutationError.message),
  })

  return (
    <div className="page-grid">
      <SectionCard title="Verify Provenance" subtitle="Public verification endpoint for any received text payload.">
        <label>
          Text
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={10} />
        </label>
        <button className="btn btn-primary" onClick={() => verify.mutate()} disabled={verify.isPending || !text.trim()}>
          {verify.isPending ? 'Verifying...' : 'Verify'}
        </button>
        {error ? <p className="feedback error">{error}</p> : null}
      </SectionCard>

      {verify.data ? (
        <SectionCard title="Verification Result">
          <JsonBlock value={verify.data} />
        </SectionCard>
      ) : null}
    </div>
  )
}
