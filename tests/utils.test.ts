import { describe, expect, it } from 'vitest'

import { formatDuration, formatSpeed, formatEta } from '../src/lib/utils.ts'

describe('formatDuration', () => {
  it('formats short durations as mm:ss', () => {
      expect(formatDuration(65)).toBe('1:05')
      expect(formatDuration(3599)).toBe('59:59')
  })

  it('formats long durations as h:mm:ss', () => {
      expect(formatDuration(3600)).toBe('1:00:00')
      expect(formatDuration(3661)).toBe('1:01:01')
  })
})

describe('formatSpeed', () => {
  it('formats bytes per second correctly', () => {
    expect(formatSpeed(0)).toBe('0 KB/s')
    expect(formatSpeed(500 * 1024)).toBe('500.0 KB/s')
    expect(formatSpeed(2.5 * 1024 * 1024)).toBe('2.5 MB/s')
  })
})

describe('formatEta', () => {
  it('formats remaining seconds into readable eta strings', () => {
    expect(formatEta(0)).toBe('')
    expect(formatEta(45)).toBe('45s')
    expect(formatEta(65)).toBe('1m 5s')
    expect(formatEta(3665)).toBe('1h 1m 5s')
  })
})
