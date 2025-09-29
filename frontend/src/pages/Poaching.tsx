import { useEffect, useState } from 'react'
import { backendApi } from '../lib/api'
import MapPicker, { type LatLon } from '../components/MapPicker'

type Poaching = {
  incident_id: number
  incident_date: string
  location: any
  reserve_id?: number | null
  description?: string | null
}

export default function PoachingPage() {
  const [items, setItems] = useState<Poaching[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reserves, setReserves] = useState<Array<{ reserve_id: number; name: string }>>([])
  const [formDate, setFormDate] = useState('')
  const [formReserveId, setFormReserveId] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [picked, setPicked] = useState<LatLon | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editReserveId, setEditReserveId] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editLat, setEditLat] = useState('')
  const [editLon, setEditLon] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    backendApi
      .get<Poaching[]>('/api/poaching')
      .then((res) => setItems(res.data))
      .catch((e) => setError(e?.message || 'Failed to load poaching incidents'))
      .finally(() => setLoading(false))

    backendApi
      .get<Array<{ reserve_id: number; name: string }>>('/api/reserves')
      .then((res) => setReserves(res.data))
      .catch(() => {})
  }, [])

  // Auto location tagging once on mount
  useEffect(() => {
    if (!picked && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPicked({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
  }, [picked])

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!formDate || !picked) {
      setSubmitError('Please select a date and a location')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = {
        incident_date: formDate,
        lat: picked.lat,
        lon: picked.lon,
        reserve_id: formReserveId ? Number(formReserveId) : null,
        description: formDesc || null,
      }
      const res = await backendApi.post<Poaching>('/api/poaching', payload)
      setItems((prev) => [res.data, ...prev])
      setFormDate('')
      setFormReserveId('')
      setFormDesc('')
      setPicked(null)
    } catch (e: any) {
      setSubmitError(e?.message || 'Failed to create poaching incident')
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(id: number) {
    try {
      await backendApi.delete(`/api/poaching/${id}`)
      setItems((prev) => prev.filter((i) => i.incident_id !== id))
    } catch (e: any) {
      alert(e?.message || 'Failed to delete')
    }
  }

  function parsePoint(input: any): null | { lat: number; lon: number } {
    try {
      if (!input) return null
      if (typeof input === 'string') {
        const m = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/.exec(input)
        if (!m) return null
        const lon = parseFloat(m[1]); const lat = parseFloat(m[2])
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
        return { lat, lon }
      }
      if (Array.isArray(input) && input.length === 2) {
        const lon = Number(input[0]); const lat = Number(input[1])
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
        return { lat, lon }
      }
      if (typeof input === 'object') {
        const obj = input as any
        const nlon = typeof obj.lon === 'string' ? parseFloat(obj.lon) : obj.lon
        const nlat = typeof obj.lat === 'string' ? parseFloat(obj.lat) : obj.lat
        const nx = typeof obj.x === 'string' ? parseFloat(obj.x) : obj.x
        const ny = typeof obj.y === 'string' ? parseFloat(obj.y) : obj.y
        if (Number.isFinite(nlon) && Number.isFinite(nlat)) return { lat: nlat, lon: nlon }
        if (Number.isFinite(nx) && Number.isFinite(ny)) return { lat: ny, lon: nx }
      }
      return null
    } catch {
      return null
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-800">Poaching Incidents</h2>
      <p className="text-sm text-slate-600">Log and manage poaching incidents. Select a date, optionally link a reserve, and pick a location on the map around Gweru. Use the table below to review and delete incidents.</p>

      <section className="bg-white border rounded-lg shadow p-4 space-y-3">
        <h3 className="text-sm font-medium text-slate-600">Add Incident</h3>
        <form onSubmit={onAdd} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Date</label>
              <input
                type="date"
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Reserve (optional)</label>
              <select
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
                value={formReserveId}
                onChange={(e) => setFormReserveId(e.target.value)}
              >
                <option value="">— None —</option>
                {reserves.map((r) => (
                  <option key={r.reserve_id} value={r.reserve_id}>{r.name} (#{r.reserve_id})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Description (optional)</label>
              <textarea
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
                rows={3}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? 'Adding…' : 'Add Incident'}
              </button>
              {submitError && <p className="text-sm text-red-600 mt-2">{submitError}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-2">Click on the map to set location</label>
            <MapPicker
              value={picked}
              onChange={setPicked}
              height={280}
              center={{ lat: -19.457, lon: 29.816 }}
              zoom={12}
            />
            {picked && (
              <p className="mt-2 text-sm text-slate-600">Selected: lat {picked.lat.toFixed(5)}, lon {picked.lon.toFixed(5)}</p>
            )}
          </div>
        </form>
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
                  <th className="px-4 py-2 text-left text-slate-600 font-medium border border-slate-200">Date</th>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium border border-slate-200">Reserve ID</th>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium border border-slate-200">Location</th>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium border border-slate-200">Description</th>
                  <th className="px-4 py-2 border border-slate-200" />
                </tr>
              </thead>
              <tbody>
                {items.map((i) => {
                  const isEditing = editId === i.incident_id
                  return (
                    <tr key={i.incident_id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 border border-slate-200">{i.incident_id}</td>
                      <td className="px-4 py-2 border border-slate-200">
                        {isEditing ? (
                          <input
                            type="date"
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                          />
                        ) : (
                          i.incident_date
                        )}
                      </td>
                      <td className="px-4 py-2 border border-slate-200">
                        {isEditing ? (
                          <select
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            value={editReserveId}
                            onChange={(e) => setEditReserveId(e.target.value)}
                          >
                            <option value="">— None —</option>
                            {reserves.map((r) => (
                              <option key={r.reserve_id} value={r.reserve_id}>{r.name} (#{r.reserve_id})</option>
                            ))}
                          </select>
                        ) : (
                          i.reserve_id ?? '—'
                        )}
                      </td>
                      <td className="px-4 py-2 border border-slate-200">
                        {isEditing ? (
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              className="w-full rounded border border-slate-300 px-2 py-1"
                              value={editLat}
                              onChange={(e) => setEditLat(e.target.value)}
                              placeholder="lat"
                            />
                            <input
                              type="number"
                              className="w-full rounded border border-slate-300 px-2 py-1"
                              value={editLon}
                              onChange={(e) => setEditLon(e.target.value)}
                              placeholder="lon"
                            />
                          </div>
                        ) : (
                          typeof i.location === 'string' ? i.location : JSON.stringify(i.location)
                        )}
                      </td>
                      <td className="px-4 py-2 border border-slate-200">
                        {isEditing ? (
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Description (optional)"
                          />
                        ) : (
                          i.description ?? '—'
                        )}
                      </td>
                      <td className="px-4 py-2 border border-slate-200 text-right space-x-3">
                        {isEditing ? (
                          <>
                            <button
                              onClick={async () => {
                                if (!editDate || editLat.trim() === '' || editLon.trim() === '') {
                                  setUpdateError('Date, lat and lon are required')
                                  return
                                }
                                const latNum = Number(editLat); const lonNum = Number(editLon)
                                if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
                                  setUpdateError('lat/lon must be numbers')
                                  return
                                }
                                setUpdating(true)
                                setUpdateError(null)
                                try {
                                  const res = await backendApi.put(`/api/poaching/${i.incident_id}`, {
                                    incident_date: editDate,
                                    lat: latNum,
                                    lon: lonNum,
                                    reserve_id: editReserveId ? Number(editReserveId) : null,
                                    description: editDesc || null,
                                  })
                                  setItems((prev) => prev.map((x) => (x.incident_id === i.incident_id ? res.data : x)))
                                  setEditId(null)
                                  setEditDate('')
                                  setEditReserveId('')
                                  setEditDesc('')
                                  setEditLat('')
                                  setEditLon('')
                                } catch (e: any) {
                                  setUpdateError(e?.message || 'Failed to update')
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
                                setEditDate('')
                                setEditReserveId('')
                                setEditDesc('')
                                setEditLat('')
                                setEditLon('')
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
                                setEditId(i.incident_id)
                                setEditDate(i.incident_date)
                                setEditReserveId(i.reserve_id ? String(i.reserve_id) : '')
                                setEditDesc(i.description ?? '')
                                const p = parsePoint(i.location)
                                setEditLat(p ? String(p.lat) : '')
                                setEditLon(p ? String(p.lon) : '')
                              }}
                              className="text-sky-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDelete(i.incident_id)}
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
