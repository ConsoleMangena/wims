import { MapContainer, TileLayer, Polygon, CircleMarker, FeatureGroup, useMap } from 'react-leaflet'
import L, { LatLngExpression, LatLngLiteral } from 'leaflet'
import { useEffect, useMemo } from 'react'

export type LonLat = { lon: number; lat: number }

function parseWktPolygon(wkt?: string): LatLngLiteral[] {
  if (!wkt) return []
  const m = wkt.trim().match(/polygon\s*\(\((.*)\)\)/i)
  const inner = m ? m[1] : ''
  if (!inner) return []
  const parts = inner.split(',')
  const coords: LatLngLiteral[] = []
  for (const p of parts) {
    const [x, y] = p.trim().split(/\s+/)
    const lon = Number(x)
    const lat = Number(y)
    if (Number.isFinite(lon) && Number.isFinite(lat)) coords.push({ lat, lng: lon })
  }
  return coords
}

function parsePointString(pt: any): LatLngLiteral | null {
  if (!pt) return null
  if (typeof pt === 'string') {
    // Expect "(x,y)"
    const m = pt.match(/\(\s*([\-0-9\.]+)\s*,\s*([\-0-9\.]+)\s*\)/)
    if (m) {
      const lon = Number(m[1]); const lat = Number(m[2])
      if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lng: lon }
    }
  } else if (typeof pt === 'object') {
    // Could be {x,y} or {lon,lat}
    const lon = Number((pt.lng ?? pt.lon ?? pt.x))
    const lat = Number((pt.lat ?? pt.y))
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lng: lon }
  }
  return null
}

function FitAll({ points, polygons }: { points: LatLngLiteral[]; polygons: LatLngLiteral[][] }) {
  const map = useMap()
  const bounds = useMemo(() => {
    const latlngs: LatLngExpression[] = []
    for (const p of points) latlngs.push([p.lat, p.lng])
    for (const poly of polygons) for (const v of poly) latlngs.push([v.lat, v.lng])
    if (latlngs.length === 0) return null
    return L.latLngBounds(latlngs as any)
  }, [points, polygons])
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [16, 16] })
  }, [bounds, map])
  return null
}

export default function MapOverview({
  sightings,
  incidents,
  reserves,
  height = 360,
}: {
  sightings: any[]
  incidents: any[]
  reserves: any[]
  height?: number
}) {
  const sightPts: LatLngLiteral[] = useMemo(() => {
    return sightings.map((s) => parsePointString(s.location)).filter(Boolean) as LatLngLiteral[]
  }, [sightings])
  const incPts: LatLngLiteral[] = useMemo(() => {
    return incidents.map((i) => parsePointString(i.location)).filter(Boolean) as LatLngLiteral[]
  }, [incidents])
  const polys: LatLngLiteral[][] = useMemo(() => {
    return reserves.map((r) => parseWktPolygon(r.boundary)).filter((arr) => arr.length >= 3)
  }, [reserves])

  const allPts = useMemo(() => [...sightPts, ...incPts], [sightPts, incPts])

  return (
    <div className="w-full" style={{ height }}>
      <MapContainer center={{ lat: -8.5, lng: 33 }} zoom={7} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FeatureGroup>
          {polys.map((poly, idx) => (
            <Polygon key={`poly-${idx}`} positions={poly as any} pathOptions={{ color: '#16a34a', weight: 2, fillOpacity: 0.15 }} />
          ))}
          {sightPts.map((p, idx) => (
            <CircleMarker key={`s-${idx}`} center={[p.lat, p.lng]} radius={5} pathOptions={{ color: '#2563eb', fillOpacity: 0.9 }} />
          ))}
          {incPts.map((p, idx) => (
            <CircleMarker key={`i-${idx}`} center={[p.lat, p.lng]} radius={5} pathOptions={{ color: '#dc2626', fillOpacity: 0.9 }} />
          ))}
        </FeatureGroup>
        <FitAll points={allPts} polygons={polys} />
      </MapContainer>
    </div>
  )
}
