import { COUNTRIES, getCountry, type CountryCode } from '@/lib/countries'
import { WAREHOUSES } from '@/lib/warehouses'
import { ageInDays, computeLotStatut, conditionsDrift, sortFifo } from '@/lib/conditions'
import type { Alerte, EntrepotStatut, Lot, Mesure } from '@/api/types'

/*
 * A fully deterministic mock dataset. A seeded PRNG keeps the (deliberately
 * planted) drifts identical across reloads, so demos and alerts are stable.
 */

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const NOW = Date.now()
const HISTORY_DAYS = 30

function mulberry32(seed: number) {
  let s = seed
  return function next() {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(0x4b415741) // "KAWA"
const round1 = (n: number) => Math.round(n * 10) / 10

/** Warehouses that carry a deliberate recent drift so alerts are visible. */
interface DriftProfile {
  metric: 'temp' | 'humidity'
  daysAgo: number
  magnitude: number
}
const DRIFTS: Record<string, DriftProfile> = {
  'GUA-02': { metric: 'temp', daysAgo: 3, magnitude: 5 },
  'MED-01': { metric: 'humidity', daysAgo: 2, magnitude: 6 },
}

function generateMeasures(country: CountryCode, drift?: DriftProfile): Mesure[] {
  const { ideal } = getCountry(country)
  const measures: Mesure[] = []
  const start = NOW - HISTORY_DAYS * DAY_MS
  for (let t = start; t <= NOW; t += HOUR_MS) {
    const hour = new Date(t).getHours()
    const daily = Math.sin((hour / 24) * Math.PI * 2)
    let temp = ideal.temp + daily * 1.5 + (rand() - 0.5) * 0.8
    let humidity = ideal.humidity + daily * 2 + (rand() - 0.5) * 1.5

    if (drift) {
      const driftStart = NOW - drift.daysAgo * DAY_MS
      if (t >= driftStart) {
        const progress = (t - driftStart) / (NOW - driftStart || 1)
        if (drift.metric === 'temp') temp += drift.magnitude * progress
        else humidity += drift.magnitude * progress
      }
    }

    measures.push({
      timestamp: new Date(t).toISOString(),
      temp: round1(temp),
      humidity: round1(Math.max(0, Math.min(100, humidity))),
    })
  }
  return measures
}

// ---- Warehouses + their measure series -----------------------------------

export const measuresByWarehouse = new Map<string, Mesure[]>()
for (const w of WAREHOUSES) {
  measuresByWarehouse.set(w.id, generateMeasures(w.country, DRIFTS[w.id]))
}

// ---- Lots ------------------------------------------------------------------

const WH_CODE: Record<string, string> = Object.fromEntries(
  WAREHOUSES.map((w) => [w.id, w.id.split('-')[0]]),
)
const COUNTRY_PREFIX: Record<CountryCode, string> = { br: 'BR', ec: 'EC', co: 'CO' }

/** Age buckets across 40 lots: mostly fresh, some ageing, a few expired/shipped. */
function buildAges(): { age: number; expedie: boolean }[] {
  const out: { age: number; expedie: boolean }[] = []
  const push = (n: number, min: number, max: number, expedie = false) => {
    for (let i = 0; i < n; i++) {
      out.push({ age: Math.floor(min + rand() * (max - min)), expedie })
    }
  }
  push(20, 20, 360) // conforme / fresh
  push(8, 366, 540) // ageing — in alert by age
  push(6, 552, 900) // expired
  push(6, 120, 700, true) // shipped (any age)
  return out
}

function makeLots(): Lot[] {
  const ages = buildAges()
  const lots: Lot[] = []
  ages.forEach((entry, index) => {
    const warehouse = WAREHOUSES[index % WAREHOUSES.length]
    const country = getCountry(warehouse.country)
    const dateEntree = new Date(NOW - entry.age * DAY_MS)
    const year = dateEntree.getFullYear()
    const seq = String(140 + index).padStart(4, '0')
    const id = `${COUNTRY_PREFIX[warehouse.country]}-${WH_CODE[warehouse.id]}-${year}-${seq}`

    const last = measuresByWarehouse.get(warehouse.id)!.at(-1)!
    const drift = conditionsDrift(last, country)
    const statut = computeLotStatut({ age: entry.age, expedie: entry.expedie, drift })

    lots.push({
      id,
      pays: warehouse.country,
      entrepotId: warehouse.id,
      entrepotNom: warehouse.name,
      dateEntree: dateEntree.toISOString().slice(0, 10),
      ageJours: ageInDays(dateEntree.toISOString()),
      statut,
      conditions: statut === 'EXPEDIE' ? null : { temp: last.temp, humidity: last.humidity },
    })
  })
  return sortFifo(lots)
}

export const lots: Lot[] = makeLots()

// ---- Entrepôts (with last measure + status) -------------------------------

export const entrepots: EntrepotStatut[] = WAREHOUSES.map((w) => {
  const country = getCountry(w.country)
  const series = measuresByWarehouse.get(w.id)!
  const last = series.at(-1)!
  const nbLots = lots.filter((l) => l.entrepotId === w.id && l.statut !== 'EXPEDIE').length
  return {
    id: w.id,
    nom: w.name,
    pays: w.country,
    ville: w.city,
    ideal: country.ideal,
    tolerance: country.tolerance,
    derniereMesure: last,
    horsPlage: conditionsDrift(last, country),
    nbLots,
  }
})

// ---- Alertes ---------------------------------------------------------------

function makeAlertes(): Alerte[] {
  const out: Alerte[] = []
  let n = 0
  const nextId = () => `ALR-${String(++n).padStart(4, '0')}`
  const emailPick = (): Alerte['emailStatut'] => {
    const r = rand()
    if (r < 0.72) return 'ENVOYE'
    if (r < 0.9) return 'EN_ATTENTE'
    return 'ECHEC'
  }

  // Drift alerts — one per out-of-range warehouse.
  for (const e of entrepots) {
    if (!e.horsPlage) continue
    const country = getCountry(e.pays)
    const overTemp = Math.abs(e.derniereMesure.temp - country.ideal.temp) > country.tolerance.temp
    const metric = overTemp ? 'température' : 'humidité'
    const value = overTemp ? `${e.derniereMesure.temp}°C` : `${e.derniereMesure.humidity}%`
    out.push({
      id: nextId(),
      type: 'DERIVE',
      pays: e.pays,
      entrepotId: e.id,
      entrepotNom: e.nom,
      lotId: null,
      timestamp: new Date(NOW - Math.floor(rand() * 6 * HOUR_MS)).toISOString(),
      message: `Dérive de ${metric} : ${value} hors tolérance à ${e.nom}.`,
      emailStatut: emailPick(),
      traitee: false,
    })
  }

  // Expiry alerts — the oldest ageing/expired, non-shipped lots.
  const ageing = lots
    .filter((l) => (l.statut === 'PERIME' || l.statut === 'EN_ALERTE') && l.ageJours >= 365)
    .slice(0, 6)
  for (const l of ageing) {
    out.push({
      id: nextId(),
      type: 'PEREMPTION',
      pays: l.pays,
      entrepotId: l.entrepotId,
      entrepotNom: l.entrepotNom,
      lotId: l.id,
      timestamp: new Date(NOW - Math.floor(rand() * 3 * DAY_MS)).toISOString(),
      message: `Lot ${l.id} à ${l.ageJours} j de stockage (seuil 365 j).`,
      emailStatut: emailPick(),
      traitee: rand() < 0.25,
    })
  }

  // Priority: unhandled first, then most recent.
  return out.sort((a, b) => {
    if (a.traitee !== b.traitee) return a.traitee ? 1 : -1
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })
}

export const alertes: Alerte[] = makeAlertes()

export const paysInfo = COUNTRIES.map((c) => ({
  code: c.code,
  nom: c.name,
  ideal: c.ideal,
  tolerance: c.tolerance,
}))
