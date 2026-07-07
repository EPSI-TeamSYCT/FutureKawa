import type { Conditions, Country } from './countries'
import type { LotStatut } from '@/api/types'

const DAY_MS = 24 * 60 * 60 * 1000

/** Whole days between an entry date and a reference instant (default: now). */
export function ageInDays(dateEntree: string, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(dateEntree).getTime()) / DAY_MS))
}

/** A single reading is out of range when it strays past ideal ± tolerance. */
export function isOutOfRange(value: number, ideal: number, tolerance: number): boolean {
  return Math.abs(value - ideal) > tolerance
}

export function isTempOutOfRange(temp: number, country: Country): boolean {
  return isOutOfRange(temp, country.ideal.temp, country.tolerance.temp)
}

export function isHumidityOutOfRange(humidity: number, country: Country): boolean {
  return isOutOfRange(humidity, country.ideal.humidity, country.tolerance.humidity)
}

/** Conditions drift when temperature OR humidity leaves the tolerance band. */
export function conditionsDrift(cond: Conditions, country: Country): boolean {
  return isTempOutOfRange(cond.temp, country) || isHumidityOutOfRange(cond.humidity, country)
}

export const PERIME_DAYS = 550
export const ALERTE_AGE_DAYS = 365

/**
 * Lot status precedence: shipped → expired (≥550 j) → in alert (age ≥ 365 j or
 * conditions drifting) → conforme.
 */
export function computeLotStatut(params: {
  age: number
  expedie: boolean
  drift: boolean
}): LotStatut {
  if (params.expedie) return 'EXPEDIE'
  if (params.age >= PERIME_DAYS) return 'PERIME'
  if (params.age >= ALERTE_AGE_DAYS || params.drift) return 'EN_ALERTE'
  return 'CONFORME'
}

/** Colour tone for an age badge (matches the charte's < 365 / < 550 / ≥ 550 rule). */
export function ageTone(age: number): 'neutral' | 'alert' | 'danger' {
  if (age >= PERIME_DAYS) return 'danger'
  if (age >= ALERTE_AGE_DAYS) return 'alert'
  return 'neutral'
}

/** Sort lots FIFO — oldest entry first (the ones that must ship first). */
export function sortFifo<T extends { dateEntree: string }>(lots: T[]): T[] {
  return [...lots].sort(
    (a, b) => new Date(a.dateEntree).getTime() - new Date(b.dateEntree).getTime(),
  )
}
