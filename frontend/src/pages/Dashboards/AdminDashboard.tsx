import { useEffect, useState, type ReactNode } from 'react'
import { apiEndpoints } from '../../lib/api'
import PageMeta from '../../components/common/PageMeta'
import { FaPaw, FaEye, FaMap, FaUser, FaFileAlt, FaExclamationTriangle, FaChartBar } from 'react-icons/fa'
import MapOverview from '../../components/map/MapOverview'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [species, setSpecies] = useState<any[]>([])
  const [sightings, setSightings] = useState<any[]>([])
  const [reserves, setReserves] = useState<any[]>([])
  const [hunters, setHunters] = useState<any[]>([])
  const [licenses, setLicenses] = useState<any[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, speciesRes, sightingsRes, reservesRes, huntersRes, licensesRes, incidentsRes] = await Promise.all([
          apiEndpoints.stats.getDashboard(),
          apiEndpoints.species.list(),
          apiEndpoints.sightings.list(),
          apiEndpoints.reserves.list(),
          apiEndpoints.hunters.list(),
          apiEndpoints.licenses.list(),
          apiEndpoints.poaching.list(),
        ])
        setStats(statsRes.data)
        setSpecies(speciesRes.data.slice(0, 5))
        setSightings(sightingsRes.data.slice(0, 5))
        setReserves(reservesRes.data.slice(0, 5))
        setHunters(huntersRes.data.slice(0, 5))
        setLicenses(licensesRes.data.slice(0, 5))
        setIncidents(incidentsRes.data.slice(0, 5))
      } catch (err) {
        setStats({ species: 0, sightings: 0, reserves: 0, hunters: 0, licences: 0, poaching: 0, quotas: 0 })
        setError('Failed to fetch overview data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading admin dashboard...</p>
      </div>
    )
  }

  return (
    <>
      <PageMeta title="Admin Dashboard" />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600">System Overview and Management</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Species" value={stats.species} icon={<FaPaw size={28} />} />
            <StatCard title="Sightings" value={stats.sightings} icon={<FaEye size={28} />} />
            <StatCard title="Reserves" value={stats.reserves} icon={<FaMap size={28} />} />
            <StatCard title="Hunters" value={stats.hunters} icon={<FaUser size={28} />} />
            <StatCard title="Licenses" value={stats.licences} icon={<FaFileAlt size={28} />} />
            <StatCard title="Poaching Incidents" value={stats.poaching} icon={<FaExclamationTriangle size={28} />} />
            <StatCard title="Quotas" value={stats.quotas} icon={<FaChartBar size={28} />} />
          </div>
        )}

        {/* Spatial Overview Map */}
        <div className="bg-white p-4 rounded-lg shadow mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Spatial Overview</h2>
          <MapOverview sightings={sightings} incidents={incidents} reserves={reserves} height={360} />
          <div className="flex gap-4 text-xs mt-2 text-gray-600">
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-blue-600" /> Sightings</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-600" /> Incidents</span>
<span className="inline-flex items-center gap-1"><span className="inline-block bg-green-600" style={{ width: 12, height: 2 }} /> Reserves</span>
          </div>
        </div>

        {/* Recent activity overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <RecentCard title="Recent Species" items={species} render={(s: any) => (
            <div key={s.w_species_id} className="flex justify-between text-sm"><span>{s.name}</span><span className="text-gray-500">ID {s.w_species_id}</span></div>
          )} />
          <RecentCard title="Recent Sightings" items={sightings} render={(s: any) => (
            <div key={s.sighting_id} className="flex justify-between text-sm"><span>ID {s.sighting_id}</span><span className="text-gray-500">{s.sighting_date?.slice(0,10)}</span></div>
          )} />
          <RecentCard title="Recent Reserves" items={reserves} render={(r: any) => (
            <div key={r.reserve_id} className="flex justify-between text-sm"><span>{r.name}</span><span className="text-gray-500">ID {r.reserve_id}</span></div>
          )} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <RecentCard title="Recent Hunters" items={hunters} render={(h: any) => (
            <div key={h.hunter_id} className="flex justify-between text-sm"><span>{h.name}</span><span className="text-gray-500">ID {h.hunter_id}</span></div>
          )} />
          <RecentCard title="Recent Licenses" items={licenses} render={(l: any) => (
            <div key={l.licence_id} className="flex justify-between text-sm"><span>{l.code}</span><span className="text-gray-500">Hunter {l.hunter_id}</span></div>
          )} />
          <RecentCard title="Recent Incidents" items={incidents} render={(i: any) => (
            <div key={i.incident_id} className="flex justify-between text-sm"><span>#{i.incident_id}</span><span className="text-gray-500">{i.incident_date?.slice(0,10)}</span></div>
          )} />
        </div>
      </div>
    </>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <div className="text-brand-500">{icon}</div>
      </div>
    </div>
  )
}

function RecentCard<T>({ title, items, render }: { title: string; items: T[]; render: (x: T) => ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
      {items.length ? (
        <div className="space-y-2">
          {items.map(render)}
        </div>
      ) : (
        <p className="text-gray-600 text-sm">No data yet</p>
      )}
    </div>
  )
}
