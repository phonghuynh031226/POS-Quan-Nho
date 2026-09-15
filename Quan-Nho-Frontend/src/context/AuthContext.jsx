import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/authApi'
import { mockDb } from '../api/mockDb'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => mockDb.getCurrentUser())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Listen for auth changes across tabs
    const unsubscribe = mockDb.subscribe((event) => {
      if (event && event.type === 'AUTH_CHANGED') {
        setCurrentUser(event.payload)
      }
    })
    return unsubscribe
  }, [])

  const login = async (username, password) => {
    setLoading(true)
    try {
      const user = await authApi.login(username, password)
      setCurrentUser(user)
      return user
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await authApi.logout()
    setCurrentUser(null)
  }

  const hasRole = (allowedRoles) => {
    if (!currentUser) return false
    if (!allowedRoles || allowedRoles.length === 0) return true
    // Chủ quán (OWNER) và ADMIN luôn có toàn quyền truy cập tất cả các trang
    if (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') return true
    return allowedRoles.includes(currentUser.role)
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
