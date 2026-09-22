import axios from 'axios'

/**
 * Axios instance configured for future Spring Boot REST API integration.
 * - withCredentials: true sends JSESSIONID cookies automatically for Spring Security session management.
 * - baseURL: configurable via VITE_API_BASE_URL (defaults to /api)
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Spring Security requires a CSRF token for every write, including login.
const csrfClient = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api', withCredentials: true })
let csrfToken = null
apiClient.interceptors.request.use(async (config) => {
  if (!['get', 'head', 'options'].includes((config.method || 'get').toLowerCase())) {
    if (!csrfToken) {
      const { data } = await csrfClient.get('/auth/csrf')
      csrfToken = data.token
    }
    config.headers['X-XSRF-TOKEN'] = csrfToken
  }
  return config
})

// Response interceptor for handling 401 Unauthorized from Spring Security
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Session expired or unauthenticated
      console.warn('Phiên đăng nhập đã hết hạn hoặc chưa xác thực')
    }
    if (error.response?.status === 403) csrfToken = null
    return Promise.reject(error)
  }
)

export default apiClient
