export function resolveApiBaseUrl(configuredValue?: string): string {
  return (configuredValue?.trim() || 'http://localhost:3000/api').replace(/\/+$/, '')
}

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL)
