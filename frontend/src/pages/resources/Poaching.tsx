import { useEffect, useState } from 'react'
import PageMeta from '../../components/common/PageMeta'
import { apiEndpoints } from '../../lib/api'

type Incident = { incident_id: number; incident_date: string; location: any; reserve_id: number | null; description: string | null }

export default function PoachingPage() {
  const [items, setItems] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<{ incident_date: string; lat: string; lon: string; reserve_id: string; description: string }>({ incident_date: '', lat: '', lon: '', reserve_id: '', description: '' })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiEndpoints.poaching.list()
      setItems(res.data || [])
    } catch (e) {
      setError('Failed to load incidents')
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
        incident_date: form.incident_date,
        lat: Number(form.lat),
        lon: Number(form.lon),
        reserve_id: form.reserve_id === '' ? null : Number(form.reserve_id),
        description: form.description || null,
      }
      if (editingId) {
        await apiEndpoints.poaching.update(editingId, payload)
      } else {
        await apiEndpoints.poaching.create(payload)
      }
      setForm({ incident_date: '', lat: '', lon: '', reserve_id: '', description: '' })
      setEditingId(null)
      await load()
    } catch (e) {
      setError('Save failed')
    }
  }

  const edit = (i: Incident) => {
    setEditingId(i.incident_id)
    setForm({
      incident_date: i.incident_date?.slice(0,10) || '',
      lat: '',
      lon: '',
      reserve_id: i.reserve_id == null ? '' : String(i.reserve_id),
      description: i.description || '',
    })
  }

  const delItem = async (id: number) => {
    setError(null)
    try {
      await apiEndpoints.poaching.delete(id)
      await load()
    } catch (e) {
      setError('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Poaching Incidents" />
      <h1 className="text-2xl font-semibold">Poaching Incidents</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{error}</div>}

      <form onSubmit={submit} className="bg-white p-4 rounded-lg shadow grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-sm text-gray-600">Date</label>
          <input value={form.incident_date} onChange={(e) => setForm({ ...form, incident_date: e.target.value })} type="date" className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Lat</label>
          <input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} type="number" step="any" className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Lon</label>
          <input value={form.lon} onChange={(e) => setForm({ ...form, lon: e.target.value })} type="number" step="any" className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Reserve ID</label>
          <input value={form.reserve_id} onChange={(e) => setForm({ ...form, reserve_id: e.target.value })} type="number" className="border rounded px-3 py-2 w-full" />
        </div>
        <div className="sm:col-span-5">
          <label className="block text-sm text-gray-600">Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Create'}</button>
        </div>
        {editingId && (
          <div>
            <button type="button" onClick={() => { setEditingId(null); setForm({ incident_date: '', lat: '', lon: '', reserve_id: '', description: '' }) }} className="px-3 py-2 rounded border">Cancel</button>
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
                <th className="p-3">Date</th>
                <th className="p-3">Location</th>
                <th className="p-3">Reserve ID</th>
                <th className="p-3">Description</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.incident_id} className="border-t">
                  <td className="p-3">{i.incident_id}</td>
                  <td className="p-3">{i.incident_date?.slice(0,10)}</td>
                  <td className="p-3">{typeof i.location === 'string' ? i.location : JSON.stringify(i.location)}</td>
                  <td className="p-3">{i.reserve_id ?? '—'}</td>
                  <td className="p-3">{i.description || '—'}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => edit(i)} className="px-3 py-1 border rounded">Edit</button>
                    <button onClick={() => delItem(i.incident_id)} className="px-3 py-1 border rounded text-red-600">Delete</button>
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
