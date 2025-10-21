import { useEffect, useState } from 'react'
import { apiEndpoints } from '../../lib/api'
import PageMeta from '../../components/common/PageMeta'

export default function HunterDashboard() {
  const [licenses, setLicenses] = useState<any[]>([])
  const [quotas, setQuotas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [licensesRes, quotasRes] = await Promise.all([
          apiEndpoints.licenses.list(),
          apiEndpoints.quotas.list(),
        ])
        setLicenses(licensesRes.data.slice(0, 5))
        setQuotas(quotasRes.data.slice(0, 5))
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
        <p className="text-lg text-gray-600">Loading hunter dashboard...</p>
      </div>
    )
  }

  return (
    <>
      <PageMeta title="Hunter Dashboard" />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Hunter Dashboard</h1>
        <p className="text-gray-600">Manage your hunting licenses and compliance</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-4">My Licenses</h2>
              {licenses.length > 0 ? (
                <div className="space-y-3">
                  {licenses.map((license) => (
                    <div key={license.licence_id} className="border border-orange-200 rounded p-4 bg-orange-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">License #{license.licence_id}</p>
                          <p className="text-sm text-gray-600">Hunter ID: {license.hunter_id}</p>
                          <p className="text-sm text-gray-600">Valid from: {license.issue_date}</p>
                          <p className="text-sm text-gray-600">Expires: {license.expiry_date}</p>
                        </div>
                        <span className="text-2xl">✓</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No licenses found</p>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Current Hunting Quotas</h2>
              {quotas.length > 0 ? (
                <div className="space-y-3">
                  {quotas.map((quota) => (
                    <div key={quota.quota_id} className="border border-purple-200 rounded p-4 bg-purple-50">
                      <p className="font-semibold text-gray-800">Year {quota.year}</p>
                      <p className="text-sm text-gray-600">Species ID: {quota.w_species_id}</p>
                      <p className="text-sm text-gray-600">Reserve ID: {quota.reserve_id}</p>
                      <p className="text-lg font-bold text-purple-700 mt-2">Quota: {quota.quota}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No quotas available</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded">
          <h3 className="font-bold text-orange-900 mb-2">License Information</h3>
          <ul className="text-orange-800 space-y-1 text-sm">
            <li>• Keep your license valid and up-to-date</li>
            <li>• Respect all hunting quotas and seasons</li>
            <li>• Report your catches accurately</li>
            <li>• Follow all wildlife regulations</li>
          </ul>
        </div>
      </div>
    </>
  )
}
