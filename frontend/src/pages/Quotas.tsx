import { useEffect, useState } from 'react'
import { backendApi } from '../lib/api'

type Quota = {
  quota_id: number
  year: number
  w_species_id: number
  reserve_id: number
  quota: number
}

export default function QuotasPage() {
  const [items, setItems] = useState<Quota[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [species, setSpecies] = useState<Array<{ w_species_id: number; name: string }>>([])
  const [reserves, setReserves] = useState<Array<{ reserve_id: number; name: string }>>([])
  const [formYear, setFormYear] = useState('')
  const [formSpeciesId, setFormSpeciesId] = useState('')
  const [formReserveId, setFormReserveId] = useState('')
  const [formQuota, setFormQuota] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editYear, setEditYear] = useState('')
  const [editSpeciesId, setEditSpeciesId] = useState('')
  const [editReserveId, setEditReserveId] = useState('')
  const [editQuota, setEditQuota] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    backendApi
      .get<Quota[]>('/api/quotas')
      .then((res) => setItems(res.data))
      .catch((e) => setError(e?.message || 'Failed to load quotas'))
      .finally(() => setLoading(false))

    backendApi
      .get<Array<{ w_species_id: number; name: string }>>('/api/species')
      .then((res) => setSpecies(res.data))
      .catch(() => {})

    backendApi
      .get<Array<{ reserve_id: number; name: string }>>('/api/reserves')
      .then((res) => setReserves(res.data))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-800">Annual Quotas</h2>
      <p className="text-sm text-slate-600">Define yearly harvest limits per species and reserve. Select the year, species, reserve, and quota value to add a record. Use the table to review and remove quotas.</p>
      <section className="bg-white border rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-slate-600 mb-3">Add Quota</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!formYear || !formSpeciesId || !formReserveId || !formQuota) return
            setSubmitting(true)
            setSubmitError(null)
            try {
              const res = await backendApi.post<Quota>('/api/quotas', {
                year: Number(formYear),
                w_species_id: Number(formSpeciesId),
                reserve_id: Number(formReserveId),
                quota: Number(formQuota),
              })
              setItems((prev) => [res.data, ...prev])
              setFormYear('')
              setFormSpeciesId('')
              setFormReserveId('')
              setFormQuota('')
            } catch (e: any) {
              setSubmitError(e?.message || 'Failed to create quota')
            } finally {
              setSubmitting(false)
            }
          }}
          className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
        >
          <div>
            <label className="block text-sm text-slate-600 mb-1">Year</label>
            <input
              type="number"
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
              value={formYear}
              onChange={(e) => setFormYear(e.target.value)}
              placeholder="2025"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Species</label>
            <select
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
              value={formSpeciesId}
              onChange={(e) => setFormSpeciesId(e.target.value)}
              required
            >
              <option value="" disabled>Select species…</option>
              {species.map((s) => (
                <option key={s.w_species_id} value={s.w_species_id}>{s.name} (#{s.w_species_id})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Reserve</label>
            <select
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
              value={formReserveId}
              onChange={(e) => setFormReserveId(e.target.value)}
              required
            >
              <option value="" disabled>Select reserve…</option>
              {reserves.map((r) => (
                <option key={r.reserve_id} value={r.reserve_id}>{r.name} (#{r.reserve_id})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Quota</label>
            <input
              type="number"
              min={0}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
              value={formQuota}
              onChange={(e) => setFormQuota(e.target.value)}
              placeholder="100"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Adding…' : 'Add Quota'}
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
            <table className="min-w-full table-auto">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium border border-slate-200">ID</th>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium border border-slate-200">Year</th>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium border border-slate-200">Species ID</th>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium border border-slate-200">Reserve ID</th>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium border border-slate-200">Quota</th>
                  <th className="px-4 py-2 border border-slate-200" />
                </tr>
              </thead>
              <tbody>
                {items.map((q) => {
                  const isEditing = editId === q.quota_id
                  return (
                    <tr key={q.quota_id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 border border-slate-200">{q.quota_id}</td>
                      <td className="px-4 py-2 border border-slate-200">
                        {isEditing ? (
                          <input
                            type="number"
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            value={editYear}
                            onChange={(e) => setEditYear(e.target.value)}
                          />
                        ) : (
                          q.year
                        )}
                      </td>
                      <td className="px-4 py-2 border border-slate-200">
                        {isEditing ? (
                          <select
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            value={editSpeciesId}
                            onChange={(e) => setEditSpeciesId(e.target.value)}
                          >
                            <option value="" disabled>Select species…</option>
                            {species.map((s) => (
                              <option key={s.w_species_id} value={s.w_species_id}>{s.name} (#{s.w_species_id})</option>
                            ))}
                          </select>
                        ) : (
                          q.w_species_id
                        )}
                      </td>
                      <td className="px-4 py-2 border border-slate-200">
                        {isEditing ? (
                          <select
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            value={editReserveId}
                            onChange={(e) => setEditReserveId(e.target.value)}
                          >
                            <option value="" disabled>Select reserve…</option>
                            {reserves.map((r) => (
                              <option key={r.reserve_id} value={r.reserve_id}>{r.name} (#{r.reserve_id})</option>
                            ))}
                          </select>
                        ) : (
                          q.reserve_id
                        )}
                      </td>
                      <td className="px-4 py-2 border border-slate-200">
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            value={editQuota}
                            onChange={(e) => setEditQuota(e.target.value)}
                          />
                        ) : (
                          q.quota
                        )}
                      </td>
                      <td className="px-4 py-2 border border-slate-200 text-right space-x-3">
                        {isEditing ? (
                          <>
                            <button
                              onClick={async () => {
                                if (!editYear || !editSpeciesId || !editReserveId || !editQuota) {
                                  setUpdateError('All fields are required')
                                  return
                                }
                                setUpdating(true)
                                setUpdateError(null)
                                try {
                                  const res = await backendApi.put(`/api/quotas/${q.quota_id}`, {
                                    year: Number(editYear),
                                    w_species_id: Number(editSpeciesId),
                                    reserve_id: Number(editReserveId),
                                    quota: Number(editQuota),
                                  })
                                  setItems((prev) => prev.map((x) => (x.quota_id === q.quota_id ? res.data : x)))
                                  setEditId(null)
                                  setEditYear('')
                                  setEditSpeciesId('')
                                  setEditReserveId('')
                                  setEditQuota('')
                                } catch (e: any) {
                                  setUpdateError(e?.message || 'Failed to update quota')
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
                                setEditYear('')
                                setEditSpeciesId('')
                                setEditReserveId('')
                                setEditQuota('')
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
                                setEditId(q.quota_id)
                                setEditYear(String(q.year))
                                setEditSpeciesId(String(q.w_species_id))
                                setEditReserveId(String(q.reserve_id))
                                setEditQuota(String(q.quota))
                              }}
                              className="text-sky-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await backendApi.delete(`/api/quotas/${q.quota_id}`)
                                  setItems((prev) => prev.filter((x) => x.quota_id !== q.quota_id))
                                } catch (e: any) {
                                  alert(e?.message || 'Failed to delete quota')
                                }
                              }}
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
