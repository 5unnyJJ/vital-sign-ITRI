<template>
  <div class="det-main screen-shell">
    <!-- Header -->
    <div class="det-header">
      <button class="btn-back" @click="router.push('/hf')" aria-label="返回心衰總覽">← 返回</button>
      <div class="det-member-info">
        <div class="det-member-id">{{ patientName }}</div>
        <div class="det-member-sub">{{ patientSub }}</div>
      </div>
    </div>

    <!-- 生理趨勢圖 -->
    <div class="det-chart-card">
      <div class="det-chart-ctrl">
        <div class="det-metric-tabs">
          <button
            class="det-metric-btn"
            :class="{ active: hfStore.hfMetrics.has('bp') }"
            @click="toggleMetric('bp')"
          >🩺 血壓</button>
          <button
            class="det-metric-btn"
            :class="{ active: hfStore.hfMetrics.has('temp') }"
            @click="toggleMetric('temp')"
          >🌡 額溫</button>
        </div>
        <span style="font-size:11px;color:var(--text-dim);margin-left:auto">近 7 天</span>
      </div>
      <div class="det-chart-body" v-html="chartHtml" ref="chartBodyRef"></div>
    </div>

    <!-- 攝入排出表 -->
    <div class="det-stats-card">
      <div class="det-stats-head">💧 攝入排出記錄（近 5 天）</div>
      <div v-html="ioTableHtml"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { trendSVG, initCursorDragNodes, initAvgDragNodes } from '@/utils/chart.js'
import { useHfStore } from '@/stores/hf.js'
import { escHtml } from '@/utils/format.js'
import { HF_MOCK_PATIENTS, HF_MOCK_VITALS, HF_MOCK_IO } from '@/data/hfMock.js'

const route = useRoute()
const router = useRouter()
const hfStore = useHfStore()
const chartBodyRef = ref(null)

const patientId = computed(() => route.params.id)

// Find patient info
const patient = computed(() => {
  const cache = hfStore.hfMembersCache
  const list = (Array.isArray(cache) ? cache : [])
  const found = list.find(p => p.id === patientId.value)
  return found || HF_MOCK_PATIENTS.find(p => p.id === patientId.value) || null
})

const patientName = computed(() => patient.value?.alias || '—')
const patientSub = computed(() => {
  if (!patient.value) return '—'
  return `${patient.value.room} · ${patient.value.ward} · ${patient.value.age}歲`
})

// Chart
const chartHtml = computed(() => {
  const vitals = hfStore.hfVitalsCache
  if (!vitals || !vitals.length) return '<div class="trend-empty">載入中…</div>'
  return buildChartHtml(vitals)
})

function buildChartHtml(vitals) {
  const sorted = [...vitals].sort((a, b) => a.ts.localeCompare(b.ts))
  const labels = sorted.map(r => r.ts.slice(5, 10) + ' ' + r.ts.slice(11, 16))
  const metrics = hfStore.hfMetrics
  const series = [
    ...(metrics.has('bp') ? [
      { label: '收縮壓 mmHg', color: '#b85450', values: sorted.map(r => r.sbp) },
      { label: '舒張壓 mmHg', color: '#bf7a45', values: sorted.map(r => r.dbp) },
    ] : []),
    ...(metrics.has('temp') ? [
      { label: '額溫 °C', color: '#e07b39', values: sorted.map(r => r.temp) },
    ] : []),
  ]
  if (!series.length) return '<div class="trend-empty">請至少勾選一項指標</div>'
  return trendSVG(
    series,
    labels,
    { sharedCursor: true, minRange: metrics.has('bp') && !metrics.has('temp') ? 30 : 0 },
    280
  )
}

// IO table
const ioTableHtml = computed(() => {
  const ioRows = hfStore.hfVitalsCache ? (currentIoRows.value || []) : []
  return buildIoTable(ioRows)
})

const currentIoRows = ref([])

function buildIoTable(ioRows) {
  if (!ioRows || !ioRows.length) return '<div class="trend-empty">無攝入排出記錄</div>'
  const sorted = [...ioRows].sort((a, b) => b.ts.localeCompare(a.ts))
  const byDay = {}
  sorted.forEach(r => {
    const d = r.ts.slice(0, 10)
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(r)
  })
  const days = Object.keys(byDay).sort((a, b) => b.localeCompare(a)).slice(0, 5)
  let rows = '<table class="hf-io-table"><thead><tr><th>時間</th><th>類型</th><th>量（ml）</th><th>備註</th></tr></thead><tbody>'
  days.forEach(day => {
    const dayRecs = byDay[day]
    const totalIn = dayRecs.filter(r => r.type === 'intake').reduce((s, r) => s + r.amount, 0)
    const totalOut = dayRecs.filter(r => r.type === 'output').reduce((s, r) => s + r.amount, 0)
    const mm = day.slice(5, 7), dd = day.slice(8, 10)
    rows += `<tr class="hf-io-day-group"><td colspan="4">${mm}/${dd}</td></tr>`
    dayRecs.forEach(r => {
      const typeLabel = r.type === 'intake' ? '攝入' : '排出'
      const cls = r.type === 'intake' ? 'hf-io-intake' : 'hf-io-output'
      rows += `<tr><td>${r.ts.slice(11, 16)}</td><td class="${cls}">${typeLabel}</td><td>${r.amount}</td><td>${escHtml(r.note || '')}</td></tr>`
    })
    rows += `<tr class="hf-io-subtotal"><td colspan="2">小計</td><td>攝入 ${totalIn} ml / 排出 ${totalOut} ml</td><td></td></tr>`
  })
  rows += '</tbody></table>'
  return rows
}

async function loadDetail(id) {
  if (!id) return
  // Fetch vitals & IO (mock or real)
  let vitals = [], io = []
  if (!hfStore.HF_API_CONNECTED) {
    vitals = HF_MOCK_VITALS[id] || []
    io = HF_MOCK_IO[id] || []
  }
  hfStore.hfVitalsCache = vitals
  currentIoRows.value = io

  await nextTick()
  initCursorDragNodes()
  initAvgDragNodes()
}

function toggleMetric(m) {
  const metrics = hfStore.hfMetrics
  if (metrics.has(m)) {
    if (metrics.size === 1) return // always keep at least one
    metrics.delete(m)
  } else {
    metrics.add(m)
  }
  // Trigger chart re-render via nextTick
  nextTick(() => {
    initCursorDragNodes()
    initAvgDragNodes()
  })
}

// Re-init drag nodes whenever chart HTML updates
watch(chartHtml, async () => {
  await nextTick()
  initCursorDragNodes()
  initAvgDragNodes()
})

onMounted(() => {
  loadDetail(patientId.value)
})

watch(patientId, (id) => {
  if (id) loadDetail(id)
})
</script>

<style scoped>
.screen-shell {
  position: relative;
}

.det-main {
  padding: 24px 32px;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.det-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--r-md);
  color: var(--text-mid);
  font-size: 14px;
  font-weight: 600;
  transition: all .15s;
  cursor: pointer;
}

.btn-back:hover {
  border-color: var(--mint);
  color: var(--mint-dark);
  background: var(--mint-xlight);
}

.det-member-info {
  flex: 1;
}

.det-member-id {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -.3px;
}

.det-member-sub {
  font-size: 13px;
  color: var(--text-dim);
  margin-top: 2px;
}

.det-chart-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, .92), rgba(249, 252, 250, .84));
  border: 1px solid var(--glass-line);
  border-radius: var(--r-xl);
  box-shadow: 0 12px 34px rgba(66, 98, 81, .08);
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.det-chart-ctrl {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 22px 12px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--border-light);
}

.det-metric-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.det-metric-btn {
  padding: 7px 16px;
  border-radius: 20px;
  background: var(--bg-alt);
  border: 1.5px solid var(--border);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dim);
  transition: all .13s;
  cursor: pointer;
}

.det-metric-btn:hover {
  border-color: var(--mint);
  color: var(--mint-dark);
}

.det-metric-btn.active {
  background: var(--mint);
  border-color: var(--mint);
  color: #fff;
}

.det-chart-body {
  padding: 18px 22px 22px;
  min-height: 200px;
}

.det-stats-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, .92), rgba(249, 252, 250, .84));
  border: 1px solid var(--glass-line);
  border-radius: var(--r-xl);
  box-shadow: 0 12px 34px rgba(66, 98, 81, .08);
  backdrop-filter: blur(10px);
  padding: 20px 24px;
}

.det-stats-head {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: .6px;
  margin-bottom: 14px;
}

.trend-empty {
  text-align: center;
  padding: 40px 0;
  color: var(--text-dim);
  font-size: 14px;
}

/* IO table styles (not scoped — injected via v-html, use :deep) */
:deep(.hf-io-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

:deep(.hf-io-table th) {
  text-align: left;
  padding: 6px 8px;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 600;
  border-bottom: 2px solid var(--border-light);
}

:deep(.hf-io-table td) {
  padding: 7px 8px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text);
}

:deep(.hf-io-table tr:last-child td) {
  border-bottom: none;
}

:deep(.hf-io-intake) {
  color: var(--green);
  font-weight: 600;
}

:deep(.hf-io-output) {
  color: var(--red);
  font-weight: 600;
}

:deep(.hf-io-day-group td) {
  background: var(--bg-alt);
  font-weight: 600;
  font-size: 12px;
  color: var(--text-mid);
}

:deep(.hf-io-subtotal) {
  background: var(--mint-xlight) !important;
  font-size: 12px;
  color: var(--mint-dark) !important;
  font-weight: 700 !important;
}

@media (max-width: 600px) {
  .det-main {
    padding: 16px 12px 60px;
  }
}
</style>
