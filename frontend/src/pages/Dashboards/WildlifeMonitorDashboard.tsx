import { useEffect, useState } from 'react'
import { apiEndpoints } from '../../lib/api'
import PageMeta from '../../components/common/PageMeta'
import MapOverview from '../../components/map/MapOverview'

export default function WildlifeMonitorDashboard() {
  const [sightings, setSightings] = useState<any[]>([])
  const [species, setSpecies] = useState<any[]>([])
  const [reserves, setReserves] = useState<any[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sightingsRes, speciesRes, statsRes, reservesRes, incidentsRes] = await Promise.all([
          apiEndpoints.sightings.list(),
          apiEndpoints.species.list(),
          apiEndpoints.stats.getDashboard(),
          apiEndpoints.reserves.list(),
          apiEndpoints.poaching.list(),
        ])
        setSightings(sightingsRes.data.slice(0, 10))
        setSpecies(speciesRes.data.slice(0, 5))
        setStats(statsRes.data)
        setReserves(reservesRes.data || [])
        setIncidents(incidentsRes.data.slice(0, 10) || [])
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
        <p className="text-lg text-gray-600">Loading wildlife monitor dashboard...</p>
      </div>
    )
  }

  return (
    <>
      <PageMeta title="Wildlife Monitor Dashboard" />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Wildlife Monitoring Dashboard</h1>
        <p className="text-gray-600">Track and monitor wildlife sightings and species data</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <OverviewCard title="Species" value={stats.species} />
            <OverviewCard title="Sightings" value={stats.sightings} />
            <OverviewCard title="Reserves" value={stats.reserves} />
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Spatial Overview</h2>
          <MapOverview sightings={sightings} incidents={incidents} reserves={reserves} height={320} />
          <div className="flex gap-4 text-xs mt-2 text-gray-600">
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-blue-600" /> Sightings</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-600" /> Incidents</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block bg-green-600" style={{ width: 12, height: 2 }} /> Reserves</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Sightings</h2>
              {sightings.length > 0 ? (
                <div className="space-y-3">
                  {sightings.map((sighting) => (
                    <div key={sighting.sighting_id} className="border-l-4 border-green-500 pl-4 py-2">
                      <p className="font-semibold text-gray-800">Species ID: {sighting.w_species_id}</p>
                      <p className="text-sm text-gray-600">Date: {sighting.sighting_date}</p>
                      <p className="text-sm text-gray-600">Notes: {sighting.notes || 'No notes'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No sightings recorded yet</p>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Monitored Species</h2>
              {species.length > 0 ? (
                <div className="space-y-3">
                  {species.map((sp) => (
                    <div key={sp.w_species_id} className="bg-blue-50 p-3 rounded">
                      <p className="font-semibold text-blue-900">{sp.name}</p>
                      <p className="text-sm text-blue-700">Population: {sp.population || 'Unknown'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No species data</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
          <h3 className="font-bold text-blue-900 mb-2">Monitoring Tasks</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Record and track new wildlife sightings</li>
            <li>• Monitor species population trends</li>
            <li>• Document behavioral observations</li>
            <li>• Report unusual wildlife activity</li>
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
