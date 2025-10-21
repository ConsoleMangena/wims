import { useEffect, useState } from 'react'
import PageMeta from '../../components/common/PageMeta'
import { apiEndpoints } from '../../lib/api'

type Species = { w_species_id: number; name: string; population: number | null; created_at?: string }

export default function SpeciesPage() {
  const [items, setItems] = useState<Species[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<{ name: string; population: string }>({ name: '', population: '' })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiEndpoints.species.list()
      setItems(res.data || [])
    } catch (e) {
      setError('Failed to load species')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const payload: any = {
        name: form.name,
        population: form.population === '' ? null : Number(form.population),
      }
      if (editingId) {
        await apiEndpoints.species.update(editingId, payload)
      } else {
        await apiEndpoints.species.create(payload)
      }
      setForm({ name: '', population: '' })
      setEditingId(null)
      await load()
    } catch (e) {
      setError('Save failed')
    }
  }

  const edit = (s: Species) => {
    setEditingId(s.w_species_id)
    setForm({ name: s.name, population: s.population == null ? '' : String(s.population) })
  }

  const delItem = async (id: number) => {
    setError(null)
    try {
      await apiEndpoints.species.delete(id)
      await load()
    } catch (e) {
      setError('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Species" />
      <h1 className="text-2xl font-semibold">Species</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{error}</div>}

      <form onSubmit={submit} className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm text-gray-600">Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2 w-64" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Population</label>
          <input value={form.population} onChange={(e) => setForm({ ...form, population: e.target.value })} type="number" className="border rounded px-3 py-2 w-40" />
        </div>
        <button type="submit" className="bg-brand-500 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Create'}</button>
        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', population: '' }) }} className="px-3 py-2 rounded border">Cancel</button>
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
                <th className="p-3">Population</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.w_species_id} className="border-t">
                  <td className="p-3">{s.w_species_id}</td>
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{s.population ?? '—'}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => edit(s)} className="px-3 py-1 border rounded">Edit</button>
                    <button onClick={() => delItem(s.w_species_id)} className="px-3 py-1 border rounded text-red-600">Delete</button>
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
