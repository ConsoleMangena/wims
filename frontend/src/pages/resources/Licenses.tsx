import { useEffect, useState } from 'react'
import PageMeta from '../../components/common/PageMeta'
import { apiEndpoints } from '../../lib/api'

type License = { licence_id: number; hunter_id: number; issue_date: string; expiry_date: string }

export default function LicensesPage() {
  const [items, setItems] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<{ hunter_id: string; issue_date: string; expiry_date: string }>({ hunter_id: '', issue_date: '', expiry_date: '' })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiEndpoints.licenses.list()
      setItems(res.data || [])
    } catch (e) {
      setError('Failed to load licenses')
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
        hunter_id: Number(form.hunter_id),
        issue_date: form.issue_date,
        expiry_date: form.expiry_date,
      }
      if (editingId) {
        await apiEndpoints.licenses.update(editingId, payload)
      } else {
        await apiEndpoints.licenses.create(payload)
      }
      setForm({ hunter_id: '', issue_date: '', expiry_date: '' })
      setEditingId(null)
      await load()
    } catch (e) {
      setError('Save failed')
    }
  }

  const edit = (l: License) => {
    setEditingId(l.licence_id)
    setForm({ hunter_id: String(l.hunter_id), issue_date: l.issue_date?.slice(0,10) || '', expiry_date: l.expiry_date?.slice(0,10) || '' })
  }

  const delItem = async (id: number) => {
    setError(null)
    try {
      await apiEndpoints.licenses.delete(id)
      await load()
    } catch (e) {
      setError('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Licenses" />
      <h1 className="text-2xl font-semibold">Licenses</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{error}</div>}

      <form onSubmit={submit} className="bg-white p-4 rounded-lg shadow grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm text-gray-600">Hunter ID</label>
          <input value={form.hunter_id} onChange={(e) => setForm({ ...form, hunter_id: e.target.value })} type="number" className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Issue Date</label>
          <input value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} type="date" className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Expiry Date</label>
          <input value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} type="date" className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Create'}</button>
        </div>
        {editingId && (
          <div>
            <button type="button" onClick={() => { setEditingId(null); setForm({ hunter_id: '', issue_date: '', expiry_date: '' }) }} className="px-3 py-2 rounded border">Cancel</button>
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
                <th className="p-3">Hunter ID</th>
                <th className="p-3">Issue Date</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.licence_id} className="border-t">
                  <td className="p-3">{l.licence_id}</td>
                  <td className="p-3">{l.hunter_id}</td>
                  <td className="p-3">{l.issue_date?.slice(0,10)}</td>
                  <td className="p-3">{l.expiry_date?.slice(0,10)}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => edit(l)} className="px-3 py-1 border rounded">Edit</button>
                    <button onClick={() => delItem(l.licence_id)} className="px-3 py-1 border rounded text-red-600">Delete</button>
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
