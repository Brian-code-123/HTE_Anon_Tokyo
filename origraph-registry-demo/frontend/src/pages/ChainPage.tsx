import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { truncate } from '../lib/utils'
import { SectionCard } from '../components/SectionCard'

const PAGE_SIZE = 20

export function ChainPage() {
  const [offset, setOffset] = useState(0)
  const chain = useQuery({ queryKey: ['chain-status'], queryFn: api.chainStatus, refetchInterval: 10000 })
  const blocks = useQuery({
    queryKey: ['chain-blocks', PAGE_SIZE, offset],
    queryFn: () => api.chainBlocks(PAGE_SIZE, offset),
  })

  return (
    <div className="page-grid">
      <SectionCard title="Chain Integrity" subtitle={chain.data?.message ?? 'Checking chain health...'}>
        <div className="stats-row">
          <div className="stat">
            <span>Length</span>
            <strong>{chain.data?.length ?? '-'}</strong>
          </div>
          <div className="stat">
            <span>Valid</span>
            <strong>{chain.data?.valid ? 'Yes' : 'No'}</strong>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Blocks"
        actions={
          <div className="inline-actions">
            <button className="btn" onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0}>
              Previous
            </button>
            <button
              className="btn"
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={(blocks.data?.blocks.length ?? 0) < PAGE_SIZE}
            >
              Next
            </button>
          </div>
        }
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Block</th>
                <th>Issuer</th>
                <th>Data Hash</th>
                <th>Tx Hash</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {(blocks.data?.blocks ?? []).map((block) => (
                <tr key={block.block_num}>
                  <td>#{block.block_num}</td>
                  <td>{block.issuer_id}</td>
                  <td>{truncate(block.data_hash, 10)}</td>
                  <td>{truncate(block.tx_hash, 10)}</td>
                  <td>{block.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}
