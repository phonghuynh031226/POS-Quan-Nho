import apiClient from './apiClient'

export const authApi = {
  async login(username, password) {
    const { data } = await apiClient.post('/auth/login', { username, password })
    return data
  },
  async logout() {
    await apiClient.post('/auth/logout')
    return true
  },
  async getCurrentSession() {
    try {
      const { data } = await apiClient.get('/auth/me')
      return data
    } catch (error) {
      if (error.response?.status === 401) return null
      throw error
    }
  },
}
