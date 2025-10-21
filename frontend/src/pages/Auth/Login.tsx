import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth, type User } from '../../context/AuthContext'

const DEMO_USERS = [
  { id: '1', name: 'Admin User', email: 'admin@wims.test', role: 'admin' as const },
  { id: '2', name: 'Wildlife Monitor', email: 'monitor@wims.test', role: 'wildlife_monitor' as const },
  { id: '3', name: 'Hunter', email: 'hunter@wims.test', role: 'hunter' as const },
  { id: '4', name: 'Anti-Poaching Officer', email: 'officer@wims.test', role: 'anti_poaching_officer' as const },
]

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<string>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const user = DEMO_USERS.find((u) => u.role === selectedRole) as User | undefined
    if (!user) {
      setError('User not found')
      return
    }

    login(user, 'demo-token-' + Date.now())
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">WIMS</h1>
        <p className="text-center text-gray-600 mb-8">Wildlife Management Information System</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DEMO_USERS.map((user) => (
                <option key={user.role} value={user.role}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
          >
            Login
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center mb-4">Demo Users (password: anything)</p>
          <div className="space-y-2 text-xs text-gray-600">
            {DEMO_USERS.map((user) => (
              <div key={user.role} className="bg-gray-50 p-2 rounded">
                <p className="font-semibold">{user.name}</p>
                <p>Email: {user.email}</p>
                <p>Role: {user.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
