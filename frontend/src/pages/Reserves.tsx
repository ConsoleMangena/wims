import { useEffect, useState } from 'react'
import { backendApi } from '../lib/api'
import MapPolygonPicker from '../components/MapPolygonPicker'
import type { LatLon } from '../components/MapPicker'

type Reserve = {
  reserve_id: number
  name: string
  boundary: any
}

export default function ReservesPage() {
  const [items, setItems] = useState<Reserve[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [polyPoints, setPolyPoints] = useState<LatLon[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editPolyPoints, setEditPolyPoints] = useState<LatLon[]>([])
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    backendApi
      .get<Reserve[]>('/api/reserves')
      .then((res) => setItems(res.data))
      .catch((e) => setError(e?.message || 'Failed to load reserves'))
      .finally(() => setLoading(false))
  }, [])

  function parseBoundaryToLatLon(b: any): LatLon[] {
    try {
      if (!b) return []
      if (typeof b === 'string') {
        const pts: LatLon[] = []
        const re = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g
        let m: RegExpExecArray | null
        while ((m = re.exec(b)) !== null) {
          const lon = parseFloat(m[1])
          const lat = parseFloat(m[2])
          if (Number.isFinite(lon) && Number.isFinite(lat)) pts.push({ lat, lon })
        }
        // Remove potential duplicated closing point
        if (pts.length >= 2) {
          const a = pts[0]
          const z = pts[pts.length - 1]
          if (a.lat === z.lat && a.lon === z.lon) pts.pop()
        }
        return pts
      }
      // If boundary comes as array-like [[x,y], ...]
      if (Array.isArray(b)) {
        const pts = b
          .map((p: any) => ({ lon: Number(p?.[0]), lat: Number(p?.[1]) }))
          .filter((p: any) => Number.isFinite(p.lon) && Number.isFinite(p.lat))
          .map((p: any) => ({ lat: p.lat, lon: p.lon }))
        if (pts.length >= 2) {
          const a = pts[0]
          const z = pts[pts.length - 1]
          if (a.lat === z.lat && a.lon === z.lon) pts.pop()
        }
        return pts
      }
      return []
    } catch {
      return []
    }
  }

  function handleRowClick(r: Reserve) {
    const pts = parseBoundaryToLatLon(r.boundary)
    if (pts.length) {
      setPolyPoints(pts)
      const el = document.getElementById('reserve-map')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  function startEdit(r: Reserve) {
    setEditId(r.reserve_id)
    setEditName(r.name)
    setEditPolyPoints(parseBoundaryToLatLon(r.boundary))
    const el = document.getElementById('reserve-edit')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-800">Reserves</h2>
      <p className="text-sm text-slate-600">Create and manage game reserves with mapped boundaries. Click on the map to digitize the polygon (default view Gweru), submit to save, and click a row to preview its boundary on the map.</p>
      <section className="bg-white border rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-slate-600 mb-3">Add Reserve</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!formName.trim()) return
            if (polyPoints.length < 3) {
              setSubmitError('Please digitize at least 3 points to form a polygon')
              return
            }
            setSubmitting(true)
            setSubmitError(null)
            try {
              // Send raw points to backend; backend will validate and build polygon text, and auto-close the ring
              const pts = [...polyPoints]
              const res = await backendApi.post<Reserve>('/api/reserves', {
                name: formName.trim(),
                points: pts,
              })
              setItems((prev) => [res.data, ...prev])
              setFormName('')
              setPolyPoints([])
            } catch (e: any) {
              const serverMsg = e?.response?.data?.error
              setSubmitError(serverMsg || e?.message || 'Failed to create reserve')
            } finally {
              setSubmitting(false)
            }
          }}
          className="grid grid-cols-1 gap-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Name</label>
              <input
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                placeholder="e.g. Lake Rukwa Reserve"
              />
            </div>
            <div className="sm:col-span-2" id="reserve-map">
              <label className="block text-sm text-slate-600 mb-2">Digitize Boundary (click to add points)</label>
              <MapPolygonPicker
                value={polyPoints}
                onChange={setPolyPoints}
                height={320}
                center={{ lat: -19.457, lon: 29.816 }}
                zoom={13}
              />
              <p className="mt-2 text-xs text-slate-600">Points: {polyPoints.length} {polyPoints.length > 0 && `| First: ${polyPoints[0].lat.toFixed(5)}, ${polyPoints[0].lon.toFixed(5)}`}</p>
            </div>
            <div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? 'Adding…' : 'Add Reserve'}
              </button>
            </div>
          </div>
        </form>
        {submitError && <p className="text-sm text-red-600 mt-2">{submitError}</p>}
      </section>

      {editId !== null && (
        <section id="reserve-edit" className="bg-white border rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-slate-600 mb-3">Edit Reserve #{editId}</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!editName.trim()) return
              if (editPolyPoints.length < 3) {
                setUpdateError('Please digitize at least 3 points to form a polygon')
                return
              }
              setUpdating(true)
              setUpdateError(null)
              try {
                const res = await backendApi.put<Reserve>(`/api/reserves/${editId}` , {
                  name: editName.trim(),
                  points: editPolyPoints,
                })
                setItems((prev) => prev.map((x) => (x.reserve_id === editId ? res.data : x)))
                setEditId(null)
                setEditName('')
                setEditPolyPoints([])
              } catch (e: any) {
                const serverMsg = e?.response?.data?.error
                setUpdateError(serverMsg || e?.message || 'Failed to update reserve')
              } finally {
                setUpdating(false)
              }
            }}
            className="grid grid-cols-1 gap-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Name</label>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-600 mb-2">Adjust Boundary</label>
                <MapPolygonPicker
                  value={editPolyPoints}
                  onChange={setEditPolyPoints}
                  height={320}
                  center={{ lat: -19.457, lon: 29.816 }}
                  zoom={13}
                />
                <p className="mt-2 text-xs text-slate-600">Points: {editPolyPoints.length}</p>
              </div>
              <div className="space-x-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center gap-2 rounded bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-500 disabled:opacity-50"
                >
                  {updating ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null)
                    setEditName('')
                    setEditPolyPoints([])
                    setUpdateError(null)
                  }}
                  className="inline-flex items-center gap-2 rounded bg-slate-200 text-slate-700 px-4 py-2 hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
          {updateError && <p className="text-sm text-red-600 mt-2">{updateError}</p>}
        </section>
      )}
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
                  <th className="px-4 py-2 text-left text-slate-600 font-medium">Boundary</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((r) => (
                  <tr
                    key={r.reserve_id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleRowClick(r)}
                  >
                    <td className="px-4 py-2">{r.reserve_id}</td>
                    <td className="px-4 py-2">{r.name}</td>
                    <td className="px-4 py-2">{typeof r.boundary === 'string' ? r.boundary : JSON.stringify(r.boundary)}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); startEdit(r) }}
                        className="text-sky-600 hover:underline mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            await backendApi.delete(`/api/reserves/${r.reserve_id}`)
                            setItems((prev) => prev.filter((x) => x.reserve_id !== r.reserve_id))
                          } catch (e: any) {
                            alert(e?.message || 'Failed to delete reserve')
                          }
                        }}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
