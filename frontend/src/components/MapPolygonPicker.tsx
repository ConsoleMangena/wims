import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import type { LatLngExpression } from 'leaflet'
import type { LatLon } from './MapPicker'

export default function MapPolygonPicker({
  value,
  onChange,
  height = 320,
  center = { lat: -19.457, lon: 29.816 }, // Default: Gweru, Zimbabwe
  zoom = 13,
}: {
  value: LatLon[]
  onChange: (pts: LatLon[]) => void
  height?: number
  center?: LatLon
  zoom?: number
}) {
  const positions: LatLngExpression[] = useMemo(
    () => value.map((p) => [p.lat, p.lon] as [number, number]),
    [value]
  )

  function ClickHandler() {
    useMapEvents({
      click(e) {
        onChange([...value, { lat: e.latlng.lat, lon: e.latlng.lng }])
      },
    })
    return null
  }

  function FitOnChange({ pts }: { pts: LatLngExpression[] }) {
    const map = useMap()
    useEffect(() => {
      if (pts.length >= 3) {
        const b = L.latLngBounds(pts as [number, number][])
        map.fitBounds(b.pad(0.2))
      }
    }, [pts, map])
    return null
  }

  return (
    <div className="relative rounded border overflow-hidden" style={{ height }}>
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <FitOnChange pts={positions} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {positions.length >= 3 ? (
          <Polygon positions={positions as [number, number][]} pathOptions={{ color: '#0ea5e9', weight: 2, fillOpacity: 0.2 }} />
        ) : positions.length >= 2 ? (
          <Polyline positions={positions as [number, number][]} pathOptions={{ color: '#0ea5e9', weight: 2 }} />
        ) : null}
        {positions.map((pt, idx) => (
          <CircleMarker key={idx} center={pt as [number, number]} radius={4} pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 1 }} />
        ))}
        <ClickHandler />
      </MapContainer>

      <div className="absolute top-2 right-2 z-[1000] flex gap-2">
        <button
          type="button"
          className="bg-white/90 backdrop-blur text-slate-700 border border-slate-300 rounded px-3 py-1 shadow hover:bg-white disabled:opacity-50"
          disabled={value.length === 0}
          onClick={() => onChange(value.slice(0, -1))}
        >
          Undo
        </button>
        <button
          type="button"
          className="bg-white/90 backdrop-blur text-slate-700 border border-slate-300 rounded px-3 py-1 shadow hover:bg-white disabled:opacity-50"
          disabled={value.length === 0}
          onClick={() => onChange([])}
        >
          Clear
        </button>
      </div>
    </div>
  )
}
