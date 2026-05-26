import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 15_000,
})

http.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('ADMIN_TOKEN') || ''
  if (adminToken) {
    config.headers = config.headers ?? {}
    config.headers['X-Admin-Token'] = adminToken
  }

  const studentToken = localStorage.getItem('STUDENT_TOKEN') || ''
  if (studentToken) {
    config.headers = config.headers ?? {}
    config.headers['Authorization'] = `Bearer ${studentToken}`
  }

  return config
})
