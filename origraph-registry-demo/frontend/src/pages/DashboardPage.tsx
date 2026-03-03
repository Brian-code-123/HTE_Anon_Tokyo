import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { truncate } from '../lib/utils'
import { SectionCard } from '../components/SectionCard'

export function DashboardPage() {
  const companies = useQuery({ queryKey: ['companies'], queryFn: api.listCompanies })
  const chain = useQuery({ queryKey: ['chain-status'], queryFn: api.chainStatus })
  const blocks = useQuery({ queryKey: ['chain-blocks', 5, 0], queryFn: () => api.chainBlocks(5, 0) })
  const responses = useQuery({ queryKey: ['responses', 1, 0], queryFn: () => api.responses(1, 0) })

  return (
    <div className="page-grid">
      <div className="stats-row">
        <div className="stat">
          <span>Companies</span>
          <strong>{companies.data?.length ?? '-'}</strong>
        </div>
        <div className="stat">
          <span>Chain Blocks</span>
          <strong>{chain.data?.length ?? '-'}</strong>
        </div>
        <div className="stat">
          <span>Responses</span>
          <strong>{responses.data?.total ?? '-'}</strong>
        </div>
        <div className="stat">
          <span>Integrity</span>
          <strong>{chain.data?.valid ? 'Valid' : 'Unknown'}</strong>
        </div>
      </div>

      <SectionCard title="Recent Chain Blocks" subtitle="Latest anchored records in descending order">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Block</th>
                <th>Issuer</th>
                <th>Data Hash</th>
                <th>Tx Hash</th>
              </tr>
            </thead>
            <tbody>
              {(blocks.data?.blocks ?? []).map((block) => (
                <tr key={block.block_num}>
                  <td>#{block.block_num}</td>
                  <td>{block.issuer_id}</td>
                  <td>{truncate(block.data_hash, 10)}</td>
                  <td>{truncate(block.tx_hash, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}
