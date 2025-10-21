import React, { createContext, useContext, useState, useEffect } from 'react'

export type UserRole = 'admin' | 'wildlife_monitor' | 'hunter' | 'anti_poaching_officer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('authToken')

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('user')
        localStorage.removeItem('authToken')
      }
    }

    setIsLoading(false)
  }, [])

  const login = (newUser: User, token: string) => {
    localStorage.setItem('user', JSON.stringify(newUser))
    localStorage.setItem('authToken', token)
    localStorage.setItem('userRole', newUser.role)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('authToken')
    localStorage.removeItem('userRole')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
