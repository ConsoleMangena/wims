import { useEffect, useState } from 'react'
import PageMeta from '../../components/common/PageMeta'
import { apiEndpoints } from '../../lib/api'

type Hunter = { hunter_id: number; name: string; address?: string | null }

export default function HuntersPage() {
  const [items, setItems] = useState<Hunter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<{ name: string; address: string }>({ name: '', address: '' })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiEndpoints.hunters.list()
      setItems(res.data || [])
    } catch (e) {
      setError('Failed to load hunters')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const payload: any = { name: form.name, address: form.address || null }
      if (editingId) {
        await apiEndpoints.hunters.update(editingId, payload)
      } else {
        await apiEndpoints.hunters.create(payload)
      }
      setForm({ name: '', address: '' })
      setEditingId(null)
      await load()
    } catch (e) {
      setError('Save failed')
    }
  }

  const edit = (h: Hunter) => {
    setEditingId(h.hunter_id)
    setForm({ name: h.name, address: h.address || '' })
  }

  const delItem = async (id: number) => {
    setError(null)
    try {
      await apiEndpoints.hunters.delete(id)
      await load()
    } catch (e) {
      setError('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Hunters" />
      <h1 className="text-2xl font-semibold">Hunters</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{error}</div>}

      <form onSubmit={submit} className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm text-gray-600">Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2 w-64" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Address</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="border rounded px-3 py-2 w-80" />
        </div>
        <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Create'}</button>
        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', address: '' }) }} className="px-3 py-2 rounded border">Cancel</button>
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
                <th className="p-3">Address</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((h) => (
                <tr key={h.hunter_id} className="border-t">
                  <td className="p-3">{h.hunter_id}</td>
                  <td className="p-3">{h.name}</td>
                  <td className="p-3">{h.address || '—'}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => edit(h)} className="px-3 py-1 border rounded">Edit</button>
                    <button onClick={() => delItem(h.hunter_id)} className="px-3 py-1 border rounded text-red-600">Delete</button>
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
