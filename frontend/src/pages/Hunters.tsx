import { useEffect, useState } from 'react'
import { backendApi } from '../lib/api'

type Hunter = {
  hunter_id: number
  name: string
  address?: string | null
  created_at?: string
}

export default function HuntersPage() {
  const [items, setItems] = useState<Hunter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    backendApi
      .get<Hunter[]>('/api/hunters')
      .then((res) => setItems(res.data))
      .catch((e) => setError(e?.message || 'Failed to load hunters'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-800">Hunters</h2>
      <p className="text-sm text-slate-600">Manage registered hunters involved in licensed hunting activities. Use the form to add a hunter (name and optional address), and the table to remove records.</p>
      <section className="bg-white border rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-slate-600 mb-3">Add Hunter</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!formName.trim()) return
            setSubmitting(true)
            setSubmitError(null)
            try {
              const res = await backendApi.post<Hunter>('/api/hunters', {
                name: formName.trim(),
                address: formAddress.trim() || null,
              })
              setItems((prev) => [res.data, ...prev])
              setFormName('')
              setFormAddress('')
            } catch (e: any) {
              setSubmitError(e?.message || 'Failed to create hunter')
            } finally {
              setSubmitting(false)
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
        >
          <div>
            <label className="block text-sm text-slate-600 mb-1">Name</label>
            <input
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Address (optional)</label>
            <input
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring focus:ring-slate-200"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              placeholder="e.g. 123 Hill Rd"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Adding…' : 'Add Hunter'}
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
                  <th className="px-4 py-2 text-left text-slate-600 font-medium">Name</th>
                  <th className="px-4 py-2 text-left text-slate-600 font-medium">Address</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((h) => {
                  const isEditing = editId === h.hunter_id
                  return (
                    <tr key={h.hunter_id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">{h.hunter_id}</td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Name"
                          />
                        ) : (
                          h.name
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-1"
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            placeholder="Address (optional)"
                          />
                        ) : (
                          h.address ?? '—'
                        )}
                      </td>
                      <td className="px-4 py-2 text-right space-x-3">
                        {isEditing ? (
                          <>
                            <button
                              onClick={async () => {
                                if (!editName.trim()) {
                                  setUpdateError('Name is required')
                                  return
                                }
                                setUpdating(true)
                                setUpdateError(null)
                                try {
                                  const res = await backendApi.put(`/api/hunters/${h.hunter_id}`, {
                                    name: editName.trim(),
                                    address: editAddress.trim() || null,
                                  })
                                  setItems((prev) => prev.map((x) => (x.hunter_id === h.hunter_id ? res.data : x)))
                                  setEditId(null)
                                  setEditName('')
                                  setEditAddress('')
                                } catch (e: any) {
                                  setUpdateError(e?.message || 'Failed to update hunter')
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
                                setEditName('')
                                setEditAddress('')
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
                                setEditId(h.hunter_id)
                                setEditName(h.name)
                                setEditAddress(h.address ?? '')
                              }}
                              className="text-sky-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await backendApi.delete(`/api/hunters/${h.hunter_id}`)
                                  setItems((prev) => prev.filter((x) => x.hunter_id !== h.hunter_id))
                                } catch (e: any) {
                                  alert(e?.message || 'Failed to delete hunter')
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
