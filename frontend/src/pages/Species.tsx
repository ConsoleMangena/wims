import { useEffect, useState } from 'react'
import { backendApi } from '../lib/api'

type Species = {
  w_species_id: number
  name: string
  population: number | null
  created_at?: string
}

export default function SpeciesPage() {
  const [items, setItems] = useState<Species[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formPopulation, setFormPopulation] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editPopulation, setEditPopulation] = useState<string>('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    backendApi
      .get<Species[]>('/api/species')
      .then((res) => setItems(res.data))
      .catch((e) => setError(e?.message || 'Failed to load species'))
      .finally(() => setLoading(false))
  }, [])

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = {
        name: formName.trim(),
        population: formPopulation === '' ? null : Number(formPopulation),
      }
      const res = await backendApi.post<Species>('/api/species', payload)
      setItems((prev) => [res.data, ...prev])
      setFormName('')
      setFormPopulation('')
    } catch (e: any) {
      setSubmitError(e?.message || 'Failed to create species')
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(id: number) {
    try {
      await backendApi.delete(`/api/species/${id}`)
      setItems((prev) => prev.filter((s) => s.w_species_id !== id))
    } catch (e: any) {
      alert(e?.message || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-800">Species</h2>
      <p className="text-sm text-slate-600">Manage the catalogue of wildlife species and optionally track estimated populations. Use the form to add species and the table to delete entries.</p>
      <section className="bg-white border rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-slate-600 mb-3">Add Species</h3>
        <form onSubmit={onAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Name</label>
            <input
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              placeholder="e.g. Elephant"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Population (optional)</label>
            <input
              type="number"
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
              value={formPopulation}
              onChange={(e) => setFormPopulation(e.target.value)}
              placeholder="e.g. 1200"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Adding…' : 'Add Species'}
            </button>
          </div>
        </form>
        {submitError && <p className="text-sm text-red-600 mt-2">{submitError}</p>}
      </section>
      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <section className="bg-white border rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium">ID</th>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium">Name</th>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium">Population</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((s) => {
                  const isEditing = editId === s.w_species_id
                  return (
                    <tr key={s.w_species_id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">{s.w_species_id}</td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Name"
                          />
                        ) : (
                          s.name
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <input
                            type="number"
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            value={editPopulation}
                            onChange={(e) => setEditPopulation(e.target.value)}
                            placeholder="Population (optional)"
                          />
                        ) : (
                          s.population ?? '—'
                        )}
                      </td>
                      <td className="px-4 py-2 text-right space-x-3">
                        {isEditing ? (
                          <>
                            <button
                              onClick={async () => {
                                if (!editName.trim()) {
                                  setUpdateError('Name is required')
                                  return
                                }
                                const popVal = editPopulation.trim() === '' ? null : Number(editPopulation)
                                if (popVal !== null && Number.isNaN(popVal)) {
                                  setUpdateError('Population must be a number')
                                  return
                                }
                                setUpdating(true)
                                setUpdateError(null)
                                try {
                                  const res = await backendApi.put(`/api/species/${s.w_species_id}`, {
                                    name: editName.trim(),
                                    population: popVal,
                                  })
                                  setItems((prev) => prev.map((x) => (x.w_species_id === s.w_species_id ? res.data : x)))
                                  setEditId(null)
                                  setEditName('')
                                  setEditPopulation('')
                                } catch (e: any) {
                                  setUpdateError(e?.message || 'Failed to update species')
                                } finally {
                                  setUpdating(false)
                                }
                              }}
                              disabled={updating}
                              className="text-emerald-600 hover:underline disabled:opacity-50"
                            >
                              {updating ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setEditId(null)
                                setEditName('')
                                setEditPopulation('')
                                setUpdateError(null)
                              }}
                              className="text-slate-600 hover:underline"
                            >
                              Cancel
                            </button>
                            {updateError && <div className="text-xs text-red-600 mt-1 inline-block">{updateError}</div>}
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditId(s.w_species_id)
                                setEditName(s.name)
                                setEditPopulation(s.population?.toString() ?? '')
                              }}
                              className="text-sky-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDelete(s.w_species_id)}
                              className="text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
