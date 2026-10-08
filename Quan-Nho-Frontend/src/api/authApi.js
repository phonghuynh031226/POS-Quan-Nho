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
  async updateProfile(profileData) {
    const { data } = await apiClient.put('/auth/profile', profileData)
    return data
  },
  async changePassword(currentPassword, newPassword) {
    const { data } = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    })
    return data
  },
}
