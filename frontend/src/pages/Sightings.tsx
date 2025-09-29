import { useEffect, useState } from 'react'
import { backendApi } from '../lib/api'
import MapPicker, { type LatLon } from '../components/MapPicker'

type Sighting = {
  sighting_id: number
  w_species_id: number
  sighting_date: string
  location: any
  notes?: string | null
}

export default function SightingsPage() {
  const [items, setItems] = useState<Sighting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [speciesList, setSpeciesList] = useState<Array<{ w_species_id: number; name: string }>>([])
  const [formSpeciesId, setFormSpeciesId] = useState<string>('')
  const [formDate, setFormDate] = useState<string>('')
  const [formNotes, setFormNotes] = useState<string>('')
  const [picked, setPicked] = useState<LatLon | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editSpeciesId, setEditSpeciesId] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editLat, setEditLat] = useState<string>('')
  const [editLon, setEditLon] = useState<string>('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    backendApi
      .get<Sighting[]>('/api/sightings')
      .then((res) => setItems(res.data))
      .catch((e) => setError(e?.message || 'Failed to load sightings'))
      .finally(() => setLoading(false))

    backendApi
      .get<Array<{ w_species_id: number; name: string }>>('/api/species')
      .then((res) => setSpeciesList(res.data))
      .catch(() => {})
  }, [])

  // Auto location tagging using device geolocation (once on mount if not picked)
  useEffect(() => {
    if (!picked && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = { lat: pos.coords.latitude, lon: pos.coords.longitude }
          setPicked(p)
        },
        () => {
          // ignore errors silently; user can use the map or the button in MapPicker
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
  }, [picked])

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

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!formSpeciesId || !formDate || !picked) {
      setSubmitError('Please select species, date, and a location on the map')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        w_species_id: Number(formSpeciesId),
        sighting_date: formDate,
        lat: picked.lat,
        lon: picked.lon,
        notes: formNotes || null,
      }
      const res = await backendApi.post<Sighting>('/api/sightings', payload)
      setItems((prev) => [res.data, ...prev])
      // reset form
      setFormSpeciesId('')
      setFormDate('')
      setFormNotes('')
      setPicked(null)
    } catch (e: any) {
      setSubmitError(e?.message || 'Failed to create sighting')
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(id: number) {
    try {
      await backendApi.delete(`/api/sightings/${id}`)
      setItems((prev) => prev.filter((r) => r.sighting_id !== id))
    } catch (e: any) {
      alert(e?.message || 'Failed to delete sighting')
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-800">Sightings</h2>
      <p className="text-sm text-slate-600">Record wildlife sightings with a date, species, and location. Click the map to pick coordinates around Gweru (or use device location), then submit the form. Manage existing entries below.</p>

      <section className="bg-white border rounded-lg shadow p-4 space-y-3">
        <h3 className="text-sm font-medium text-slate-600">Add Sighting</h3>
        <form onSubmit={onAdd} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Species</label>
              <select
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
                value={formSpeciesId}
                onChange={(e) => setFormSpeciesId(e.target.value)}
                required
              >
                <option value="" disabled>Select a species…</option>
                {speciesList.map((s) => (
                  <option key={s.w_species_id} value={s.w_species_id}>{s.name} (#{s.w_species_id})</option>
                ))}
              </select>
            </div>
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
              <label className="block text-sm text-slate-600 mb-1">Notes (optional)</label>
              <textarea
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? 'Adding…' : 'Add Sighting'}
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
            <table className="min-w-full table-auto divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium">ID</th>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium">Species ID</th>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium">Date</th>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium">Location</th>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium">Notes</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((r) => {
                  const isEditing = editId === r.sighting_id
                  return (
                    <tr key={r.sighting_id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">{r.sighting_id}</td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <select
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            value={editSpeciesId}
                            onChange={(e) => setEditSpeciesId(e.target.value)}
                          >
                            <option value="" disabled>Select species…</option>
                            {speciesList.map((s) => (
                              <option key={s.w_species_id} value={s.w_species_id}>{s.name} (#{s.w_species_id})</option>
                            ))}
                          </select>
                        ) : (
                          r.w_species_id
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <input
                            type="date"
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                          />
                        ) : (
                          r.sighting_date
                        )}
                      </td>
                      <td className="px-4 py-2">
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
                          typeof r.location === 'string' ? r.location : JSON.stringify(r.location)
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Notes (optional)"
                          />
                        ) : (
                          r.notes ?? '—'
                        )}
                      </td>
                      <td className="px-4 py-2 text-right space-x-3">
                        {isEditing ? (
                          <>
                            <button
                              onClick={async () => {
                                if (!editSpeciesId || !editDate || editLat.trim() === '' || editLon.trim() === '') {
                                  setUpdateError('Species, date, lat, lon are required')
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
                                  const res = await backendApi.put(`/api/sightings/${r.sighting_id}`, {
                                    w_species_id: Number(editSpeciesId),
                                    sighting_date: editDate,
                                    lat: latNum,
                                    lon: lonNum,
                                    notes: editNotes || null,
                                  })
                                  setItems((prev) => prev.map((x) => (x.sighting_id === r.sighting_id ? res.data : x)))
                                  setEditId(null)
                                  setEditSpeciesId('')
                                  setEditDate('')
                                  setEditNotes('')
                                  setEditLat('')
                                  setEditLon('')
                                } catch (e: any) {
                                  setUpdateError(e?.message || 'Failed to update sighting')
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
                                setEditSpeciesId('')
                                setEditDate('')
                                setEditNotes('')
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
                                setEditId(r.sighting_id)
                                setEditSpeciesId(String(r.w_species_id))
                                setEditDate(r.sighting_date)
                                setEditNotes(r.notes ?? '')
                                const p = parsePoint(r.location)
                                setEditLat(p ? String(p.lat) : '')
                                setEditLon(p ? String(p.lon) : '')
                              }}
                              className="text-sky-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDelete(r.sighting_id)}
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
