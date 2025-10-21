import { useEffect, useState } from 'react'
import { apiEndpoints } from '../../lib/api'
import PageMeta from '../../components/common/PageMeta'
import MapOverview from '../../components/map/MapOverview'

export default function AntiPoachingDashboard() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [reserves, setReserves] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incidentsRes, reservesRes, statsRes] = await Promise.all([
          apiEndpoints.poaching.list(),
          apiEndpoints.reserves.list(),
          apiEndpoints.stats.getDashboard(),
        ])
        setIncidents(incidentsRes.data.slice(0, 10))
        setReserves(reservesRes.data.slice(0, 5))
        setStats(statsRes.data)
      } catch (err) {
        setError('Failed to fetch data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading anti-poaching dashboard...</p>
      </div>
    )
  }

  return (
    <>
      <PageMeta title="Anti-Poaching Officer Dashboard" />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Anti-Poaching Operations</h1>
        <p className="text-gray-600">Monitor and manage poaching incidents across reserves</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <OverviewCard title="Incidents" value={stats.poaching} />
            <OverviewCard title="Reserves" value={stats.reserves} />
            <OverviewCard title="Species" value={stats.species} />
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Operations Map</h2>
          <MapOverview sightings={[]} incidents={incidents} reserves={reserves} height={320} />
          <div className="flex gap-4 text-xs mt-2 text-gray-600">
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-600" /> Incidents</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block bg-green-600" style={{ width: 12, height: 2 }} /> Reserves</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Poaching Incidents</h2>
              {incidents.length > 0 ? (
                <div className="space-y-3">
                  {incidents.map((incident) => (
                    <div
                      key={incident.incident_id}
                      className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 p-3 rounded"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">Incident #{incident.incident_id}</p>
                          <p className="text-sm text-gray-600">Date: {incident.incident_date}</p>
                          <p className="text-sm text-gray-600">Reserve: {incident.reserve_id || 'Not specified'}</p>
                          <p className="text-sm text-gray-600">Description: {incident.description || 'No details'}</p>
                        </div>
                        <span className="text-2xl">⚠️</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No incidents reported</p>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Protected Reserves</h2>
              {reserves.length > 0 ? (
                <div className="space-y-3">
                  {reserves.map((reserve) => (
                    <div key={reserve.reserve_id} className="bg-green-50 p-3 rounded border border-green-200">
                      <p className="font-semibold text-green-900">{reserve.name}</p>
                      <p className="text-xs text-green-700">ID: {reserve.reserve_id}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No reserves available</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
          <h3 className="font-bold text-red-900 mb-2">Anti-Poaching Operations</h3>
          <ul className="text-red-800 space-y-1 text-sm">
            <li>• Report and track poaching incidents</li>
            <li>• Monitor reserve boundaries</li>
            <li>• Coordinate patrol activities</li>
            <li>• Generate incident reports</li>
            <li>• Analyze poaching patterns</li>
          </ul>
        </div>
      </div>
    </>
  )
}

function OverviewCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  )
}
