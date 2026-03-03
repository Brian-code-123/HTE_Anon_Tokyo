import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { JsonBlock } from '../components/JsonBlock'
import { SectionCard } from '../components/SectionCard'

export function AnchorPage() {
  const [issuerId, setIssuerId] = useState('100')
  const [signatureHex, setSignatureHex] = useState('')
  const [rawText, setRawText] = useState('')
  const [watermarkedText, setWatermarkedText] = useState('')
  const [metadata, setMetadata] = useState('{"source":"manual"}')
  const [error, setError] = useState('')

  const anchor = useMutation({
    mutationFn: async () => {
      let parsedMetadata: Record<string, unknown> = {}
      if (metadata.trim()) {
        parsedMetadata = JSON.parse(metadata) as Record<string, unknown>
      }
      return api.anchor({
        issuer_id: Number(issuerId),
        signature_hex: signatureHex,
        raw_text: rawText,
        text: watermarkedText,
        metadata: parsedMetadata,
      })
    },
    onError: (mutationError: Error) => setError(mutationError.message),
    onSuccess: () => setError(''),
  })

  return (
    <div className="page-grid">
      <SectionCard title="Manual Anchor" subtitle="Advanced endpoint testing without the guided flow.">
        <div className="form-grid two">
          <label>
            Issuer ID
            <input value={issuerId} onChange={(event) => setIssuerId(event.target.value)} />
          </label>
          <label>
            Signature hex
            <input value={signatureHex} onChange={(event) => setSignatureHex(event.target.value)} />
          </label>
        </div>
        <label>
          Raw text
          <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} rows={4} />
        </label>
        <label>
          Watermarked text
          <textarea value={watermarkedText} onChange={(event) => setWatermarkedText(event.target.value)} rows={6} />
        </label>
        <label>
          Metadata JSON
          <textarea value={metadata} onChange={(event) => setMetadata(event.target.value)} rows={3} />
        </label>
        <button className="btn btn-primary" onClick={() => anchor.mutate()} disabled={anchor.isPending}>
          {anchor.isPending ? 'Anchoring...' : 'Anchor'}
        </button>
        {error ? <p className="feedback error">{error}</p> : null}
      </SectionCard>

      {anchor.data ? (
        <SectionCard title="Anchor Response">
          <JsonBlock value={anchor.data} />
        </SectionCard>
      ) : null}
    </div>
  )
}
