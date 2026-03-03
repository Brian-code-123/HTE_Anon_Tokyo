export interface WmParams {
  issuer_id: number
  model_id: number
  model_version_id: number
  key_id: number
  repeat_interval_tokens: number
}

export interface ModelInfo {
  id: string
  name: string
  provider: 'minimax' | 'bedrock'
}

export interface HealthResponse {
  status: 'ok' | string
  demo_mode: 'live' | 'fixture' | string
  minimax_api_key_configured: boolean
  minimax_required: boolean
  chain: {
    length: number
    valid: boolean
    message: string
  }
}

export interface DemoScenarioResponse {
  name: string
  description: string
  raw_text: string
  watermarked_text: string
  wm_params: WmParams
  sha256_hash: string
  expected_first_block: number
  tamper_example: string
}

export interface ChatRequest {
  model: string
  provider: 'minimax' | 'bedrock'
  messages: Array<{ role: string; content: Array<{ type: 'text'; text: string }> }>
  system: string
  watermark: boolean
  wm_params: WmParams
  stream: boolean
  max_tokens: number
  temperature: number
}

export interface ChatResponse {
  thinking?: string
  text?: string
  raw_text?: string
  watermarked?: boolean
  model?: string
  provider?: string
  usage?: {
    input_tokens: number
    output_tokens: number
  }
  error?: string
}

export interface WatermarkDetectResponse {
  watermarked: boolean
  tag_count: number
  valid_count: number
  invalid_count: number
  payloads: Array<Record<string, unknown>>
}

export interface CreateCompanyResponse {
  issuer_id: number
  name: string
  eth_address: string
  private_key: string
  warning: string
}

export interface CompanyListItem {
  issuer_id: number
  name: string
  eth_address: string
  active: boolean
  created_at: string
}

export interface AnchorResponse {
  verified_signer: string
  eth_address: string
  sha256_hash: string
  chain_receipt: {
    tx_hash: string
    block_num: number
    data_hash: string
    issuer_id: number
    timestamp: string
  }
  proof_bundle_v1?: ProofBundleV1
}

export interface VerifyResponse {
  verified: boolean
  sha256_hash: string
  reason?: string
  issuer_id?: number
  company?: string
  eth_address?: string
  block_num?: number
  tx_hash?: string
  timestamp?: string
  watermark: {
    detected: boolean
    tag_count: number
    payloads: Array<Record<string, unknown>>
  }
  proof_bundle_v1?: ProofBundleV1
}

export interface ProofBundleV1 {
  bundle_id: string
  spec: 'origraph-proof-bundle/v1' | string
  hashing: {
    algorithm: 'sha256' | string
    text_hash: string
    input_encoding: string
    normalization: string
  }
  issuer: {
    issuer_id: number
    name: string
    eth_address: string | null
    public_key_hex: string | null
  }
  signature: {
    scheme: string
    signed_payload: string
    signature_hex: string
    recoverable_address: boolean
  }
  watermark: {
    detected: boolean
    tag_count: number
    payloads: Array<Record<string, unknown>>
  }
  anchors: Array<{
    type: string
    network: string
    tx_hash: string
    block_num: number
    timestamp: string
    data_hash: string
  }>
  verification_hints: {
    chain_id: number | null
    contract_address: string | null
    event_signature: string
    rpc_urls: string[]
  }
}

export interface ProofByTextResponse {
  found: boolean
  verified: boolean
  sha256_hash: string
  reason?: string
  proof_bundle_v1?: ProofBundleV1
}

export interface ProofByTxResponse {
  found: boolean
  tx_hash: string
  proof_bundle_v1?: ProofBundleV1
}

export interface ChainStatusResponse {
  length: number
  valid: boolean
  message: string
}

export interface ChainBlock {
  block_num: number
  prev_hash: string
  tx_hash: string
  data_hash: string
  issuer_id: number
  signature_hex: string
  payload_json: string
  timestamp: string
}

export interface ChainBlocksResponse {
  blocks: ChainBlock[]
  total: number
  limit: number
  offset: number
}

export interface ResponsesResponse {
  responses: Array<{
    id: number
    sha256_hash: string
    issuer_id: number
    created_at: string
    metadata_json: string
  }>
  total: number
}

export interface LatestResponse {
  id: number
  sha256_hash: string
  issuer_id: number
  raw_text: string
  watermarked_text: string
  created_at: string
  company_name: string | null
}

export interface DemoResetResponse {
  ok: boolean
  db_path: string
  chain_length: number
}
