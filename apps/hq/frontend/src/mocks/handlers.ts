import { delay, http, HttpResponse } from 'msw'
import { isCountryScope } from '@/lib/countries'
import type { LotStatut, Periode } from '@/api/types'
import { alertes, entrepots, lots, measuresByWarehouse, paysInfo } from './data'

const PERIOD_HOURS: Record<Periode, number> = { '24h': 24, '7j': 168, '30j': 720, tout: 100000 }

/** Small latency so loading skeletons are visible during the demo. */
async function lag() {
  await delay(300 + Math.floor(Math.random() * 300))
}

function paysFilter(param: string | null): (item: { pays: string }) => boolean {
  if (!param || param === 'siege' || !isCountryScope(param)) return () => true
  return (item) => item.pays === param
}

export const handlers = [
  http.get('/api/pays', async () => {
    await lag()
    return HttpResponse.json(paysInfo)
  }),

  http.get('/api/lots', async ({ request }) => {
    await lag()
    const url = new URL(request.url)
    const pays = url.searchParams.get('pays')
    const entrepot = url.searchParams.get('entrepot')
    const statut = url.searchParams.get('statut') as LotStatut | null

    const result = lots
      .filter(paysFilter(pays))
      .filter((l) => (entrepot ? l.entrepotId === entrepot : true))
      .filter((l) => (statut ? l.statut === statut : true))
    return HttpResponse.json(result)
  }),

  http.get('/api/lots/:id', async ({ params }) => {
    await lag()
    const lot = lots.find((l) => l.id === params.id)
    if (!lot) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(lot)
  }),

  http.get('/api/lots/:id/mesures', async ({ params, request }) => {
    await lag()
    const lot = lots.find((l) => l.id === params.id)
    if (!lot) return new HttpResponse(null, { status: 404 })
    const periode = (new URL(request.url).searchParams.get('periode') ?? '30j') as Periode
    const hours = PERIOD_HOURS[periode] ?? PERIOD_HOURS['30j']
    const cutoff = Date.now() - hours * 60 * 60 * 1000
    const series = measuresByWarehouse.get(lot.entrepotId) ?? []
    const filtered = series.filter((m) => new Date(m.timestamp).getTime() >= cutoff)
    return HttpResponse.json(filtered)
  }),

  http.get('/api/entrepots', async ({ request }) => {
    await lag()
    const pays = new URL(request.url).searchParams.get('pays')
    return HttpResponse.json(entrepots.filter(paysFilter(pays)))
  }),

  http.get('/api/entrepots/:id', async ({ params }) => {
    await lag()
    const entrepot = entrepots.find((e) => e.id === params.id)
    if (!entrepot) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(entrepot)
  }),

  http.get('/api/entrepots/:id/mesures', async ({ params, request }) => {
    await lag()
    const periode = (new URL(request.url).searchParams.get('periode') ?? '24h') as Periode
    const hours = PERIOD_HOURS[periode] ?? PERIOD_HOURS['24h']
    const cutoff = Date.now() - hours * 60 * 60 * 1000
    const series = measuresByWarehouse.get(String(params.id)) ?? []
    return HttpResponse.json(series.filter((m) => new Date(m.timestamp).getTime() >= cutoff))
  }),

  http.get('/api/alertes', async ({ request }) => {
    await lag()
    const url = new URL(request.url)
    const pays = url.searchParams.get('pays')
    const traitee = url.searchParams.get('traitee')
    return HttpResponse.json(
      alertes
        .filter(paysFilter(pays))
        .filter((a) => (traitee == null ? true : String(a.traitee) === traitee)),
    )
  }),

  http.post('/api/alertes/:id/traiter', async ({ params }) => {
    await delay(250)
    const alerte = alertes.find((a) => a.id === params.id)
    if (!alerte) return new HttpResponse(null, { status: 404 })
    alerte.traitee = true
    return HttpResponse.json(alerte)
  }),
]
