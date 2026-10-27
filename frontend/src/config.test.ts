import { describe, expect, it } from 'vitest'
import { resolveApiBaseUrl } from './config'

describe('resolveApiBaseUrl', () => {
  it('uses the local API default when no environment value is supplied', () => {
    expect(resolveApiBaseUrl()).toBe('http://localhost:3000/api')
  })

  it('trims and removes trailing slashes from the configured API URL', () => {
    expect(resolveApiBaseUrl(' https://api.example.test/api/// ')).toBe(
      'https://api.example.test/api',
    )
  })
})
