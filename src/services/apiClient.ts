import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const createInstance = () =>
  axios.create({
    baseURL: BASE_URL,
    timeout: 15_000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

export const apiClient = createInstance()

apiClient.interceptors.request.use(
  (config) => {
    config.headers = {
      ...config.headers,
      'X-Guacamole-Client': 'modern-ui',
    }
    return config
  },
  (error) => Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // placeholder for centralized error tracking
    return Promise.reject(error)
  },
)
