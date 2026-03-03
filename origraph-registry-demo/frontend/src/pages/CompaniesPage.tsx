import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { SectionCard } from '../components/SectionCard'

export function CompaniesPage() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [secret, setSecret] = useState('dev-admin-secret')
  const [error, setError] = useState('')

  const companies = useQuery({ queryKey: ['companies'], queryFn: api.listCompanies })

  const create = useMutation({
    mutationFn: () => api.createCompany(name, secret),
    onSuccess: () => {
      setName('')
      setError('')
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  })

  return (
    <div className="page-grid">
      <SectionCard title="Register Company" subtitle="Provision issuer IDs for demo organizations.">
        <div className="form-grid two">
          <label>
            Company name
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Admin secret
            <input value={secret} onChange={(event) => setSecret(event.target.value)} type="password" />
          </label>
        </div>
        <button className="btn btn-primary" onClick={() => create.mutate()} disabled={create.isPending || !name.trim()}>
          {create.isPending ? 'Creating...' : 'Create Company'}
        </button>
        {error ? <p className="feedback error">{error}</p> : null}
      </SectionCard>

      <SectionCard title="Authorized Companies">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Issuer</th>
                <th>Name</th>
                <th>Address</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {(companies.data ?? []).map((company) => (
                <tr key={company.issuer_id}>
                  <td>{company.issuer_id}</td>
                  <td>{company.name}</td>
                  <td>{company.eth_address}</td>
                  <td>{company.active ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}
