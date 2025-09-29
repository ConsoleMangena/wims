import { useEffect, useMemo, useState } from 'react'
import { backendApi } from '../lib/api'
import { MapContainer, TileLayer, Polygon, CircleMarker, LayersControl, LayerGroup, useMap, Popup } from 'react-leaflet'
import L from 'leaflet'

export default function Home() {
  const [now, setNow] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  type Stats = {
    species: number
    sightings: number
    reserves: number
    hunters: number
    licences: number
    poaching: number
    quotas: number
  }
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Data for combined map
  type Reserve = { reserve_id: number; name: string; boundary: any }
  type Sighting = { sighting_id: number; w_species_id: number; sighting_date: string; location: any; notes?: string | null }
  type Poaching = { incident_id: number; incident_date: string; location: any; reserve_id?: number | null; description?: string | null }
  type Species = { w_species_id: number; name: string }

  const [reserves, setReserves] = useState<Reserve[]>([])
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [poaching, setPoaching] = useState<Poaching[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [species, setSpecies] = useState<Species[]>([])

  function parsePoint(input: any): null | { lat: number; lon: number } {
    try {
      if (!input) return null
      if (typeof input === 'string') {
        // format: (x,y) where x=lon, y=lat
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
        // Support pg types or custom serializers
        const obj = input as any
        let lon: number | undefined
        let lat: number | undefined
        const nx = typeof obj.x === 'string' ? parseFloat(obj.x) : obj.x
        const ny = typeof obj.y === 'string' ? parseFloat(obj.y) : obj.y
        const nlon = typeof obj.lon === 'string' ? parseFloat(obj.lon) : obj.lon
        const nlat = typeof obj.lat === 'string' ? parseFloat(obj.lat) : obj.lat
        const nLongitude = typeof obj.longitude === 'string' ? parseFloat(obj.longitude) : obj.longitude
        const nLatitude = typeof obj.latitude === 'string' ? parseFloat(obj.latitude) : obj.latitude
        if (typeof nx === 'number' && typeof ny === 'number' && Number.isFinite(nx) && Number.isFinite(ny)) { lon = nx; lat = ny }
        if (typeof nlon === 'number' && typeof nlat === 'number' && Number.isFinite(nlon) && Number.isFinite(nlat)) { lon = nlon; lat = nlat }
        if (typeof nLongitude === 'number' && typeof nLatitude === 'number' && Number.isFinite(nLongitude) && Number.isFinite(nLatitude)) { lon = nLongitude; lat = nLatitude }
        if (Number.isFinite(lon as number) && Number.isFinite(lat as number)) {
          return { lat: lat as number, lon: lon as number }
        }
      }
      return null
    } catch {
      return null
    }
  }

  function parsePolygon(input: any): Array<{ lat: number; lon: number }> {
    try {
      if (!input) return []
      if (typeof input === 'string') {
        const pts: Array<{ lat: number; lon: number }> = []
        const re = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g
        let m: RegExpExecArray | null
        while ((m = re.exec(input)) !== null) {
          const lon = parseFloat(m[1]); const lat = parseFloat(m[2])
          if (Number.isFinite(lon) && Number.isFinite(lat)) pts.push({ lat, lon })
        }
        // Drop duplicate closing point if present
        if (pts.length >= 2) {
          const a = pts[0]; const z = pts[pts.length - 1]
          if (a.lat === z.lat && a.lon === z.lon) pts.pop()
        }
        return pts
      }
      if (Array.isArray(input)) {
        const pts = input
          .map((p: any) => ({ lon: Number(p?.[0]), lat: Number(p?.[1]) }))
          .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat))
          .map((p) => ({ lat: p.lat, lon: p.lon }))
        if (pts.length >= 2) {
          const a = pts[0]; const z = pts[pts.length - 1]
          if (a.lat === z.lat && a.lon === z.lon) pts.pop()
        }
        return pts
      }
      return []
    } catch {
      return []
    }
  }

  useEffect(() => {
    backendApi
      .get('/api/db/ping')
      .then((res) => setNow(res.data.now))
      .catch((e) => setError(e?.message || 'Failed to ping DB'))

    backendApi
      .get<Stats>('/api/stats')
      .then((res) => setStats(res.data))
      .catch((e) => setStatsError(e?.message || 'Failed to load stats'))

    // Load map data in parallel
    Promise.allSettled([
      backendApi.get<Reserve[]>('/api/reserves'),
      backendApi.get<Sighting[]>('/api/sightings'),
      backendApi.get<Poaching[]>('/api/poaching'),
      backendApi.get<Species[]>('/api/species'),
    ]).then((results) => {
      const [r, s, p, sp] = results
      if (r.status === 'fulfilled') setReserves(r.value.data)
      if (s.status === 'fulfilled') setSightings(s.value.data)
      if (p.status === 'fulfilled') setPoaching(p.value.data)
      if (sp.status === 'fulfilled') setSpecies(sp.value.data)
      if (r.status === 'rejected' || s.status === 'rejected' || p.status === 'rejected' || sp.status === 'rejected') {
        setMapError('Some map layers failed to load. Try again or check the backend logs.')
      }
    })
  }, [])

  // Build Leaflet layers data including original records for popups
  const reserveGeoms = useMemo(
    () => reserves.map((r) => ({ r, poly: parsePolygon(r.boundary).map((pt) => [pt.lat, pt.lon] as [number, number]) })),
    [reserves]
  )
  const sightingsWithPoint = useMemo(
    () =>
      (sightings
        .map((s) => {
          const p = parsePoint(s.location)
          return p ? { s, p } : null
        })
        .filter(Boolean) as Array<{ s: Sighting; p: { lat: number; lon: number } }>),
    [sightings]
  )
  const poachingWithPoint = useMemo(
    () =>
      (poaching
        .map((x) => {
          const p = parsePoint(x.location)
          return p ? { x, p } : null
        })
        .filter(Boolean) as Array<{ x: Poaching; p: { lat: number; lon: number } }>),
    [poaching]
  )

  const speciesMap = useMemo(() => new Map(species.map((s) => [s.w_species_id, s.name])), [species])

  // Compute bounds across everything
  function FitAll() {
    const map = useMap()
    useEffect(() => {
      const latlngs: L.LatLngExpression[] = []
      reserveGeoms.forEach((g) => g.poly.forEach((pt) => latlngs.push(pt)))
      sightingsWithPoint.forEach(({ p }) => latlngs.push([p.lat, p.lon]))
      poachingWithPoint.forEach(({ p }) => latlngs.push([p.lat, p.lon]))
      if (latlngs.length > 0) {
        const b = L.latLngBounds(latlngs as [number, number] [])
        map.fitBounds(b.pad(0.2))
      } else {
        // Default to Gweru, Zimbabwe
        map.setView([-19.457, 29.816], 12)
      }
    }, [map, reserveGeoms, sightingsWithPoint, poachingWithPoint])
    return null
  }

  // Export to GeoJSON
  function exportGeoJSON() {
    const features: any[] = []
    // Reserves as Polygons
    reserves.forEach((r) => {
      const pts = parsePolygon(r.boundary)
      if (pts.length >= 3) {
        const ring = pts.map((p) => [p.lon, p.lat])
        // ensure closed
        if (ring.length && (ring[0][0] !== ring[ring.length-1][0] || ring[0][1] !== ring[ring.length-1][1])) ring.push(ring[0])
        features.push({
          type: 'Feature',
          properties: { layer: 'reserve', reserve_id: r.reserve_id, name: r.name },
          geometry: { type: 'Polygon', coordinates: [ring] },
        })
      }
    })
    // Sightings as Points
    sightings.forEach((s) => {
      const p = parsePoint(s.location)
      if (p) features.push({ type: 'Feature', properties: { layer: 'sighting', sighting_id: s.sighting_id, species_id: s.w_species_id, date: s.sighting_date, notes: s.notes }, geometry: { type: 'Point', coordinates: [p.lon, p.lat] } })
    })
    // Poaching as Points
    poaching.forEach((x) => {
      const p = parsePoint(x.location)
      if (p) features.push({ type: 'Feature', properties: { layer: 'poaching', incident_id: x.incident_id, date: x.incident_date, reserve_id: x.reserve_id, description: x.description }, geometry: { type: 'Point', coordinates: [p.lon, p.lat] } })
    })
    const fc = { type: 'FeatureCollection', features }
    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/geo+json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wims-data.geojson'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-800">Wildlife Management Information System</h1>
        <p className="text-slate-600 mt-1">Monitor wildlife populations, manage hunting licenses, support anti-poaching, and analyze spatial data.</p>
      </div>

      <section>
        <h3 className="text-sm font-medium text-slate-500 mb-2">Backend DB Status</h3>
        <div className="bg-white border rounded-lg shadow p-4 text-sm">
          {now && <p>DB reachable. Server time: {new Date(now).toLocaleString()}</p>}
          {error && <p className="text-red-600">Error: {error}</p>}
          {!now && !error && <p>Checking database connectivity…</p>}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-slate-500 mb-2">Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[{
            key: 'species', label: 'Species'
          }, { key: 'sightings', label: 'Sightings' }, { key: 'reserves', label: 'Reserves' }, { key: 'hunters', label: 'Hunters' }, { key: 'licences', label: 'Licences' }, { key: 'poaching', label: 'Poaching Incidents' }, { key: 'quotas', label: 'Quotas' }].map((tile) => (
            <div key={tile.key} className="bg-white border rounded-lg shadow p-4">
              <div className="text-slate-500 text-sm">{tile.label}</div>
              <div className="mt-1 text-3xl font-semibold text-slate-800">
                {stats ? (stats as any)[tile.key] : '—'}
              </div>
            </div>
          ))}
        </div>
        {statsError && <p className="text-sm text-red-600 mt-2">{statsError}</p>}
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-500">Combined Map</h3>
          <button
            type="button"
            onClick={exportGeoJSON}
            className="inline-flex items-center gap-2 rounded bg-slate-900 text-white px-3 py-1.5 text-sm hover:bg-slate-800"
          >
            Export GeoJSON
          </button>
        </div>
        <div className="bg-white border rounded-lg shadow">
          {mapError && <p className="text-sm text-red-600 p-3">{mapError}</p>}
          <div style={{ height: 420 }}>
            <MapContainer center={[-19.457, 29.816]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <FitAll />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LayersControl position="topright">
                <LayersControl.Overlay checked name="Reserves">
                  <LayerGroup>
                    {reserveGeoms.map((g, idx) => (
                      <Polygon key={`res-${idx}`} positions={g.poly} pathOptions={{ color: '#0ea5e9', weight: 2, fillOpacity: 0.15 }}>
                        <Popup>
                          <div className="text-sm">
                            <div className="font-medium">Reserve: {g.r.name}</div>
                            <div>ID: {g.r.reserve_id}</div>
                            <div>Vertices: {g.poly.length}</div>
                          </div>
                        </Popup>
                      </Polygon>
                    ))}
                  </LayerGroup>
                </LayersControl.Overlay>

                <LayersControl.Overlay checked name="Sightings">
                  <LayerGroup>
                    {sightingsWithPoint.map(({ s, p }, idx) => (
                      <CircleMarker key={`sig-${idx}`} center={[p.lat, p.lon]} radius={5} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 }}>
                        <Popup>
                          <div className="text-sm">
                            <div className="font-medium">Sighting #{s.sighting_id}</div>
                            <div>Species: {speciesMap.get(s.w_species_id) ?? `#${s.w_species_id}`}</div>
                            <div>Date: {s.sighting_date}</div>
                            <div>Notes: {s.notes ?? '—'}</div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </LayerGroup>
                </LayersControl.Overlay>

                <LayersControl.Overlay checked name="Poaching">
                  <LayerGroup>
                    {poachingWithPoint.map(({ x, p }, idx) => (
                      <CircleMarker key={`poi-${idx}`} center={[p.lat, p.lon]} radius={5} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1 }}>
                        <Popup>
                          <div className="text-sm">
                            <div className="font-medium">Poaching #{x.incident_id}</div>
                            <div>Date: {x.incident_date}</div>
                            <div>Reserve ID: {x.reserve_id ?? '—'}</div>
                            <div>Description: {x.description ?? '—'}</div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </LayerGroup>
                </LayersControl.Overlay>
              </LayersControl>
            </MapContainer>
          </div>
        </div>
      </section>
    </div>
  )
}
