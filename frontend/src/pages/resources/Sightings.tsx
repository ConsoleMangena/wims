import { useEffect, useState } from 'react'
import PageMeta from '../../components/common/PageMeta'
import { apiEndpoints } from '../../lib/api'

type Sighting = { sighting_id: number; w_species_id: number; sighting_date: string; location: any; notes?: string | null }

export default function SightingsPage() {
  const [items, setItems] = useState<Sighting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<{ w_species_id: string; sighting_date: string; lat: string; lon: string; notes: string }>({ w_species_id: '', sighting_date: '', lat: '', lon: '', notes: '' })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiEndpoints.sightings.list()
      setItems(res.data || [])
    } catch (e) {
      setError('Failed to load sightings')
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
        w_species_id: Number(form.w_species_id),
        sighting_date: form.sighting_date,
        lat: Number(form.lat),
        lon: Number(form.lon),
        notes: form.notes || null,
      }
      if (editingId) {
        await apiEndpoints.sightings.update(editingId, payload)
      } else {
        await apiEndpoints.sightings.create(payload)
      }
      setForm({ w_species_id: '', sighting_date: '', lat: '', lon: '', notes: '' })
      setEditingId(null)
      await load()
    } catch (e) {
      setError('Save failed')
    }
  }

  const edit = (s: Sighting) => {
    setEditingId(s.sighting_id)
    setForm({
      w_species_id: String(s.w_species_id),
      sighting_date: s.sighting_date?.slice(0, 10) || '',
      lat: '',
      lon: '',
      notes: s.notes || '',
    })
  }

  const delItem = async (id: number) => {
    setError(null)
    try {
      await apiEndpoints.sightings.delete(id)
      await load()
    } catch (e) {
      setError('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Sightings" />
      <h1 className="text-2xl font-semibold">Sightings</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{error}</div>}

      <form onSubmit={submit} className="bg-white p-4 rounded-lg shadow grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-sm text-gray-600">Species ID</label>
          <input value={form.w_species_id} onChange={(e) => setForm({ ...form, w_species_id: e.target.value })} type="number" className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Date</label>
          <input value={form.sighting_date} onChange={(e) => setForm({ ...form, sighting_date: e.target.value })} type="date" className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Lat</label>
          <input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} type="number" step="any" className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Lon</label>
          <input value={form.lon} onChange={(e) => setForm({ ...form, lon: e.target.value })} type="number" step="any" className="border rounded px-3 py-2 w-full" required />
        </div>
        <div className="sm:col-span-5">
          <label className="block text-sm text-gray-600">Notes</label>
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Create'}</button>
        </div>
        {editingId && (
          <div>
            <button type="button" onClick={() => { setEditingId(null); setForm({ w_species_id: '', sighting_date: '', lat: '', lon: '', notes: '' }) }} className="px-3 py-2 rounded border">Cancel</button>
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
                <th className="p-3">Species ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Location</th>
                <th className="p-3">Notes</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.sighting_id} className="border-t">
                  <td className="p-3">{s.sighting_id}</td>
                  <td className="p-3">{s.w_species_id}</td>
                  <td className="p-3">{s.sighting_date?.slice(0,10)}</td>
                  <td className="p-3">{typeof s.location === 'string' ? s.location : JSON.stringify(s.location)}</td>
                  <td className="p-3">{s.notes || '—'}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => edit(s)} className="px-3 py-1 border rounded">Edit</button>
                    <button onClick={() => delItem(s.sighting_id)} className="px-3 py-1 border rounded text-red-600">Delete</button>
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
