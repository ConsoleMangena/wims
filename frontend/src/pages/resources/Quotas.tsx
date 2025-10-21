import { useEffect, useState } from 'react'
import PageMeta from '../../components/common/PageMeta'
import { apiEndpoints } from '../../lib/api'

type Quota = { quota_id: number; year: number; w_species_id: number; reserve_id: number; quota: number }

export default function QuotasPage() {
  const [items, setItems] = useState<Quota[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<{ year: string; w_species_id: string; reserve_id: string; quota: string }>({ year: '', w_species_id: '', reserve_id: '', quota: '' })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiEndpoints.quotas.list()
      setItems(res.data || [])
    } catch (e) {
      setError('Failed to load quotas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const payload: any = {
        year: Number(form.year),
        w_species_id: Number(form.w_species_id),
        reserve_id: Number(form.reserve_id),
        quota: Number(form.quota),
      }
      if (editingId) {
        await apiEndpoints.quotas.update(editingId, payload)
      } else {
        await apiEndpoints.quotas.create(payload)
      }
      setForm({ year: '', w_species_id: '', reserve_id: '', quota: '' })
      setEditingId(null)
      await load()
    } catch (e) {
      setError('Save failed')
    }
  }

  const edit = (q: Quota) => {
    setEditingId(q.quota_id)
    setForm({ year: String(q.year), w_species_id: String(q.w_species_id), reserve_id: String(q.reserve_id), quota: String(q.quota) })
  }

  const delItem = async (id: number) => {
    setError(null)
    try {
      await apiEndpoints.quotas.delete(id)
      await load()
    } catch (e) {
      setError('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Quotas" />
      <h1 className="text-2xl font-semibold">Annual Quotas</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{error}</div>}

      <form onSubmit={submit} className="bg-white p-4 rounded-lg shadow grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-sm text-gray-600">Year</label>
          <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} type="number" className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Species ID</label>
          <input value={form.w_species_id} onChange={(e) => setForm({ ...form, w_species_id: e.target.value })} type="number" className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Reserve ID</label>
          <input value={form.reserve_id} onChange={(e) => setForm({ ...form, reserve_id: e.target.value })} type="number" className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Quota</label>
          <input value={form.quota} onChange={(e) => setForm({ ...form, quota: e.target.value })} type="number" className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Create'}</button>
        </div>
        {editingId && (
          <div>
            <button type="button" onClick={() => { setEditingId(null); setForm({ year: '', w_species_id: '', reserve_id: '', quota: '' }) }} className="px-3 py-2 rounded border">Cancel</button>
          </div>
        )}
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="p-4">Loading...</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="p-3">ID</th>
                <th className="p-3">Year</th>
                <th className="p-3">Species ID</th>
                <th className="p-3">Reserve ID</th>
                <th className="p-3">Quota</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((q) => (
                <tr key={q.quota_id} className="border-t">
                  <td className="p-3">{q.quota_id}</td>
                  <td className="p-3">{q.year}</td>
                  <td className="p-3">{q.w_species_id}</td>
                  <td className="p-3">{q.reserve_id}</td>
                  <td className="p-3">{q.quota}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => edit(q)} className="px-3 py-1 border rounded">Edit</button>
                    <button onClick={() => delItem(q.quota_id)} className="px-3 py-1 border rounded text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
