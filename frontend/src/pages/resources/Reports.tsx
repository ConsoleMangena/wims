import PageMeta from '../../components/common/PageMeta'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageMeta title="Reports" />
      <h1 className="text-2xl font-semibold">Reports</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-700">
          Reports module placeholder. Here you can generate incident summaries, reserve activity reports, and export data.
        </p>
      </div>
    </div>
  )
}
