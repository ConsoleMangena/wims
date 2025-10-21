import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, FeatureGroup, Polygon } from 'react-leaflet'
import { EditControl } from 'react-leaflet-draw'
import L, { LatLngExpression, LatLngLiteral } from 'leaflet'

export type LonLat = { lon: number; lat: number }

function parseBoundaryString(boundary?: string): LonLat[] {
  if (!boundary) return []
  const str = boundary.trim()
  // Support WKT: POLYGON((x y, x y, ...)) or raw: ((x,y),(x,y),...)
  const wktMatch = str.match(/polygon\s*\(\((.*)\)\)/i)
  const inner = wktMatch ? wktMatch[1] : str.replace(/^\(+|\)+$/g, '')
  if (!inner) return []
  const pts: LonLat[] = []
  for (const pair of inner.split('),').map((p) => p.replace(/[()]/g, ''))) {
    const parts = pair.split(/\s+|,/).filter(Boolean)
    const x = Number(parts[0])
    const y = Number(parts[1])
    if (Number.isFinite(x) && Number.isFinite(y)) pts.push({ lon: x, lat: y })
  }
  return pts
}

function toLatLngs(points: LonLat[]): LatLngExpression[] {
  return points.map((p) => ({ lat: p.lat, lng: p.lon }) as LatLngLiteral)
}

export default function MapPolygonDraw({
  value,
  onChangePoints,
  height = 360,
  center = { lat: -8.5, lng: 33.0 },
  zoom = 7,
}: {
  value?: { boundary?: string; points?: LonLat[] }
  onChangePoints: (pts: LonLat[]) => void
  height?: number
  center?: LatLngLiteral
  zoom?: number
}) {
  const fgRef = useRef<L.FeatureGroup | null>(null)

  const initialPoints: LonLat[] = useMemo(() => {
    if (value?.points && value.points.length) return value.points
    if (value?.boundary) return parseBoundaryString(value.boundary)
    return []
  }, [value?.boundary, value?.points])

  const initialLatLngs = useMemo(() => toLatLngs(initialPoints), [initialPoints])

  useEffect(() => {
    // If we have initial polygon, ensure it's rendered in FeatureGroup
    if (fgRef.current && initialLatLngs.length) {
      // Avoid duplicating layers on re-render
      const existing = fgRef.current.getLayers()
      if (existing.length === 0) {
        const poly = L.polygon(initialLatLngs as any)
        fgRef.current.addLayer(poly)
      }
    }
  }, [initialLatLngs])

  const handleCreated = (e: any) => {
    const layer = e.layer as L.Polygon
    const latlngs = (layer.getLatLngs?.()[0] || []) as LatLngLiteral[]
    const pts: LonLat[] = latlngs.map((ll) => ({ lon: ll.lng, lat: ll.lat }))
    if (pts.length >= 3) {
      // Ensure closed polygon for backend convenience
      const first = pts[0]
      const last = pts[pts.length - 1]
      if (first.lat !== last.lat || first.lon !== last.lon) pts.push(first)
      onChangePoints(pts)
    }
  }

  const handleEdited = (e: any) => {
    const layers = e.layers as L.FeatureGroup
    layers.eachLayer((layer: any) => {
      if (layer instanceof L.Polygon) {
        const latlngs = (layer.getLatLngs?.()[0] || []) as LatLngLiteral[]
        const pts: LonLat[] = latlngs.map((ll) => ({ lon: ll.lng, lat: ll.lat }))
        if (pts.length >= 3) {
          const first = pts[0]
          const last = pts[pts.length - 1]
          if (first.lat !== last.lat || first.lon !== last.lon) pts.push(first)
          onChangePoints(pts)
        }
      }
    })
  }

  const handleDeleted = () => {
    onChangePoints([])
  }

  return (
    <div className="w-full" style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FeatureGroup ref={fgRef as any}>
          <EditControl
            position="topright"
            onCreated={handleCreated}
            onEdited={handleEdited}
            onDeleted={handleDeleted}
            draw={{
              polygon: { allowIntersection: false, showArea: true },
              polyline: false,
              rectangle: false,
              circle: false,
              circlemarker: false,
              marker: false,
            }}
          />
          {initialLatLngs.length ? <Polygon positions={initialLatLngs as any} /> : null}
        </FeatureGroup>
      </MapContainer>
    </div>
  )
}
