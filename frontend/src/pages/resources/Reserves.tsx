import { useEffect, useState } from 'react'
import PageMeta from '../../components/common/PageMeta'
import { apiEndpoints } from '../../lib/api'

type Reserve = { reserve_id: number; name: string; boundary: string }

export default function ReservesPage() {
  const [items, setItems] = useState<Reserve[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<{ name: string; boundary: string }>({ name: '', boundary: '' })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiEndpoints.reserves.list()
      setItems(res.data || [])
    } catch (e) {
      setError('Failed to load reserves')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const payload: any = { name: form.name, boundary: form.boundary }
      if (editingId) {
        await apiEndpoints.reserves.update(editingId, payload)
      } else {
        await apiEndpoints.reserves.create(payload)
      }
      setForm({ name: '', boundary: '' })
      setEditingId(null)
      await load()
    } catch (e) {
      setError('Save failed')
    }
  }

  const edit = (r: Reserve) => {
    setEditingId(r.reserve_id)
    setForm({ name: r.name, boundary: r.boundary || '' })
  }

  const delItem = async (id: number) => {
    setError(null)
    try {
      await apiEndpoints.reserves.delete(id)
      await load()
    } catch (e) {
      setError('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Reserves" />
      <h1 className="text-2xl font-semibold">Reserves</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{error}</div>}

      <form onSubmit={submit} className="bg-white p-4 rounded-lg shadow grid grid-cols-1 gap-4 items-end">
        <div>
          <label className="block text-sm text-gray-600">Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2 w-64" required />
        </div>
        <div className="">
          <label className="block text-sm text-gray-600">Boundary ((x1,y1),(x2,y2),...)</label>
          <textarea value={form.boundary} onChange={(e) => setForm({ ...form, boundary: e.target.value })} className="border rounded px-3 py-2 w-full min-h-24" placeholder="((lon,lat),(lon,lat),(lon,lat))" required />
        </div>
        <div>
          <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Create'}</button>
        </div>
        {editingId && (
          <div>
            <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', boundary: '' }) }} className="px-3 py-2 rounded border">Cancel</button>
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
                <th className="p-3">Name</th>
                <th className="p-3">Boundary</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.reserve_id} className="border-t align-top">
                  <td className="p-3">{r.reserve_id}</td>
                  <td className="p-3">{r.name}</td>
                  <td className="p-3 text-xs whitespace-pre-wrap break-all max-w-[600px]">{r.boundary}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => edit(r)} className="px-3 py-1 border rounded">Edit</button>
                    <button onClick={() => delItem(r.reserve_id)} className="px-3 py-1 border rounded text-red-600">Delete</button>
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
