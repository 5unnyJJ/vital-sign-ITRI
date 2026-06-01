<template>
  <div class="det-main screen-shell">
    <!-- Decorative images -->
    <div class="screen-decor decor-det-1"><img :src="base + 'images/Snipaste_2026-04-08_17-10-07_nobg.png'" alt="" loading="lazy"></div>
    <div class="screen-decor decor-det-2"><img :src="base + 'images/Snipaste_2026-04-08_17-08-21_nobg.png'" alt="" loading="lazy"></div>
    <div class="screen-decor decor-det-3"><img :src="base + 'images/Snipaste_2026-04-08_17-09-49_nobg.png'" alt="" loading="lazy"></div>
    <div class="screen-decor decor-det-4"><img :src="base + 'images/Snipaste_2026-04-08_17-10-17_nobg.png'" alt="" loading="lazy"></div>

    <!-- Header -->
    <div class="det-header">
      <button class="btn-back" @click="router.push('/overview')" aria-label="返回總覽">← 返回總覽</button>
      <div class="det-member-info">
        <div class="det-member-id">{{ memberId }}</div>
        <div class="det-member-sub">{{ tableLabel }}</div>
      </div>
      <button class="btn-sync-day" :disabled="syncing" @click="syncDayData">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" :style="syncing ? 'animation:det-spin .7s linear infinite' : ''">
          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        {{ syncing ? '同步中' : '同步資料' }}
      </button>
      <button class="btn-export" @click="exportCSV">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        匯出 CSV
      </button>
    </div>

    <!-- Chart card -->
    <div class="det-chart-card">
      <div class="det-chart-ctrl">
        <div class="det-metric-tabs">
          <button class="det-metric-btn" :class="{ active: detailMetrics.has('hb') }" @click="toggleMetric('hb')">❤️ 心跳</button>
          <button class="det-metric-btn" :class="{ active: detailMetrics.has('bp') }" @click="toggleMetric('bp')">🩺 血壓</button>
          <button class="det-metric-btn" :class="{ active: detailMetrics.has('temp') }" @click="toggleMetric('temp')">🌡 體溫</button>
          <button class="det-metric-btn" :class="{ active: detailMetrics.has('br') }" @click="toggleMetric('br')">🫁 呼吸</button>
        </div>
        <div class="det-range-tabs">
          <button class="det-range-btn" :class="{ active: detailRange === 'today' }" @click="setRange('today')">今天</button>
          <button class="det-range-btn" :class="{ active: detailRange === '7d' }" @click="setRange('7d')">7 天</button>
          <button class="det-range-btn" :class="{ active: detailRange === '30d' }" @click="setRange('30d')">30 天</button>
          <div class="det-date-pick-wrap">
            <button class="det-range-btn date-pick-btn" :class="{ active: detailRange === 'custom' }" @click="openDatePicker">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>{{ customDateLabel }}</span>
            </button>
            <input ref="datePickerRef" type="date" class="det-date-input" @change="setCustomDate($event.target.value)">
          </div>
        </div>
      </div>
      <!-- Chart body -->
      <div class="det-chart-body">
        <div v-if="chartLoading" class="det-loading">
          <div class="det-spinner"></div>
          <div class="det-loading-text">📡 載入資料中…</div>
        </div>
        <div v-else-if="chartHtml" v-html="chartHtml"></div>
        <div v-else class="trend-empty">{{ chartEmptyMsg }}</div>
      </div>
    </div>

    <!-- Stats summary -->
    <div class="det-stats-card">
      <div class="det-stats-head">{{ statsHead }}</div>
      <div class="det-stats-grid" v-html="statsHtml || '<div class=\'det-stat-box\'><div class=\'det-stat-label\'>載入中</div><div class=\'det-stat-val\' style=\'color:var(--text-light)\'>…</div></div>'"></div>
    </div>

    <!-- 4 Action buttons -->
    <div class="det-actions">
      <button class="det-action-btn" @click="router.push('/dashboard')">
        <span class="det-action-icon">📅</span>
        <span class="det-action-label">日視圖</span>
        <span class="det-action-sub">查看逐小時紀錄</span>
      </button>
      <button class="det-action-btn" @click="goDashboardMonth">
        <span class="det-action-icon">📆</span>
        <span class="det-action-label">月視圖</span>
        <span class="det-action-sub">查看月份趨勢</span>
      </button>
      <button class="det-action-btn" @click="router.push('/posture')">
        <span class="det-action-icon">🧘</span>
        <span class="det-action-label">動作姿態統計</span>
        <span class="det-action-sub">查看姿態分析</span>
      </button>
      <button class="det-action-btn" @click="exportCSV">
        <span class="det-action-icon">📋</span>
        <span class="det-action-label">匯出資料</span>
        <span class="det-action-sub">下載 CSV 檔案</span>
      </button>
    </div>

    <!-- Notes / Annotations card -->
    <div class="det-notes-card">
      <div class="det-notes-head">
        <span class="det-notes-title">📝 醫護回報紀錄</span>
        <!-- TODO: implement openAnnotPanel() -->
      </div>
      <!-- Annotation list -->
      <div v-if="annotLoading" class="annot-empty" style="padding:20px 0 8px;">讀取回報中…</div>
      <div v-else-if="annotError" class="annot-empty" style="padding:20px 0 8px;">
        讀取失敗<br><small>{{ annotError }}</small>
      </div>
      <div v-else-if="!annotations.length" class="annot-empty" style="padding:20px 0 8px;">
        尚無回報紀錄<br><small>點擊「新增回報」以新增</small>
      </div>
      <div v-else>
        <div v-for="a in annotations" :key="a.id" class="annot-card">
          <div class="annot-card-head">
            <div class="annot-card-meta">
              <span class="annot-card-time">📅 {{ a.date }} {{ a.time }}</span>
              <span class="annot-card-cat" :class="annotCatClass(a.category)">{{ a.category }}</span>
            </div>
          </div>
          <div class="annot-card-text">{{ a.text }}</div>
        </div>
      </div>
      <div class="note-hint">回報紀錄會同步到雲端，供後續查詢與交班使用。</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNavStore } from '@/stores/nav.js'
import { useDetailStore } from '@/stores/detail.js'
import { useDashboardStore } from '@/stores/dashboard.js'
import { sb, TABLE_LABELS } from '@/lib/supabase.js'
import { trendSVG, initCursorDragNodes, initAvgDragNodes } from '@/utils/chart.js'
import { avg, stdOf, anomalyLevel, filterWarmupMinutes, aggregateToMinutes } from '@/utils/math.js'
import { p2, todayStr, monthStr } from '@/utils/format.js'

const route = useRoute()
const router = useRouter()
const navStore = useNavStore()
const detailStore = useDetailStore()
const dashStore = useDashboardStore()

const base = import.meta.env.BASE_URL

// ── Local state ────────────────────────────────────────────
const memberId = computed(() => route.params.id || '')
const tableLabel = computed(() => TABLE_LABELS[navStore.currentTable] || navStore.currentTable || '')

const detailMetrics = ref(new Set(['hb', 'bp', 'temp', 'br']))
const detailRange = ref('today')
const detailRawData = ref(null)
const detailDailySummary = ref({})
const customDateLabel = ref('選日期')
const datePickerRef = ref(null)
const currentDate = ref(todayStr())

const chartLoading = ref(false)
const chartHtml = ref('')
const chartEmptyMsg = ref('選擇會員後自動載入')

const statsHead = ref('今日數值摘要')
const statsHtml = ref('')

const syncing = ref(false)

// Annotations
const annotations = ref([])
const annotLoading = ref(false)
const annotError = ref('')

// ── Helpers ────────────────────────────────────────────────
function p2l(n) { return String(n).padStart(2, '0') }
function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') }

function buildSeries(source, mode) {
  const s = []
  if (detailMetrics.value.has('hb')) s.push({ label: mode === 'daily' ? '心跳 avg' : '心跳 bpm', color: '#7aaa96', values: source.map(r => mode === 'daily' ? (r?.avgHb ?? null) : (r?.heartbeat ?? null)) })
  if (detailMetrics.value.has('bp')) {
    s.push({ label: mode === 'daily' ? '收縮壓' : '收縮壓 mmHg', color: '#b85450', values: source.map(r => mode === 'daily' ? (r?.avgSbp ?? null) : (r?.sbp ?? null)) })
    s.push({ label: mode === 'daily' ? '舒張壓' : '舒張壓 mmHg', color: '#bf7a45', values: source.map(r => mode === 'daily' ? (r?.avgDbp ?? null) : (r?.dbp ?? null)) })
  }
  if (detailMetrics.value.has('temp')) s.push({ label: mode === 'daily' ? '體溫 avg' : '體溫 °C', color: '#e07b39', values: source.map(r => mode === 'daily' ? (r?.avgTemp ?? null) : (r?.temp ?? null)) })
  if (detailMetrics.value.has('br')) s.push({ label: mode === 'daily' ? '呼吸 avg' : '呼吸 rpm', color: '#6f8fcb', values: source.map(r => mode === 'daily' ? (r?.avgBr ?? null) : (r?.breath ?? null)) })
  return s
}

function renderChart(series, labels, actionValues = null) {
  if (!series.length) { chartHtml.value = ''; chartEmptyMsg.value = '請至少勾選一項指標'; return }
  let minRange = 0
  if (series.every(s => s.label.includes('心跳'))) minRange = 60
  else if (series.every(s => s.label.includes('呼吸'))) minRange = 20
  else if (series.every(s => s.label.includes('體溫'))) minRange = 2
  chartHtml.value = trendSVG(series, labels, { sharedCursor: true, actionValues, minRange }, 300)
  nextTick(() => {
    initCursorDragNodes()
    initAvgDragNodes()
  })
}

async function getDetailMemberRawRows() {
  const table = navStore.currentTable
  const mid = memberId.value
  if (!table || !mid) return []
  const start = currentDate.value + 'T00:00:00', end = currentDate.value + 'T23:59:59.999'
  let all = [], pg = 0, ps = 1000
  while (true) {
    const { data, error } = await sb.from(table)
      .select('date_minute,heartbeat,temp,breath,sbp,dbp,pulse,step,action,member_id')
      .gte('date_minute', start).lte('date_minute', end)
      .eq('member_id', mid)
      .order('date_minute', { ascending: true }).range(pg * ps, (pg + 1) * ps - 1)
    if (error || !data || !data.length) break
    all = all.concat(data); pg++
  }
  return all
}

async function loadDetailChart() {
  const table = navStore.currentTable
  const mid = memberId.value
  if (!table || !mid) return

  chartLoading.value = true
  chartHtml.value = ''
  chartEmptyMsg.value = ''

  try {
    if (detailRange.value === 'today') {
      if (!detailRawData.value) {
        detailRawData.value = await getDetailMemberRawRows()
      }
      const memberMinutes = filterWarmupMinutes(aggregateToMinutes(detailRawData.value))
      if (!memberMinutes.length) { chartEmptyMsg.value = '今日尚無資料'; chartLoading.value = false; return }
      renderChart(buildSeries(memberMinutes, 'raw'), memberMinutes.map(r => r.time.slice(11, 16)), memberMinutes.map(r => r.action))
      chartLoading.value = false
      return
    }

    const days = detailRange.value === '7d' ? 7 : 30
    const today = currentDate.value
    const dayList = Array.from({ length: days }, (_, i) => {
      const d = new Date(today + 'T00:00:00')
      d.setDate(d.getDate() - (days - 1 - i))
      return `${d.getFullYear()}-${p2l(d.getMonth() + 1)}-${p2l(d.getDate())}`
    })

    const missingDays = dayList.filter(ds => detailDailySummary.value[ds] === undefined)
    if (missingDays.length) {
      const batchStart = missingDays[0] + 'T00:00:00'
      const batchEnd = missingDays[missingDays.length - 1] + 'T23:59:59.999'
      const { data: batchData } = await sb.from(table)
        .select('date_minute,heartbeat,temp,sbp,dbp,breath')
        .gte('date_minute', batchStart).lte('date_minute', batchEnd)
        .eq('member_id', mid)
        .order('date_minute', { ascending: true })
        .limit(3000 * missingDays.length)
      const byDay = {}
      ;(batchData || []).forEach(r => { const d = r.date_minute.slice(0, 10); if (!byDay[d]) byDay[d] = []; byDay[d].push(r) })
      missingDays.forEach(ds => {
        const rows = byDay[ds] || []
        detailDailySummary.value[ds] = rows.length ? {
          avgHb: avg(rows.map(r => r.heartbeat)), avgSbp: avg(rows.map(r => r.sbp)),
          avgDbp: avg(rows.map(r => r.dbp)), avgTemp: avg(rows.map(r => r.temp)), avgBr: avg(rows.map(r => r.breath))
        } : null
      })
    }
    const summaryRows = dayList.map(ds => detailDailySummary.value[ds])
    renderChart(buildSeries(summaryRows, 'daily'), dayList.map(ds => `${ds.slice(5, 7)}/${ds.slice(8, 10)}`))
  } catch (err) {
    chartEmptyMsg.value = `載入失敗：${err.message || err}`
  } finally {
    chartLoading.value = false
  }
}

function renderDetailStats(rows) {
  if (!rows || !rows.length) { statsHtml.value = '<div class="det-stat-box"><div class="det-stat-label">今日無資料</div></div>'; return }
  const aHb = avg(rows.map(r => r.heartbeat))
  const stdHb = stdOf(rows.map(r => r.heartbeat).filter(v => v !== null && v !== undefined))
  const aTemp = avg(rows.map(r => r.temp))
  const stdTemp = stdOf(rows.map(r => r.temp).filter(v => v !== null && v !== undefined))
  const aSbp = avg(rows.map(r => r.sbp))
  const aDbp = avg(rows.map(r => r.dbp))
  const aBr = avg(rows.map(r => r.breath))
  const hbNums = rows.map(r => parseFloat(r.heartbeat)).filter(v => !isNaN(v))
  const maxHb = hbNums.length ? Math.max(...hbNums) : null
  const minHb = hbNums.length ? Math.min(...hbNums) : null
  const lvHb = anomalyLevel('heartbeat', aHb)
  const lvSbp = anomalyLevel('sbp', aSbp)
  const lvTemp = anomalyLevel('temp', aTemp)
  const stat = (label, val, sub, level) =>
    `<div class="det-stat-box"><div class="det-stat-label">${label}</div><div class="det-stat-val${level === 'red' ? ' is-red' : ''}">${val}</div>${sub ? `<div class="det-stat-sub">${sub}</div>` : ''}</div>`
  statsHtml.value = [
    aHb !== null ? stat('❤️ 平均心跳', Math.round(aHb) + ' bpm', stdHb !== null ? ` ±${Math.round(stdHb)} | 最高 ${maxHb} / 最低 ${minHb}` : '', lvHb) : '',
    aSbp !== null ? stat('🩺 收縮壓', Math.round(aSbp) + ' mmHg', aDbp !== null ? `舒張壓平均 ${Math.round(aDbp)} mmHg` : '', lvSbp) : '',
    aTemp !== null ? stat('🌡 平均體溫', parseFloat(aTemp).toFixed(1) + '°C', stdTemp !== null ? ` ±${stdTemp}°C` : '', lvTemp) : '',
    aBr !== null ? stat('🫁 平均呼吸', Math.round(aBr) + ' rpm', '') : '',
    stat('📊 今日資料', rows.length + ' 筆', ''),
  ].join('')
}

function updateStatsHead() {
  const r = detailRange.value
  if (r === '7d') { statsHead.value = '近 7 天平均摘要'; return }
  if (r === '30d') { statsHead.value = '近 30 天平均摘要'; return }
  const d = currentDate.value
  statsHead.value = d === todayStr() ? '今日數值摘要' : `${d} 數值摘要`
}

// ── Event handlers ─────────────────────────────────────────
function toggleMetric(m) {
  const s = new Set(detailMetrics.value)
  if (s.has(m)) { if (s.size === 1) return; s.delete(m) } else s.add(m)
  detailMetrics.value = s
  detailRawData.value = null
  loadDetailChart()
}

function setRange(r) {
  detailRange.value = r
  if (r !== 'custom') customDateLabel.value = '選日期'
  if (r === 'today') currentDate.value = todayStr()
  updateStatsHead()
  loadDetailChart().then(() => { if (r === 'today') renderDetailStats(detailRawData.value || []) })
}

function openDatePicker() {
  const inp = datePickerRef.value
  if (!inp) return
  inp.value = currentDate.value
  try { inp.showPicker() } catch { inp.click() }
}

function setCustomDate(dateStr) {
  if (!dateStr) return
  currentDate.value = dateStr
  detailRawData.value = null
  detailDailySummary.value = {}
  detailRange.value = 'custom'
  customDateLabel.value = dateStr.slice(5)
  updateStatsHead()
  loadDetailChart().then(() => renderDetailStats(detailRawData.value || []))
}

async function syncDayData() {
  syncing.value = true
  try {
    detailRawData.value = await getDetailMemberRawRows()
    await loadDetailChart()
    renderDetailStats(detailRawData.value || [])
  } catch (err) {
    console.error('[DetailView] syncDayData error:', err)
  } finally {
    syncing.value = false
  }
}

function exportCSV() {
  const data = detailRawData.value || []
  if (!data.length) { alert('此會員今日尚無資料可匯出'); return }
  const headers = ['時間', '會員ID', '心跳(bpm)', '體溫(°C)', '呼吸(rpm)', '收縮壓(mmHg)', '舒張壓(mmHg)', '脈搏', '步數', '卡路里', '動作']
  const actionMap = { 0: '靜止', 1: '走路', 2: '走路', 3: '慢跑', 4: '慢跑', 5: '快跑', 6: '躺姿', 7: '姿勢異常' }
  const actionLabel = v => v === null || v === undefined ? '' : (actionMap[parseInt(v)] || String(v))
  const rows = data.map(r => [
    r.date_minute || '', r.member_id || '',
    r.heartbeat ?? '', r.temp !== null && r.temp !== undefined ? parseFloat(r.temp).toFixed(1) : '',
    r.breath ?? '', r.sbp ?? '', r.dbp ?? '', r.pulse ?? '', r.step ?? '', r.calorie ?? '',
    actionLabel(r.action)
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `health_${memberId.value}_${todayStr()}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function goDashboardMonth() {
  dashStore.currentMonth = monthStr()
  navStore.currentView = 'month'
  router.push('/dashboard')
}

function annotCatClass(cat) {
  if (cat === '裝置誤判') return 'cat-誤判'
  if (cat === '裝置中斷') return 'cat-中斷'
  return ''
}

async function loadAnnotations() {
  if (!navStore.currentTable || !memberId.value) return
  annotLoading.value = true
  annotError.value = ''
  try {
    const { data, error } = await sb.from('nurse_reports')
      .select('id,created_at,member_id,content,severity,table_name')
      .eq('table_name', navStore.currentTable)
      .eq('member_id', memberId.value)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    annotations.value = (data || []).map(row => {
      const raw = String(row.content || '').trim()
      const m = raw.match(/^\[\[(.+?)\]\]\s*(.*)$/)
      const category = m ? (m[1] || '觀察') : '觀察'
      const text = m ? (m[2] || '') : raw
      const dt = new Date(row.created_at)
      const dateStr = isNaN(dt.getTime()) ? (row.created_at || '').slice(0, 10) : `${dt.getFullYear()}-${p2l(dt.getMonth() + 1)}-${p2l(dt.getDate())}`
      const timeStr = isNaN(dt.getTime()) ? (row.created_at || '').slice(11, 16) : `${p2l(dt.getHours())}:${p2l(dt.getMinutes())}`
      return { id: row.id, date: dateStr, time: timeStr, category, text }
    })
  } catch (err) {
    annotError.value = err.message || String(err)
  } finally {
    annotLoading.value = false
  }
}

// ── Lifecycle ──────────────────────────────────────────────
onMounted(async () => {
  currentDate.value = todayStr()
  detailRange.value = 'today'
  detailMetrics.value = new Set(['hb', 'bp', 'temp', 'br'])
  detailRawData.value = null
  detailDailySummary.value = {}
  customDateLabel.value = '選日期'
  updateStatsHead()

  await loadAnnotations()
  await loadDetailChart()
  if (detailRange.value === 'today') renderDetailStats(detailRawData.value || [])
})

watch(() => route.params.id, async (newId) => {
  if (!newId) return
  detailRawData.value = null
  detailDailySummary.value = {}
  detailRange.value = 'today'
  detailMetrics.value = new Set(['hb', 'bp', 'temp', 'br'])
  currentDate.value = todayStr()
  customDateLabel.value = '選日期'
  updateStatsHead()
  await loadAnnotations()
  await loadDetailChart()
  if (detailRange.value === 'today') renderDetailStats(detailRawData.value || [])
})
</script>

<style scoped>
/* ══ MEMBER DETAIL ══ */
.det-main{padding:24px 32px;max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:18px;}
.det-header{display:flex;align-items:center;gap:12px;margin-bottom:4px;flex-wrap:wrap;}
.btn-back{display:flex;align-items:center;gap:6px;padding:8px 14px;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-md);color:var(--text-mid);font-size:14px;font-weight:600;transition:all .15s;cursor:pointer;}
.btn-back:hover{border-color:var(--mint);color:var(--mint-dark);background:var(--mint-xlight);}
.det-member-info{flex:1;}
.det-member-id{font-size:19px;font-weight:800;letter-spacing:-.3px;}
.det-member-sub{font-size:13px;color:var(--text-dim);margin-top:2px;}
.btn-export{display:flex;align-items:center;gap:6px;padding:8px 16px;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-sm);color:var(--text-mid);font-size:13px;font-weight:600;transition:all .15s;cursor:pointer;}
.btn-export:hover{border-color:var(--mint);color:var(--mint-dark);background:var(--mint-xlight);}
.btn-sync-day{display:flex;align-items:center;gap:6px;padding:7px 12px;background:var(--bg-alt);border:1.5px solid var(--border);border-radius:999px;color:var(--text-dim);font-size:12px;font-weight:700;transition:all .15s;cursor:pointer;}
.btn-sync-day:hover{border-color:var(--mint);color:var(--mint-dark);background:var(--mint-xlight);}
.btn-sync-day:disabled{opacity:.6;cursor:default;}
.btn-search-det{display:flex;align-items:center;gap:5px;padding:7px 14px;background:var(--mint-xlight);border:1.5px solid var(--mint-light);border-radius:999px;color:var(--mint-dark);font-size:12px;font-weight:700;transition:all .15s;cursor:pointer;}
.btn-search-det:hover{background:var(--mint-light);border-color:var(--mint);}

/* Chart card */
.det-chart-card{background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(249,252,250,.84));border:1px solid var(--glass-line);border-radius:var(--r-xl);box-shadow:0 12px 34px rgba(66,98,81,.08);backdrop-filter:blur(10px);overflow:hidden;}
.det-chart-ctrl{display:flex;align-items:center;gap:10px;padding:16px 22px 12px;flex-wrap:wrap;border-bottom:1px solid var(--border-light);}
.det-metric-tabs{display:flex;gap:6px;flex-wrap:wrap;}
.det-metric-btn{padding:7px 16px;border-radius:20px;background:var(--bg-alt);border:1.5px solid var(--border);font-size:13px;font-weight:600;color:var(--text-dim);transition:all .13s;cursor:pointer;}
.det-metric-btn:hover{border-color:var(--mint);color:var(--mint-dark);}
.det-metric-btn.active{background:var(--mint);border-color:var(--mint);color:#fff;}
.det-range-tabs{display:flex;gap:6px;margin-left:auto;align-items:center;}
.det-range-btn{padding:6px 14px;border-radius:20px;background:var(--surface);border:1.5px solid var(--border);font-size:12px;font-weight:600;color:var(--text-dim);transition:all .13s;cursor:pointer;}
.det-range-btn:hover{border-color:var(--mint);color:var(--mint-dark);}
.det-range-btn.active{background:var(--mint-xlight);border-color:var(--mint);color:var(--mint-dark);}
.det-date-pick-wrap{position:relative;}
.det-date-input{position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;top:0;left:0;}
.det-range-btn.date-pick-btn{display:flex;align-items:center;gap:4px;}
.det-chart-body{padding:18px 22px 22px;min-height:200px;}

/* Stats row */
.det-stats-card{background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(249,252,250,.84));border:1px solid var(--glass-line);border-radius:var(--r-xl);box-shadow:0 12px 34px rgba(66,98,81,.08);backdrop-filter:blur(10px);padding:20px 24px;}
.det-stats-head{font-size:12px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:.6px;margin-bottom:14px;}

/* 4 Action buttons */
.det-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.det-action-btn{display:flex;flex-direction:column;align-items:center;gap:8px;padding:22px 14px;background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(246,251,248,.82));border:1px solid var(--glass-line);border-radius:var(--r-xl);transition:all .18s;box-shadow:0 10px 30px rgba(66,98,81,.07);backdrop-filter:blur(8px);text-align:center;cursor:pointer;}
.det-action-btn:hover{border-color:rgba(122,170,150,.48);background:linear-gradient(180deg,rgba(244,250,246,.96),rgba(236,246,240,.88));transform:translateY(-2px);box-shadow:0 14px 34px rgba(66,98,81,.11);}
.det-action-icon{font-size:30px;line-height:1;}
.det-action-label{font-size:13px;font-weight:700;color:var(--text-mid);}
.det-action-sub{font-size:11px;color:var(--text-dim);}
@media(max-width:600px){.det-actions{grid-template-columns:repeat(2,1fr);}}

/* Notes */
.det-notes-card{background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(249,252,250,.84));border:1px solid var(--glass-line);border-radius:var(--r-xl);box-shadow:0 12px 34px rgba(66,98,81,.08);backdrop-filter:blur(10px);padding:20px 24px;}
.det-notes-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.det-notes-title{font-size:14px;font-weight:700;}
.note-hint{font-size:11px;color:var(--text-dim);margin-top:6px;}

/* Annotation cards */
.annot-empty{font-size:13px;color:var(--text-dim);text-align:center;line-height:1.6;}
.annot-card{border:1px solid var(--border-light);border-radius:var(--r-md);padding:12px 14px;margin-bottom:8px;}
.annot-card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
.annot-card-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.annot-card-time{font-size:12px;color:var(--text-dim);}
.annot-card-cat{font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;background:var(--mint-xlight);color:var(--mint-dark);}
.annot-card-text{font-size:13px;color:var(--text-mid);line-height:1.5;}

/* Loading spinner */
@keyframes det-spin{to{transform:rotate(360deg);}}
.det-loading{display:flex;flex-direction:column;align-items:center;gap:10px;padding:40px 32px;}
.det-spinner{width:28px;height:28px;border:3px solid var(--border);border-top-color:var(--mint-mid);border-radius:50%;animation:det-spin .7s linear infinite;}
.det-loading-text{font-size:13px;color:var(--text-dim);}
.trend-empty{text-align:center;padding:32px;color:var(--text-dim);font-size:13px;}

/* v-html inner stats */
:deep(.det-stats-grid){display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;}
:deep(.det-stat-box){display:flex;flex-direction:column;gap:4px;}
:deep(.det-stat-label){font-size:10px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px;}
:deep(.det-stat-val){font-size:24px;font-weight:800;font-feature-settings:'tnum';color:var(--text);line-height:1.1;}
:deep(.det-stat-val.is-red){color:var(--red);}
:deep(.det-stat-val.is-orange){color:var(--orange);}
:deep(.det-stat-sub){font-size:11px;color:var(--text-dim);margin-top:1px;}

/* SVG chart inside v-html */
:deep(svg){display:block;max-width:100%;}
:deep(.trend-empty){text-align:center;padding:32px;color:var(--text-dim);font-size:13px;}
:deep(.avg-drag-node){transition:opacity .12s,r .12s;}
:deep(.avg-drag-node:hover){opacity:1!important;filter:brightness(.85);}

@media(max-width:800px){.det-main{padding-left:16px;padding-right:16px;}}
</style>
