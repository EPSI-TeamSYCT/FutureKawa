import { describe, expect, it } from 'vitest'
import {
  ageInDays,
  ageTone,
  computeLotStatut,
  conditionsDrift,
  isOutOfRange,
  sortFifo,
} from './conditions'
import { getCountry } from './countries'

const equateur = getCountry('ec') // ideal 31°C ± 3, 60% ± 2

describe('ageInDays', () => {
  it('counts whole days since entry', () => {
    const now = Date.parse('2026-07-07T12:00:00Z')
    expect(ageInDays('2026-07-01', now)).toBe(6)
  })
  it('never goes negative for future dates', () => {
    const now = Date.parse('2026-07-07T12:00:00Z')
    expect(ageInDays('2026-07-10', now)).toBe(0)
  })
})

describe('isOutOfRange', () => {
  it('is false inside the tolerance band', () => {
    expect(isOutOfRange(31, 31, 3)).toBe(false)
    expect(isOutOfRange(34, 31, 3)).toBe(false)
  })
  it('is true beyond the tolerance band', () => {
    expect(isOutOfRange(35, 31, 3)).toBe(true)
    expect(isOutOfRange(27, 31, 3)).toBe(true)
  })
})

describe('conditionsDrift', () => {
  it('flags a temperature drift', () => {
    expect(conditionsDrift({ temp: 36, humidity: 60 }, equateur)).toBe(true)
  })
  it('flags a humidity drift', () => {
    expect(conditionsDrift({ temp: 31, humidity: 64 }, equateur)).toBe(true)
  })
  it('passes healthy conditions', () => {
    expect(conditionsDrift({ temp: 30.5, humidity: 61 }, equateur)).toBe(false)
  })
})

describe('computeLotStatut', () => {
  it('prioritises shipped over everything', () => {
    expect(computeLotStatut({ age: 900, expedie: true, drift: true })).toBe('EXPEDIE')
  })
  it('marks expired past 550 days', () => {
    expect(computeLotStatut({ age: 600, expedie: false, drift: false })).toBe('PERIME')
  })
  it('marks in-alert past 365 days', () => {
    expect(computeLotStatut({ age: 400, expedie: false, drift: false })).toBe('EN_ALERTE')
  })
  it('marks in-alert on drift even when young', () => {
    expect(computeLotStatut({ age: 100, expedie: false, drift: true })).toBe('EN_ALERTE')
  })
  it('is conforme when young and stable', () => {
    expect(computeLotStatut({ age: 100, expedie: false, drift: false })).toBe('CONFORME')
  })
})

describe('ageTone', () => {
  it('maps age to the charte badge tone', () => {
    expect(ageTone(200)).toBe('neutral')
    expect(ageTone(365)).toBe('alert')
    expect(ageTone(549)).toBe('alert')
    expect(ageTone(550)).toBe('danger')
  })
})

describe('sortFifo', () => {
  it('orders oldest entry first', () => {
    const lots = [
      { id: 'b', dateEntree: '2025-06-01' },
      { id: 'a', dateEntree: '2024-01-15' },
      { id: 'c', dateEntree: '2025-12-31' },
    ]
    expect(sortFifo(lots).map((l) => l.id)).toEqual(['a', 'b', 'c'])
  })
  it('does not mutate the input', () => {
    const lots = [
      { id: 'b', dateEntree: '2025-06-01' },
      { id: 'a', dateEntree: '2024-01-15' },
    ]
    sortFifo(lots)
    expect(lots[0].id).toBe('b')
  })
})
