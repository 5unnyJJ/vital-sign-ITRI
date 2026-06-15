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

    <!-- 個案資訊列 -->
    <div class="hf-info-bar">
      <div class="hf-info-item" v-for="item in patientInfoItems" :key="item.label">
        <div class="hf-info-label">{{ item.label }}</div>
        <div class="hf-info-value">{{ item.value }}</div>
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

    <!-- 每日綜合生理資訊 -->
    <div class="det-stats-card">
      <div class="det-stats-head">每日綜合生理資訊</div>
      <div v-html="dailySummaryHtml"></div>
    </div>

    <!-- 明細量測紀錄 -->
    <div class="det-stats-card">
      <div class="det-stats-head">明細量測紀錄</div>
      <div v-html="detailRecordsHtml"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { trendSVG, initCursorDragNodes, initAvgDragNodes } from '@/utils/chart.js'
import { useHfStore } from '@/stores/hf.js'
import { HF_MOCK_PATIENTS, HF_MOCK_VITALS, HF_MOCK_IO } from '@/data/hfMock.js'

const route = useRoute()
const router = useRouter()
const hfStore = useHfStore()
const chartBodyRef = ref(null)

const patientId = computed(() => route.params.id)

const patient = computed(() => {
  const cache = hfStore.hfMembersCache
  const list = (Array.isArray(cache) ? cache : [])
  const found = list.find(p => p.id === patientId.value)
  return found || HF_MOCK_PATIENTS.find(p => p.id === patientId.value) || null
})

const patientName = computed(() => patient.value?.name || patient.value?.alias || '—')
const patientSub = computed(() => {
  if (!patient.value) return '—'
  return `${patient.value.room} · ${patient.value.ward}`
})

const patientInfoItems = computed(() => {
  const p = patient.value
  if (!p) return []
  return [
    { label: '病歷號',   value: p.chartNo || '—' },
    { label: '姓名',     value: p.name || p.alias || '—' },
    { label: '性別',     value: p.gender || '—' },
    { label: '年齡',     value: p.age ? `${p.age} 歲` : '—' },
    { label: '個案狀態', value: p.status || '—' },
  ]
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

// IO data
const currentIoRows = ref([])

// 每日綜合生理資訊
const dailySummaryHtml = computed(() => buildDailySummary(currentIoRows.value))

function buildDailySummary(ioRows) {
  if (!ioRows || !ioRows.length) return '<div class="trend-empty">無生理資訊紀錄</div>'
  const sorted = [...ioRows].sort((a, b) => b.ts.localeCompare(a.ts))
  const byDay = {}
  sorted.forEach(r => {
    const d = r.ts.slice(0, 10)
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(r)
  })
  const days = Object.keys(byDay).sort((a, b) => b.localeCompare(a)).slice(0, 5)
  let html = '<table class="hf-daily-table"><thead><tr>'
    + '<th>量測日期</th>'
    + '<th>當日點滴量 (cc)</th>'
    + '<th>當日總攝入量_含點滴 (g)</th>'
    + '<th>當日小便次數 (次)</th>'
    + '<th>當日總尿量 (g)</th>'
    + '<th>當日排便次數 (次)</th>'
    + '<th>當日總排便量 (g)</th>'
    + '</tr></thead><tbody>'
  days.forEach(day => {
    const recs = byDay[day]
    const drip    = recs.filter(r => r.type === '點滴').reduce((s, r) => s + r.value, 0)
    const intake  = recs.filter(r => r.type === '飯前' || r.type === '點滴').reduce((s, r) => s + r.value, 0)
    const urineN  = recs.filter(r => r.type === '小便').length
    const urineV  = recs.filter(r => r.type === '小便').reduce((s, r) => s + r.value, 0)
    const stoolN  = recs.filter(r => r.type === '大便').length
    const stoolV  = recs.filter(r => r.type === '大便').reduce((s, r) => s + r.value, 0)
    html += `<tr>`
      + `<td>${day}</td>`
      + `<td>${drip}</td>`
      + `<td>${intake % 1 === 0 ? intake : intake.toFixed(1)}</td>`
      + `<td>${urineN}</td>`
      + `<td>${urineV}</td>`
      + `<td>${stoolN}</td>`
      + `<td>${stoolV}</td>`
      + `</tr>`
  })
  html += '</tbody></table>'
  return html
}

// 明細量測紀錄
const detailRecordsHtml = computed(() => buildDetailRecords(currentIoRows.value))

const _TYPE_CLASS = { '飯前': 'hf-type-meal', '小便': 'hf-type-urine', '大便': 'hf-type-stool', '點滴': 'hf-type-drip' }

function buildDetailRecords(ioRows) {
  if (!ioRows || !ioRows.length) return '<div class="trend-empty">無量測紀錄</div>'
  const sorted = [...ioRows].sort((a, b) => b.ts.localeCompare(a.ts))
  let html = '<table class="hf-detail-table"><thead><tr>'
    + '<th>日期</th><th>時間</th><th>量測類型</th><th>量測數值</th>'
    + '</tr></thead><tbody>'
  sorted.forEach(r => {
    const cls = _TYPE_CLASS[r.type] || ''
    const valStr = Number.isInteger(r.value) ? `${r.value} ${r.unit}` : `${r.value.toFixed(1)} ${r.unit}`
    html += `<tr>`
      + `<td>${r.ts.slice(0, 10)}</td>`
      + `<td>${r.ts.slice(11, 16)}</td>`
      + `<td><span class="hf-type-badge ${cls}">${r.type}</span></td>`
      + `<td>${valStr}</td>`
      + `</tr>`
  })
  html += '</tbody></table>'
  return html
}

async function loadDetail(id) {
  if (!id) return
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
    if (metrics.size === 1) return
    metrics.delete(m)
  } else {
    metrics.add(m)
  }
  nextTick(() => {
    initCursorDragNodes()
    initAvgDragNodes()
  })
}

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
  max-width: 1200px;
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

/* 個案資訊列 */
.hf-info-bar {
  display: flex;
  gap: 0;
  background: linear-gradient(180deg, rgba(255,255,255,.92), rgba(249,252,250,.84));
  border: 1px solid var(--glass-line);
  border-radius: var(--r-xl);
  box-shadow: 0 4px 16px rgba(66,98,81,.06);
  overflow: hidden;
}

.hf-info-item {
  flex: 1;
  padding: 14px 20px;
  border-right: 1px solid var(--border-light);
}

.hf-info-item:last-child {
  border-right: none;
}

.hf-info-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: .5px;
  margin-bottom: 5px;
}

.hf-info-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

/* Chart card */
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

/* Stats cards */
.det-stats-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, .92), rgba(249, 252, 250, .84));
  border: 1px solid var(--glass-line);
  border-radius: var(--r-xl);
  box-shadow: 0 12px 34px rgba(66, 98, 81, .08);
  backdrop-filter: blur(10px);
  padding: 20px 24px;
  overflow-x: auto;
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

/* 每日綜合生理資訊表格 */
:deep(.hf-daily-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 640px;
}

:deep(.hf-daily-table th) {
  text-align: left;
  padding: 8px 10px;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 600;
  border-bottom: 2px solid var(--border-light);
  white-space: nowrap;
}

:deep(.hf-daily-table td) {
  padding: 10px 10px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text);
  font-size: 13px;
}

:deep(.hf-daily-table tbody tr:last-child td) {
  border-bottom: none;
}

:deep(.hf-daily-table tbody tr:hover td) {
  background: var(--mint-xlight);
}

/* 明細量測紀錄表格 */
:deep(.hf-detail-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 400px;
}

:deep(.hf-detail-table th) {
  text-align: left;
  padding: 8px 10px;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 600;
  border-bottom: 2px solid var(--border-light);
}

:deep(.hf-detail-table td) {
  padding: 9px 10px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text);
  font-size: 13px;
}

:deep(.hf-detail-table tbody tr:last-child td) {
  border-bottom: none;
}

:deep(.hf-detail-table tbody tr:hover td) {
  background: var(--mint-xlight);
}

/* 類型 badge */
:deep(.hf-type-badge) {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}

:deep(.hf-type-meal)  { background: #e07b39; }
:deep(.hf-type-urine) { background: #c9a400; }
:deep(.hf-type-stool) { background: #6b4a2a; }
:deep(.hf-type-drip)  { background: #2d7ed4; }

@media (max-width: 600px) {
  .det-main {
    padding: 16px 12px 60px;
  }

  .hf-info-bar {
    flex-wrap: wrap;
  }

  .hf-info-item {
    flex: 1 1 45%;
    border-right: none;
    border-bottom: 1px solid var(--border-light);
  }
}
</style>
