// API Configuration Helper
// In development, VITE_API_URL is empty, so requests use the local Vite proxy (/api -> http://localhost:8000)
// In production (Netlify), set VITE_API_URL to the deployed backend URL (e.g. https://your-backend.onrender.com)

const RAW_API_URL = import.meta.env.VITE_API_URL || ''
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '')

export function getApiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${cleanPath}`
}
