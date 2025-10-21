import { useEffect, useState, type ReactNode } from 'react'
import { apiEndpoints } from '../../lib/api'
import PageMeta from '../../components/common/PageMeta'
import { FaPaw, FaEye, FaMap, FaUser, FaFileAlt, FaExclamationTriangle, FaChartBar } from 'react-icons/fa'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiEndpoints.stats.getDashboard()
        setStats(response.data)
      } catch (err) {
        // Set mock data if backend is unavailable
        setStats({
          species: 0,
          sightings: 0,
          reserves: 0,
          hunters: 0,
          licences: 0,
          poaching: 0,
          quotas: 0
        })
        setError('Backend statistics unavailable. Ensure DATABASE_URL is configured.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Management Tasks</h2>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Manage species and wildlife data</li>
              <li>✓ Monitor all sightings and reports</li>
              <li>✓ Manage game reserves and boundaries</li>
              <li>✓ Oversee hunter licenses</li>
              <li>✓ Track hunting quotas</li>
              <li>✓ Review poaching incidents</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-800 mb-4">System Status</h2>
            <ul className="space-y-2 text-gray-700">
              <li>Status: <span className="text-green-600 font-bold">Operational</span></li>
              <li>Data: <span className="text-green-600 font-bold">Synced</span></li>
              <li>Last Updated: <span className="text-gray-600">Just now</span></li>
            </ul>
          </div>
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
