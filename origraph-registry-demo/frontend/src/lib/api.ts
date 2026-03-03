import type {
  AnchorResponse,
  ChainBlocksResponse,
  ChainStatusResponse,
  ChatRequest,
  ChatResponse,
  CompanyListItem,
  CreateCompanyResponse,
  DemoResetResponse,
  DemoScenarioResponse,
  HealthResponse,
  LatestResponse,
  ModelInfo,
  ProofByTextResponse,
  ProofByTxResponse,
  ResponsesResponse,
  VerifyResponse,
  WatermarkDetectResponse,
  WmParams,
} from '../types/api'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

async function parseResponse<T>(response: Response): Promise<T> {
  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const detail =
      payload && typeof payload === 'object' && 'detail' in payload
        ? String((payload as { detail?: string }).detail ?? response.statusText)
        : response.statusText
    throw new Error(detail || `HTTP ${response.status}`)
  }

  return payload as T
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  return parseResponse<T>(response)
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  })
  return parseResponse<T>(response)
}

export const api = {
  health: () => getJson<HealthResponse>('/api/health'),
  models: () => getJson<{ minimax: ModelInfo[]; bedrock: ModelInfo[] }>('/api/models'),

  chat: (payload: ChatRequest) => postJson<ChatResponse>('/api/chat', payload),
  apply: (text: string, wmParams: WmParams) =>
    postJson<{ text: string; raw_text: string }>('/api/apply', { text, wm_params: wmParams }),
  detect: (text: string, wmParams: WmParams) =>
    postJson<WatermarkDetectResponse>('/api/detect', { text, wm_params: wmParams }),
  strip: (text: string) => postJson<{ text: string }>('/api/strip', { text }),

  scenario: () => getJson<DemoScenarioResponse>('/api/demo/scenario'),
  resetDemo: () => postJson<DemoResetResponse>('/api/demo/reset', {}),

  createCompany: (name: string, adminSecret: string) =>
    postJson<CreateCompanyResponse>('/api/registry/companies', {
      name,
      admin_secret: adminSecret,
    }),
  listCompanies: () => getJson<CompanyListItem[]>('/api/registry/companies'),

  anchor: (payload: {
    text: string
    raw_text: string
    signature_hex: string
    issuer_id: number
    metadata: Record<string, unknown>
  }) => postJson<AnchorResponse>('/api/registry/anchor', payload),

  verify: (text: string) => postJson<VerifyResponse>('/api/registry/verify', { text }),
  proofByText: (text: string) => postJson<ProofByTextResponse>('/api/registry/proof/text', { text }),
  proofByTxHash: (txHash: string) => getJson<ProofByTxResponse>(`/api/registry/proof/tx/${encodeURIComponent(txHash)}`),

  chainStatus: () => getJson<ChainStatusResponse>('/api/registry/chain/status'),
  chainBlocks: (limit = 20, offset = 0) =>
    getJson<ChainBlocksResponse>(`/api/registry/chain/blocks?limit=${limit}&offset=${offset}`),
  responses: (limit = 50, offset = 0) =>
    getJson<ResponsesResponse>(`/api/registry/responses?limit=${limit}&offset=${offset}`),
  latestResponse: () => getJson<LatestResponse>('/api/registry/demo/latest-response'),
}
