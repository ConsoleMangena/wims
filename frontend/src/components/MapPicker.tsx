import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import type { LeafletMouseEvent, Map as LeafletMap } from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Fix default marker icons for Vite bundling
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(L.Icon.Default as any).mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// Custom DivIcon for a modern circular marker (green)
const customIcon = L.divIcon({
  className: 'wims-custom-marker',
  html:
    '<div style="width:22px;height:22px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 1px 2px rgba(0,0,0,0.35)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

export type LatLon = { lat: number; lon: number }

function ClickHandler({ onPick }: { onPick: (p: LatLon) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onPick({ lat: e.latlng.lat, lon: e.latlng.lng })
    },
  })
  return null
}

function MapReady({ onReady }: { onReady: (m: LeafletMap) => void }) {
  const map = useMap()
  useEffect(() => {
    onReady(map)
  }, [map, onReady])
  return null
}

export default function MapPicker({
  value,
  onChange,
  height = 300,
  center = { lat: -6.163, lon: 29.623 }, // Lake Rukwa vicinity (approx)
  zoom = 6,
}: {
  value: LatLon | null
  onChange: (p: LatLon) => void
  height?: number
  center?: LatLon
  zoom?: number
}) {
  const [picked, setPicked] = useState<LatLon | null>(value ?? null)
  const [map, setMap] = useState<LeafletMap | null>(null)

  useEffect(() => {
    setPicked(value ?? null)
  }, [value])

  return (
    <div className="relative rounded border overflow-hidden" style={{ height }}>
      <MapContainer
        center={[picked?.lat ?? center.lat, picked?.lon ?? center.lon]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <MapReady onReady={(m) => setMap(m)} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {picked && <Marker position={[picked.lat, picked.lon]} icon={customIcon} />}
        <ClickHandler
          onPick={(p) => {
            setPicked(p)
            onChange(p)
          }}
        />
      </MapContainer>
      <button
        type="button"
        className="absolute top-2 right-2 z-[1000] bg-white/90 backdrop-blur text-slate-700 border border-slate-300 rounded px-3 py-1 shadow hover:bg-white"
        onClick={() => {
          if (!('geolocation' in navigator)) {
            alert('Geolocation is not supported by your browser')
            return
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const p = { lat: pos.coords.latitude, lon: pos.coords.longitude }
              setPicked(p)
              onChange(p)
              if (map) map.setView([p.lat, p.lon], Math.max(map.getZoom(), 14))
            },
            (err) => {
              console.error('Geolocation error', err)
              alert('Could not get your location. Please allow location access.')
            },
            { enableHighAccuracy: true, timeout: 10000 }
          )
        }}
      >
        Use my location
      </button>
    </div>
  )
}
