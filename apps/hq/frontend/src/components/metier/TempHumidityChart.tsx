import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import type { ChartData, ChartOptions, Plugin } from 'chart.js'
import type { AnnotationOptions } from 'chartjs-plugin-annotation'
import { ensureChartsRegistered } from '@/lib/chartSetup'
import { isHumidityOutOfRange, isTempOutOfRange } from '@/lib/conditions'
import type { Country } from '@/lib/countries'
import type { Mesure } from '@/api/types'
import { useTheme } from '@/hooks/theme-context'
import './TempHumidityChart.css'

ensureChartsRegistered()

/** Vertical crosshair drawn at the active tooltip position. */
const crosshair: Plugin<'line'> = {
  id: 'fkCrosshair',
  afterDraw(chart) {
    const active = chart.tooltip?.getActiveElements?.() ?? []
    if (active.length === 0) return
    const { ctx, chartArea } = chart
    const x = active[0].element.x
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x, chartArea.top)
    ctx.lineTo(x, chartArea.bottom)
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.strokeStyle = chart.options.color as string
    ctx.stroke()
    ctx.restore()
  },
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const SUSTAINED_READINGS = 6

/** Start timestamps of *sustained* drift episodes (≥6 consecutive out-of-range). */
function driftStarts(mesures: Mesure[], country: Country): number[] {
  const starts: number[] = []
  let runStart = -1
  let counted = false
  for (let i = 0; i < mesures.length; i++) {
    const m = mesures[i]
    const out = isTempOutOfRange(m.temp, country) || isHumidityOutOfRange(m.humidity, country)
    if (out) {
      if (runStart < 0) {
        runStart = i
        counted = false
      }
      if (!counted && i - runStart + 1 >= SUSTAINED_READINGS) {
        starts.push(new Date(mesures[runStart].timestamp).getTime())
        counted = true
      }
    } else {
      runStart = -1
      counted = false
    }
  }
  return starts.slice(0, 4)
}

export interface TempHumidityChartProps {
  mesures: Mesure[]
  country: Country
  height?: number
}

export function TempHumidityChart({ mesures, country, height = 340 }: TempHumidityChartProps) {
  const { theme } = useTheme()

  // `theme` is listed in the memo deps below so colours refresh on theme change.
  const { data, options } = useMemo(() => {
    const c = {
      temp: cssVar('--fk-chart-temp'),
      hum: cssVar('--fk-chart-hum'),
      band: cssVar('--fk-chart-band'),
      bandLine: cssVar('--fk-chart-band-line'),
      pointOut: cssVar('--fk-chart-point-out'),
      pointStroke: cssVar('--fk-chart-point-stroke'),
      axis: cssVar('--fk-chart-axis'),
      axisLabel: cssVar('--fk-chart-axis-label'),
      alert: cssVar('--fk-alert'),
      surface: cssVar('--fk-surface'),
      text: cssVar('--fk-text'),
      border: cssVar('--fk-border'),
      // Dark, opaque tooltip (same in both themes) so it never blends into the band.
      tooltipBg: cssVar('--fk-log-bg'),
      tooltipTitle: cssVar('--fk-log-meta'),
      tooltipBody: cssVar('--fk-log-value'),
    }

    const points = mesures.map((m) => new Date(m.timestamp).getTime())
    const spanDays = points.length > 1 ? (points.at(-1)! - points[0]) / 86_400_000 : 1

    const tempOut = (i: number) => isTempOutOfRange(mesures[i].temp, country)
    const humOut = (i: number) => isHumidityOutOfRange(mesures[i].humidity, country)

    const annotations: Record<string, AnnotationOptions> = {
      humMax: {
        type: 'line',
        yScaleID: 'yHum',
        yMin: country.ideal.humidity + country.tolerance.humidity,
        yMax: country.ideal.humidity + country.tolerance.humidity,
        borderColor: c.bandLine,
        borderWidth: 1,
        borderDash: [2, 4],
      },
      humMin: {
        type: 'line',
        yScaleID: 'yHum',
        yMin: country.ideal.humidity - country.tolerance.humidity,
        yMax: country.ideal.humidity - country.tolerance.humidity,
        borderColor: c.bandLine,
        borderWidth: 1,
        borderDash: [2, 4],
      },
    }
    driftStarts(mesures, country).forEach((ts, i) => {
      annotations[`alert${i}`] = {
        type: 'line',
        xScaleID: 'x',
        xMin: ts,
        xMax: ts,
        borderColor: c.alert,
        borderWidth: 1.5,
        borderDash: [4, 4],
      }
    })

    const chartData: ChartData<'line'> = {
      datasets: [
        {
          label: 'Température (°C)',
          yAxisID: 'yTemp',
          data: mesures.map((m, i) => ({ x: points[i], y: m.temp })),
          borderColor: c.temp,
          borderWidth: 2.4,
          tension: 0.25,
          pointRadius: (ctx) => (tempOut(ctx.dataIndex) ? 4.5 : 0),
          pointHoverRadius: 5,
          pointBackgroundColor: (ctx) => (tempOut(ctx.dataIndex) ? c.pointOut : c.temp),
          pointBorderColor: c.pointStroke,
          pointBorderWidth: 2,
        },
        {
          label: 'Humidité (%)',
          yAxisID: 'yHum',
          data: mesures.map((m, i) => ({ x: points[i], y: m.humidity })),
          borderColor: c.hum,
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.25,
          pointRadius: (ctx) => (humOut(ctx.dataIndex) ? 4.5 : 0),
          pointHoverRadius: 5,
          pointBackgroundColor: (ctx) => (humOut(ctx.dataIndex) ? c.pointOut : c.hum),
          pointBorderColor: c.pointStroke,
          pointBorderWidth: 2,
        },
      ],
    }

    const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' })
    const fullFmt = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

    const chartOptions: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      color: c.axisLabel,
      interaction: { mode: 'index', intersect: false },
      font: { family: "'IBM Plex Mono', monospace" },
      scales: {
        x: {
          type: 'linear',
          grid: { color: c.border, drawTicks: false },
          border: { color: c.axis },
          ticks: {
            color: c.axisLabel,
            font: { family: "'IBM Plex Mono', monospace", size: 10 },
            maxTicksLimit: 8,
            callback: (value) =>
              spanDays <= 2 ? timeFmt.format(Number(value)) : dateFmt.format(Number(value)),
          },
        },
        yTemp: {
          type: 'linear',
          position: 'left',
          grid: { color: c.border },
          border: { color: c.axis },
          ticks: {
            color: c.axisLabel,
            font: { family: "'IBM Plex Mono', monospace", size: 10 },
            callback: (v) => `${v}°`,
          },
        },
        yHum: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          border: { color: c.axis },
          ticks: {
            color: c.axisLabel,
            font: { family: "'IBM Plex Mono', monospace", size: 10 },
            callback: (v) => `${v}%`,
          },
        },
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: c.text,
            usePointStyle: true,
            pointStyle: 'line',
            font: { family: "'Archivo', sans-serif", size: 12 },
            boxWidth: 24,
          },
        },
        tooltip: {
          backgroundColor: c.tooltipBg,
          borderWidth: 0,
          titleColor: c.tooltipTitle,
          bodyColor: c.tooltipBody,
          padding: 10,
          cornerRadius: 8,
          caretPadding: 8,
          titleFont: { family: "'IBM Plex Mono', monospace", size: 11, weight: 'normal' },
          bodyFont: { family: "'IBM Plex Mono', monospace", size: 13 },
          displayColors: true,
          usePointStyle: true,
          callbacks: {
            title: (items) => fullFmt.format(Number(items[0].parsed.x)),
            label: (item) => {
              const unit = item.datasetIndex === 0 ? '°C' : '%'
              return `  ${item.dataset.label?.split(' ')[0]}: ${item.parsed.y}${unit}`
            },
          },
        },
        annotation: { annotations },
      },
    }

    return { data: chartData, options: chartOptions }
    // `theme` triggers the recompute so CSS-var colours refresh on theme change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesures, country, theme])

  return (
    <div className="fk-thchart" style={{ height }}>
      <Line data={data} options={options} plugins={[crosshair]} />
    </div>
  )
}
