import { useEffect, useState } from 'react'
import { backendApi } from '../lib/api'

type Licence = {
  licence_id: number
  hunter_id: number
  issue_date: string
  expiry_date: string
  created_at?: string
}

export default function LicencesPage() {
  const [items, setItems] = useState<Licence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hunters, setHunters] = useState<Array<{ hunter_id: number; name: string }>>([])
  const [formHunterId, setFormHunterId] = useState('')
  const [formIssue, setFormIssue] = useState('')
  const [formExpiry, setFormExpiry] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editHunterId, setEditHunterId] = useState('')
  const [editIssue, setEditIssue] = useState('')
  const [editExpiry, setEditExpiry] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    backendApi
      .get<Licence[]>('/api/licences')
      .then((res) => setItems(res.data))
      .catch((e) => setError(e?.message || 'Failed to load licences'))
      .finally(() => setLoading(false))

    backendApi
      .get<Array<{ hunter_id: number; name: string }>>('/api/hunters')
      .then((res) => setHunters(res.data))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-800">Licences</h2>
      <p className="text-sm text-slate-600">Issue and manage hunting licences. Select a hunter and the licence dates to create a new record. Use the table to review and delete licences.</p>
      <section className="bg-white border rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-slate-600 mb-3">Add Licence</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!formHunterId || !formIssue || !formExpiry) return
            setSubmitting(true)
            setSubmitError(null)
            try {
              const res = await backendApi.post<Licence>('/api/licences', {
                hunter_id: Number(formHunterId),
                issue_date: formIssue,
                expiry_date: formExpiry,
              })
              setItems((prev) => [res.data, ...prev])
              setFormHunterId('')
              setFormIssue('')
              setFormExpiry('')
            } catch (e: any) {
              setSubmitError(e?.message || 'Failed to create licence')
            } finally {
              setSubmitting(false)
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-sm text-slate-600 mb-1">Hunter</label>
            <select
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
              value={formHunterId}
              onChange={(e) => setFormHunterId(e.target.value)}
              required
            >
              <option value="" disabled>Select a hunter…</option>
              {hunters.map((h) => (
                <option key={h.hunter_id} value={h.hunter_id}>{h.name} (#{h.hunter_id})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Issue Date</label>
            <input
              type="date"
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
              value={formIssue}
              onChange={(e) => setFormIssue(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Expiry Date</label>
            <input
              type="date"
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
              value={formExpiry}
              onChange={(e) => setFormExpiry(e.target.value)}
              required
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Adding…' : 'Add Licence'}
            </button>
          </div>
        </form>
        {submitError && <p className="text-sm text-red-600 mt-2">{submitError}</p>}
      </section>
      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <section className="bg-white border rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium">ID</th>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium">Hunter ID</th>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium">Issue Date</th>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium">Expiry Date</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((l) => {
                  const isEditing = editId === l.licence_id
                  return (
                    <tr key={l.licence_id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">{l.licence_id}</td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <select
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            value={editHunterId}
                            onChange={(e) => setEditHunterId(e.target.value)}
                          >
                            <option value="" disabled>Select hunter…</option>
                            {hunters.map((h) => (
                              <option key={h.hunter_id} value={h.hunter_id}>{h.name} (#{h.hunter_id})</option>
                            ))}
                          </select>
                        ) : (
                          l.hunter_id
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <input
                            type="date"
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            value={editIssue}
                            onChange={(e) => setEditIssue(e.target.value)}
                          />
                        ) : (
                          l.issue_date
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <input
                            type="date"
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            value={editExpiry}
                            onChange={(e) => setEditExpiry(e.target.value)}
                          />
                        ) : (
                          l.expiry_date
                        )}
                      </td>
                      <td className="px-4 py-2 text-right space-x-3">
                        {isEditing ? (
                          <>
                            <button
                              onClick={async () => {
                                if (!editHunterId || !editIssue || !editExpiry) {
                                  setUpdateError('All fields are required')
                                  return
                                }
                                setUpdating(true)
                                setUpdateError(null)
                                try {
                                  const res = await backendApi.put(`/api/licences/${l.licence_id}`, {
                                    hunter_id: Number(editHunterId),
                                    issue_date: editIssue,
                                    expiry_date: editExpiry,
                                  })
                                  setItems((prev) => prev.map((x) => (x.licence_id === l.licence_id ? res.data : x)))
                                  setEditId(null)
                                  setEditHunterId('')
                                  setEditIssue('')
                                  setEditExpiry('')
                                } catch (e: any) {
                                  setUpdateError(e?.message || 'Failed to update licence')
                                } finally {
                                  setUpdating(false)
                                }
                              }}
                              disabled={updating}
                              className="text-emerald-600 hover:underline disabled:opacity-50"
                            >
                              {updating ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setEditId(null)
                                setEditHunterId('')
                                setEditIssue('')
                                setEditExpiry('')
                                setUpdateError(null)
                              }}
                              className="text-slate-600 hover:underline"
                            >
                              Cancel
                            </button>
                            {updateError && <div className="text-xs text-red-600 mt-1 inline-block">{updateError}</div>}
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditId(l.licence_id)
                                setEditHunterId(String(l.hunter_id))
                                setEditIssue(l.issue_date)
                                setEditExpiry(l.expiry_date)
                              }}
                              className="text-sky-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await backendApi.delete(`/api/licences/${l.licence_id}`)
                                  setItems((prev) => prev.filter((x) => x.licence_id !== l.licence_id))
                                } catch (e: any) {
                                  alert(e?.message || 'Failed to delete licence')
                                }
                              }}
                              className="text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
