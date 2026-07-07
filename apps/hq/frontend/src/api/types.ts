import type { CountryCode, Conditions } from '@/lib/countries'

export type LotStatut = 'CONFORME' | 'EN_ALERTE' | 'PERIME' | 'EXPEDIE'

export interface Lot {
  id: string
  pays: CountryCode
  entrepotId: string
  entrepotNom: string
  dateEntree: string // ISO date
  ageJours: number
  statut: LotStatut
  /** Latest conditions at the lot's warehouse; null once shipped. */
  conditions: Conditions | null
}

export interface Mesure {
  timestamp: string // ISO datetime
  temp: number
  humidity: number
}

export interface EntrepotStatut {
  id: string
  nom: string
  pays: CountryCode
  ville: string
  ideal: Conditions
  tolerance: Conditions
  derniereMesure: Mesure
  /** True when the last measure is outside the country tolerance. */
  horsPlage: boolean
  nbLots: number
}

export type AlerteType = 'DERIVE' | 'PEREMPTION'
export type EmailStatut = 'ENVOYE' | 'EN_ATTENTE' | 'ECHEC'

export interface Alerte {
  id: string
  type: AlerteType
  pays: CountryCode
  entrepotId: string
  entrepotNom: string
  lotId: string | null
  timestamp: string // ISO datetime
  message: string
  emailStatut: EmailStatut
  traitee: boolean
}

export interface PaysInfo {
  code: CountryCode
  nom: string
  ideal: Conditions
  tolerance: Conditions
}

export type Periode = '24h' | '7j' | '30j' | 'tout'
