import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet'
import { useState } from 'react'

export default function MapPointPicker({
  lat,
  lon,
  onChange,
  height = 260,
  center = { lat: -8.5, lng: 33.0 },
  zoom = 7,
}: {
  lat?: number
  lon?: number
  onChange: (lat: number, lon: number) => void
  height?: number
  center?: { lat: number; lng: number }
  zoom?: number
}) {
  const [pos, setPos] = useState<{ lat: number; lon: number } | null>(
    typeof lat === 'number' && typeof lon === 'number' ? { lat, lon } : null,
  )

  function ClickCatcher() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng
        setPos({ lat, lon: lng })
        onChange(lat, lng)
      },
    })
    return null
  }

  return (
    <div className="w-full" style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickCatcher />
        {pos ? <CircleMarker center={[pos.lat, pos.lon]} radius={6} pathOptions={{ color: '#465fff' }} /> : null}
      </MapContainer>
    </div>
  )
}
