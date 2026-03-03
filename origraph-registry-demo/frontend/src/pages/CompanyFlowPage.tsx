import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Wallet } from 'ethers'
import { api } from '../lib/api'
import { isValidPrivateKey, normalizePrivateKey, sha256Hex, truncate } from '../lib/utils'
import { SectionCard } from '../components/SectionCard'
import { JsonBlock } from '../components/JsonBlock'
import type { WmParams } from '../types/api'

const defaultWmParams: WmParams = {
  issuer_id: 1,
  model_id: 0,
  model_version_id: 0,
  key_id: 1,
  repeat_interval_tokens: 160,
}

export function CompanyFlowPage() {
  const [provider, setProvider] = useState<'minimax' | 'bedrock'>('minimax')
  const [model, setModel] = useState('')
  const [prompt, setPrompt] = useState('Explain why provenance matters for AI-generated legal summaries.')
  const [systemPrompt, setSystemPrompt] = useState('You are a concise and accurate assistant.')
  const [companyName, setCompanyName] = useState('Acme AI')
  const [adminSecret, setAdminSecret] = useState('dev-admin-secret')
  const [issuerId, setIssuerId] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [rawText, setRawText] = useState('')
  const [lastReceipt, setLastReceipt] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  const modelsQuery = useQuery({ queryKey: ['models'], queryFn: api.models })

  const models = useMemo(() => {
    if (!modelsQuery.data) return []
    return provider === 'bedrock' ? modelsQuery.data.bedrock : modelsQuery.data.minimax
  }, [modelsQuery.data, provider])

  useEffect(() => {
    if (!model && models.length > 0) {
      setModel(models[0].id)
    }
  }, [model, models])

  const createCompany = useMutation({
    mutationFn: () => api.createCompany(companyName, adminSecret),
    onSuccess: (data) => {
      setIssuerId(String(data.issuer_id))
      setPrivateKey(data.private_key)
      setError('')
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  })

  const generate = useMutation({
    mutationFn: () =>
      api.chat({
        model,
        provider,
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
        system: systemPrompt,
        watermark: false,
        wm_params: defaultWmParams,
        stream: false,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    onSuccess: (data) => {
      if (data.error) {
        setError(data.error)
        return
      }
      setRawText((data.raw_text || data.text || '').trim())
      setError('')
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  })

  const anchor = useMutation({
    mutationFn: async () => {
      const issuer = Number(issuerId)
      if (!issuer || !rawText.trim()) {
        throw new Error('Issuer ID and model response are required.')
      }

      const normalizedPrivateKey = normalizePrivateKey(privateKey)
      if (!isValidPrivateKey(normalizedPrivateKey)) {
        throw new Error('Invalid private key format. Expected 64 hex chars with optional 0x prefix.')
      }

      const applied = await api.apply(rawText.trim(), {
        ...defaultWmParams,
        issuer_id: issuer,
      })

      const hashHex = await sha256Hex(applied.text)
      const wallet = new Wallet(normalizedPrivateKey)
      const signature = await wallet.signMessage(hashHex)

      const receipt = await api.anchor({
        text: applied.text,
        raw_text: rawText.trim(),
        signature_hex: signature.replace(/^0x/, ''),
        issuer_id: issuer,
        metadata: {
          demo_role: 'company',
          provider,
          model,
        },
      })

      localStorage.setItem('demo_latest_raw_text', rawText.trim())
      localStorage.setItem('demo_latest_watermarked_text', applied.text)

      return receipt
    },
    onSuccess: (data) => {
      setLastReceipt(data as unknown as Record<string, unknown>)
      setError('')
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  })

  return (
    <div className="page-grid">
      <SectionCard title="Company Credentials" subtitle="Create or load issuer credentials used for provenance signing.">
        <div className="form-grid two">
          <label>
            Company name
            <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
          </label>
          <label>
            Admin secret
            <input value={adminSecret} onChange={(event) => setAdminSecret(event.target.value)} type="password" />
          </label>
        </div>
        <button className="btn btn-primary" onClick={() => createCompany.mutate()} disabled={createCompany.isPending}>
          {createCompany.isPending ? 'Creating...' : 'Create Company Keypair'}
        </button>
      </SectionCard>

      <SectionCard title="Generate Output" subtitle="Use live or fixture-backed model generation before anchoring.">
        <div className="form-grid two">
          <label>
            Provider
            <select value={provider} onChange={(event) => setProvider(event.target.value as 'minimax' | 'bedrock')}>
              <option value="minimax">MiniMax</option>
              <option value="bedrock">Bedrock</option>
            </select>
          </label>
          <label>
            Model
            <select value={model} onChange={(event) => setModel(event.target.value)}>
              {models.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Prompt
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={4} />
        </label>
        <label>
          System prompt
          <input value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} />
        </label>
        <button className="btn" onClick={() => generate.mutate()} disabled={generate.isPending}>
          {generate.isPending ? 'Generating...' : 'Generate Response'}
        </button>
      </SectionCard>

      <SectionCard title="Watermark + Sign + Anchor" subtitle="Finalize provenance receipt and hand off to user flow.">
        <div className="form-grid two">
          <label>
            Issuer ID
            <input value={issuerId} onChange={(event) => setIssuerId(event.target.value)} />
          </label>
          <label>
            Private key
            <input value={privateKey} onChange={(event) => setPrivateKey(event.target.value)} type="password" />
          </label>
        </div>
        <label>
          Model response text
          <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} rows={8} />
        </label>
        <button className="btn btn-primary" onClick={() => anchor.mutate()} disabled={anchor.isPending}>
          {anchor.isPending ? 'Anchoring...' : 'Watermark, Sign, Anchor'}
        </button>
        {error ? <p className="feedback error">{error}</p> : null}
      </SectionCard>

      {lastReceipt ? (
        <SectionCard title="Anchor Receipt" subtitle="Share this evidence view with technical stakeholders.">
          <JsonBlock value={lastReceipt} />
          <p className="feedback">
            Latest hash: {truncate(String((lastReceipt.chain_receipt as { tx_hash?: string })?.tx_hash ?? ''), 14)}
          </p>
        </SectionCard>
      ) : null}
    </div>
  )
}
