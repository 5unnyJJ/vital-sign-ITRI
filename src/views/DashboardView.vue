<template>
  <div class="dash-main screen-shell">
    <!-- Decorative images -->
    <div class="screen-decor decor-dash-1"><img :src="base + 'images/Snipaste_2026-04-08_17-10-51_nobg.png'" alt="" loading="lazy"></div>
    <div class="screen-decor decor-dash-2"><img :src="base + 'images/Snipaste_2026-04-08_17-07-54_nobg.png'" alt="" loading="lazy"></div>
    <div class="screen-decor decor-dash-3"><img :src="base + 'images/Snipaste_2026-04-08_17-08-43_nobg.png'" alt="" loading="lazy"></div>
    <div class="screen-decor decor-dash-4"><img :src="base + 'images/Snipaste_2026-04-08_17-09-01_nobg.png'" alt="" loading="lazy"></div>

    <!-- Page header -->
    <div class="page-header">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div>
          <h1>健康資料詳細紀錄</h1>
          <div class="context-label">
            <span>{{ tableLabel }}</span>／會員：<span>{{ currentMemberId === 'ALL' ? '全部' : currentMemberId }}</span>
          </div>
        </div>
        <button class="btn-back" @click="router.push('/overview')" aria-label="返回總覽">← 返回總覽</button>
      </div>
    </div>

    <!-- Top bar row: view toggle + date nav -->
    <div class="dashboard-topbar-row">
      <div class="nav-bar">
        <div class="view-toggle">
          <button class="view-btn" :class="{ active: currentView === 'day' }" @click="setView('day')">📅 日視圖</button>
          <button class="view-btn" :class="{ active: currentView === 'month' }" @click="setView('month')">📆 月視圖</button>
        </div>
        <div class="date-nav">
          <button class="date-nav-btn" @click="navPrev">&#8592;</button>
          <div class="date-display">{{ dateDisplay }}</div>
          <button class="date-nav-btn" @click="navNext">&#8594;</button>
          <button class="btn-today" @click="goToday">今天</button>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="count-badge" v-show="rowCountVisible" v-html="rowCountHtml"></div>
      <div class="toolbar-right">
        <div class="last-upload" v-if="lastUploadTime" :class="{ fresh: lastUploadFresh }">
          <span>最後上傳：</span><span class="lu-time">{{ lastUploadTime }}</span><span class="lu-ago">{{ lastUploadAgo }}</span>
        </div>
        <button class="btn-account" :class="{ 'has-filter': currentMemberId !== 'ALL' }" @click="openAccountSidebar">👤 篩選會員</button>
        <button class="btn-refresh" :class="{ spinning: refreshing }" @click="manualRefresh">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>重新整理
        </button>
      </div>
    </div>

    <!-- Trend panel (day view) — @click handles data-range / data-metric buttons inside v-html -->
    <div class="trend-panel" v-if="currentView === 'day' && trendHtml" @click="handleTrendClick">
      <div class="trend-body" v-html="trendHtml"></div>
    </div>

    <!-- Table content -->
    <div id="dash-table-content" v-html="tableContentHtml"></div>

    <!-- Pagination -->
    <div class="pagination" v-if="totalPages > 1">
      <button class="page-btn" :disabled="currentPage === 1" @click="gotoPage(currentPage - 1)">←</button>
      <button
        v-for="p in totalPages"
        :key="p"
        class="page-btn"
        :class="{ active: p === currentPage }"
        @click="gotoPage(p)"
      >{{ p }}</button>
      <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 頁</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="gotoPage(currentPage + 1)">→</button>
    </div>

    <!-- Footer -->
    <footer class="site-footer">
      <span class="footer-author">JJ.LING (5unnyJJ)</span>
      <span class="footer-sep">|</span>
      <span>機構健康資料看板 v3.0</span>
      <span class="footer-sep">|</span>
      <a href="https://github.com/5unnyJJ/vital-signs-Dashboard_V2" target="_blank">GitHub</a>
      <span class="footer-sep">|</span>
      <span>© 2026</span>
    </footer>

    <!-- Account sidebar overlay -->
    <div class="acct-overlay" :class="{ open: acctSidebarOpen }">
      <div class="acct-backdrop" @click="closeAccountSidebar"></div>
      <div class="acct-sidebar">
        <div class="acct-header">
          <h3>👤 帳號選擇</h3>
          <button class="acct-close" @click="closeAccountSidebar">✕</button>
        </div>
        <div class="acct-search-wrap">
          <input class="acct-search" v-model="acctSearchQuery" placeholder="搜尋帳號…">
        </div>
        <div class="acct-list">
          <div class="acct-item" :class="{ active: currentMemberId === 'ALL' }" @click="setMember('ALL')">
            <span class="acct-dot all"></span>
            <span class="acct-name">全部帳號</span>
            <span class="acct-check" v-if="currentMemberId === 'ALL'">✓</span>
          </div>
          <div
            v-for="id in filteredMemberList"
            :key="id"
            class="acct-item"
            :class="{ active: currentMemberId === id }"
            @click="setMember(id)"
          >
            <span class="acct-dot"></span>
            <span class="acct-name">{{ id }}</span>
            <span class="acct-check" v-if="currentMemberId === id">✓</span>
          </div>
          <div v-if="!filteredMemberList.length" style="padding:20px 12px;font-size:13px;color:var(--text-dim)">
            尚無帳號資料
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNavStore } from '@/stores/nav.js'
import { useAuthStore } from '@/stores/auth.js'
import { useDashboardStore } from '@/stores/dashboard.js'
import { sb, TABLE_LABELS } from '@/lib/supabase.js'
import { trendSVG, initCursorDragNodes, sparklineSVG } from '@/utils/chart.js'
import { avg, stdOf, anomalyLevel, filterWarmupMinutes, aggregateToMinutes, modeOf } from '@/utils/math.js'
import { p2, todayStr, monthStr, escHtml } from '@/utils/format.js'
import { loadDayCache, saveDayCache } from '@/utils/cache.js'

const router = useRouter()
const navStore = useNavStore()
const authStore = useAuthStore()
const dashStore = useDashboardStore()

const base = import.meta.env.BASE_URL

// ── State ──────────────────────────────────────────────────
const currentView = ref('day')
const currentDate = ref(todayStr())
const currentMonth = ref(monthStr())
const currentPage = ref(1)
const totalPages = ref(1)
const currentMemberId = ref(dashStore.currentMemberId || 'ALL')
// Reset the store so the next visit starts fresh
dashStore.currentMemberId = 'ALL'
const memberList = ref([])
const refreshing = ref(false)
const acctSidebarOpen = ref(false)
const acctSearchQuery = ref('')

const rowCountVisible = ref(false)
const rowCountHtml = ref('—')
const tableContentHtml = ref('<div class="state-card">請選擇機構</div>')
const trendHtml = ref('')

const lastUploadTime = ref('')
const lastUploadAgo = ref('')
const lastUploadFresh = ref(false)

const HOURS_PER_PAGE = 6

// Data caches
let groupedCache = null
let rawRowsCache = []
let dayStats = null
let dailySummaryCache = {}
let loadToken = 0
let trendLineSet = new Set(['hb', 'br'])
let hbBreathRange = 'day'

// ── Computed ───────────────────────────────────────────────
const tableLabel = computed(() => TABLE_LABELS[navStore.currentTable] || navStore.currentTable || '—')
const dateDisplay = computed(() => currentView.value === 'day' ? currentDate.value : currentMonth.value)
const filteredMemberList = computed(() => {
  const q = acctSearchQuery.value.toLowerCase().trim()
  if (!q) return memberList.value
  return memberList.value.filter(id => id.toLowerCase().includes(q))
})

// ── Column definitions ─────────────────────────────────────
const AGG_COLS = [
  { key: 'time', label: '時間' },
  { key: 'count', label: '筆數' },
  { key: 'heartbeat', label: '心跳', badge: true },
  { key: 'temp', label: '體溫', badge: true },
  { key: 'breath', label: '呼吸', badge: false },
  { key: 'sbp', label: '收縮壓', badge: true },
  { key: 'dbp', label: '舒張壓', badge: false },
  { key: 'pulse', label: '脈搏', badge: false },
  { key: 'step', label: '步數', badge: false },
  { key: 'calorie', label: '卡路里', badge: false },
  { key: 'action', label: '動作' },
]

const ACTION_MAP = { 0: '靜止', 1: '走路', 2: '走路', 3: '慢跑', 4: '慢跑', 5: '快跑', 6: '躺姿', 7: '姿勢異常' }
function actionLabel(v) {
  if (v === null || v === undefined || v === '') return null
  const k = parseInt(v); return isNaN(k) ? null : (ACTION_MAP[k] || null)
}
function formatMinute(t) { return t ? t.slice(11, 16) : '--' }

// ── Helpers ────────────────────────────────────────────────
function groupByHour(minuteRows) {
  const hours = {}
  minuteRows.forEach(r => { const hk = r.time.slice(11, 13); if (!hours[hk]) hours[hk] = []; hours[hk].push(r) })
  return hours
}
function computeDayStats(minuteRows) {
  const hbVals = minuteRows.map(r => r.heartbeat).filter(v => v !== null && !isNaN(parseFloat(v))).map(Number)
  const brVals = minuteRows.map(r => r.breath).filter(v => v !== null && !isNaN(parseFloat(v))).map(Number)
  const tpVals = minuteRows.map(r => r.temp).filter(v => v !== null && !isNaN(parseFloat(v))).map(Number)
  const avgOf = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null
  return {
    maxHb: hbVals.length ? Math.max(...hbVals) : null, minHb: hbVals.length ? Math.min(...hbVals) : null,
    maxBr: brVals.length ? Math.max(...brVals) : null, minBr: brVals.length ? Math.min(...brVals) : null,
    avgHb: avgOf(hbVals), stdHb: stdOf(hbVals), avgBr: avgOf(brVals), stdBr: stdOf(brVals),
    avgTemp: avgOf(tpVals), stdTemp: stdOf(tpVals),
  }
}
function setLastUpload(dm) {
  if (!dm) return
  lastUploadTime.value = dm.slice(11, 16)
  const diff = (Date.now() - new Date(dm).getTime()) / 60000
  lastUploadAgo.value = diff < 2 ? '（剛剛）' : `（${Math.round(diff)} 分前）`
  lastUploadFresh.value = diff < 5
}
function clearLastUpload() { lastUploadTime.value = ''; lastUploadAgo.value = '' }

// ── Render page (day view) ────────────────────────────────
function renderPage() {
  if (!groupedCache) return
  const hourKeys = Object.keys(groupedCache).sort()
  const start = (currentPage.value - 1) * HOURS_PER_PAGE
  const pageHours = hourKeys.slice(start, start + HOURS_PER_PAGE)
  totalPages.value = Math.ceil(hourKeys.length / HOURS_PER_PAGE)

  let theadHtml = '<tr>'; AGG_COLS.forEach(c => { theadHtml += `<th>${c.label}</th>` }); theadHtml += '</tr>'
  const totalMins = hourKeys.reduce((s, hk) => s + groupedCache[hk].length, 0)
  let vitalsHtml = ''
  if (dayStats) {
    const { maxHb, minHb, maxBr, minBr, avgHb, stdHb, avgBr, stdBr, avgTemp, stdTemp } = dayStats
    const fmt = (a, s) => a !== null ? `${a} <span style="opacity:.55;font-weight:400">±${s ?? '—'}</span>` : '—'
    if (maxHb !== null) vitalsHtml += `<div class="date-vital"><span>❤️</span><strong>${minHb}–${maxHb}</strong></div>`
    vitalsHtml += `<div class="date-vital"><span>🫁</span><strong>${maxBr !== null ? minBr + '–' + maxBr : '—'}</strong></div>`
    vitalsHtml += `<div class="date-vital std"><span>📊 </span><strong>❤️ ${fmt(avgHb, stdHb)} &nbsp;🫁 ${fmt(avgBr, stdBr)} &nbsp;🌡 ${fmt(avgTemp, stdTemp)}</strong></div>`
  }
  let hourCardsHtml = ''
  pageHours.forEach((hk, hi) => {
    const rows = groupedCache[hk]; const nextH = p2(parseInt(hk) + 1)
    const aHb = avg(rows.map(r => r.heartbeat)); const aSbp = avg(rows.map(r => r.sbp)); const aDbp = avg(rows.map(r => r.dbp))
    const aTemp = avg(rows.map(r => r.temp)); const aBr = avg(rows.map(r => r.breath))
    const hbLvl = anomalyLevel('heartbeat', aHb); const sbpLvl = anomalyLevel('sbp', aSbp)
    const statsHtml = [
      aHb !== null ? `<div class="stat-chip"><span>❤️</span><span class="stat-val${hbLvl === 'red' ? ' is-red' : ''}">${Math.round(aHb)}</span></div>` : '',
      `<div class="stat-chip"><span>🫁</span><span class="stat-val">${aBr !== null ? Math.round(aBr) : '—'}</span></div>`,
      aSbp !== null ? `<div class="stat-chip"><span>🩺</span><span class="stat-val${sbpLvl === 'red' ? ' is-red' : ''}">${Math.round(aSbp)}</span></div>` : '',
      aDbp !== null ? `<div class="stat-chip"><span>💙</span><span class="stat-val">${Math.round(aDbp)}</span></div>` : '',
      aTemp !== null ? `<div class="stat-chip"><span>🌡</span><span class="stat-val">${parseFloat(aTemp).toFixed(1)}°C</span></div>` : '',
    ].join('')
    let tbodyHtml = ''
    rows.forEach(r => {
      tbodyHtml += '<tr>'; AGG_COLS.forEach(c => {
        let val = r[c.key], cell
        if (c.key === 'time') cell = `<span class="val-neutral">${formatMinute(val)}</span>`
        else if (c.key === 'count') cell = `<span class="val-count">${val}</span>`
        else if (c.key === 'action') { const lbl = actionLabel(val); cell = val === null || val === undefined ? '<span class="val-dim">—</span>' : `<span class="val-neutral">${escHtml(String(lbl ?? val ?? ''))}</span>` }
        else if (val === null || val === undefined) cell = '<span class="val-dim">—</span>'
        else if (c.badge) { const lvl = anomalyLevel(c.key, val); const disp = c.key === 'temp' ? parseFloat(val).toFixed(1) + '°C' : Math.round(val); cell = lvl === 'red' ? `<span class="val-badge val-red">${disp}</span>` : `<span class="val-neutral">${disp}</span>` }
        else cell = `<span class="val-neutral">${val}</span>`
        tbodyHtml += `<td>${cell}</td>`
      }); tbodyHtml += '</tr>'
    })
    const isOpen = hi === 0 ? ' open' : ''
    hourCardsHtml += `<div class="hour-card${isOpen}"><div class="hour-header" onclick="this.parentElement.classList.toggle('open')"><div class="hour-label">${hk}:00–${nextH}:00</div><div class="hour-count">${rows.length} 分</div><div class="hour-stats">${statsHtml}</div><svg class="hour-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></div><div class="hour-body"><div class="data-table-wrap"><table class="data-table"><thead>${theadHtml}</thead><tbody>${tbodyHtml}</tbody></table></div></div></div>`
  })
  const dateCard = `<div class="date-card open"><div class="date-header" onclick="this.parentElement.classList.toggle('open')"><div class="date-header-left"><div class="date-icon">📅</div><div class="date-info"><div class="date-label">${escHtml(currentDate.value)}${currentMemberId.value !== 'ALL' ? ' · ' + escHtml(currentMemberId.value) : ''}</div><div class="date-meta">${hourKeys.length} 個時段・${totalMins.toLocaleString()} 分鐘紀錄</div><div class="date-vitals">${vitalsHtml}</div></div></div><svg class="date-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></div><div class="date-body">${hourCardsHtml}</div></div>`
  tableContentHtml.value = dateCard
}

async function renderTrendPanel() {
  if (currentView.value !== 'day' || !groupedCache) { trendHtml.value = ''; return }
  const minuteRows = Object.values(groupedCache).flat().sort((a, b) => a.time.localeCompare(b.time))
  if (!minuteRows.length) { trendHtml.value = '<div class="trend-empty">無資料</div>'; return }
  const mkBtn = (r, l) => `<button class="trend-range-btn${hbBreathRange === r ? ' active' : ''}" data-range="${r}">${l}</button>`
  const baseBtns = mkBtn('day', '一天') + mkBtn('week', '一週') + mkBtn('month', '一個月')
  const mkMBtn = (k, l) => `<button class="trend-metric-toggle${trendLineSet.has(k) ? ' active' : ''}" data-metric="${k}">${l}</button>`
  const metricBtns = `<div class="trend-metric-btns">${mkMBtn('hb', '❤️ 心跳') + mkMBtn('br', '🫁 呼吸') + mkMBtn('sbp', '🩺 收縮壓') + mkMBtn('temp', '🌡 體溫')}</div>`
  function mkSeries(src, mode) {
    const s = []
    if (trendLineSet.has('hb')) s.push({ label: '心跳 bpm', color: '#7aaa96', values: src.map(r => mode === 'daily' ? (r?.avgHb ?? null) : r.heartbeat) })
    if (trendLineSet.has('br')) s.push({ label: '呼吸 rpm', color: '#bf7a45', values: src.map(r => mode === 'daily' ? (r?.avgBr ?? null) : r.breath) })
    if (trendLineSet.has('sbp')) s.push({ label: '收縮壓 mmHg', color: '#b85450', values: src.map(r => mode === 'daily' ? (r?.avgSbp ?? null) : r.sbp) })
    if (trendLineSet.has('temp')) s.push({ label: '體溫 °C', color: '#e07b39', values: src.map(r => mode === 'daily' ? (r?.avgTemp ?? null) : r.temp) })
    return s
  }
  const labels = minuteRows.map(r => r.time.slice(11, 16))
  const series = mkSeries(minuteRows, 'raw')
  trendHtml.value = `<div class="trend-range-btns">${baseBtns}</div>${metricBtns}` + (series.length ? trendSVG(series, labels, { sharedCursor: true, actionValues: minuteRows.map(r => r.action) }, 280) : '<div class="trend-empty">請勾選至少一項指標</div>')
  nextTick(() => { initCursorDragNodes() })
}

// Event delegation for v-html trend panel buttons (data-range / data-metric)
function handleTrendClick(e) {
  const rangeBtn = e.target.closest('[data-range]')
  if (rangeBtn) { hbBreathRange = rangeBtn.dataset.range; renderTrendPanel(); return }
  const metricBtn = e.target.closest('[data-metric]')
  if (metricBtn) {
    const k = metricBtn.dataset.metric
    if (trendLineSet.has(k)) { if (trendLineSet.size === 1) return; trendLineSet.delete(k) } else trendLineSet.add(k)
    renderTrendPanel()
  }
}

// ── Data fetching ─────────────────────────────────────────
async function fetchDay(table, date, silent = false) {
  const start = date + 'T00:00:00', end = date + 'T23:59:59.999'
  let all = [], page = 0; const ps = 1000
  while (true) {
    let q = sb.from(table).select('date_minute,heartbeat,temp,breath,sbp,dbp,pulse,step,calorie,action,member_id')
      .gte('date_minute', start).lte('date_minute', end)
      .order('date_minute', { ascending: true }).range(page * ps, (page + 1) * ps - 1)
    if (currentMemberId.value !== 'ALL') q = q.eq('member_id', currentMemberId.value)
    const { data, error } = await q; if (error || !data || !data.length) break
    all = all.concat(data); if (data.length < ps) break; page++
  }
  return all
}

async function fetchDaySummary(table, date) {
  const start = date + 'T00:00:00', end = date + 'T23:59:59.999'
  let q = sb.from(table).select('date_minute,heartbeat,temp,sbp,dbp,breath').gte('date_minute', start).lte('date_minute', end).limit(3000)
  if (currentMemberId.value !== 'ALL') q = q.eq('member_id', currentMemberId.value)
  const { data, error } = await q; if (error || !data) return null; return data
}

function applyDayViewRows(rawRows, tok) {
  if (tok !== undefined && tok !== loadToken) return
  if (!rawRows.length) {
    tableContentHtml.value = `<div class="state-card">📭 ${currentDate.value} 沒有資料</div>`
    rowCountVisible.value = true; rowCountHtml.value = '共 <strong>0</strong> 筆'
    trendHtml.value = ''; return
  }
  rawRowsCache = rawRows
  const maxDm = rawRows.reduce((m, r) => r.date_minute > m ? r.date_minute : m, '')
  setLastUpload(maxDm)
  const minuteRows = filterWarmupMinutes(aggregateToMinutes(rawRows))
  groupedCache = groupByHour(minuteRows)
  dayStats = computeDayStats(minuteRows)
  const hourKeys = Object.keys(groupedCache).sort()
  totalPages.value = Math.ceil(hourKeys.length / HOURS_PER_PAGE)
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value || 1
  const warmFiltered = aggregateToMinutes(rawRows).length - minuteRows.length
  const warmNote = warmFiltered > 0 ? `<span style="font-size:11px;color:var(--text-dim)">（已過濾暖機 ${warmFiltered} 分）</span>` : ''
  rowCountVisible.value = true
  rowCountHtml.value = `原始 <strong>${rawRows.length.toLocaleString()}</strong> 筆 → 合併 <strong>${minuteRows.length.toLocaleString()}</strong> 分鐘${warmNote}`
  renderPage()
  renderTrendPanel()
  // update member list from data
  const ids = [...new Set(rawRows.map(r => r.member_id).filter(Boolean))].sort()
  if (ids.length && !memberList.value.length) memberList.value = ids
}

async function loadDayView(tok) {
  const table = navStore.currentTable
  rowCountVisible.value = false; groupedCache = null; rawRowsCache = []; dayStats = null; clearLastUpload()
  const cached = loadDayCache(table, currentDate.value, currentMemberId.value)
  if (cached) {
    applyDayViewRows(cached.rows, tok)
    if (!cached.stale) return
    const freshRows = await fetchDay(table, currentDate.value, true)
    if (tok !== undefined && tok !== loadToken) return
    saveDayCache(table, currentDate.value, currentMemberId.value, freshRows)
    applyDayViewRows(freshRows, tok)
    return
  }
  tableContentHtml.value = `<div class="progress-wrap"><div class="progress-label">載入中…</div><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:0%"></div></div><div class="progress-note">正在取得 ${escHtml(currentDate.value)} 的資料</div></div>`
  const rawRows = await fetchDay(table, currentDate.value)
  if (tok !== undefined && tok !== loadToken) return
  saveDayCache(table, currentDate.value, currentMemberId.value, rawRows)
  applyDayViewRows(rawRows, tok)
}

async function loadMonthView(tok) {
  const table = navStore.currentTable
  rowCountVisible.value = false; trendHtml.value = ''; clearLastUpload()
  const [yr, mo] = currentMonth.value.split('-').map(Number)
  const daysInMonth = new Date(yr, mo, 0).getDate()
  let gridHtml = '<div class="month-grid">'
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${yr}-${p2(mo)}-${p2(d)}`
    gridHtml += `<div class="day-card loading-day" id="dc-${ds}"><div class="day-card-date">📅 ${ds}</div><div class="day-card-stats"><div class="day-stat"><div class="day-stat-label">載入中</div><div class="day-stat-val" style="color:var(--text-light)">…</div></div></div></div>`
  }
  gridHtml += '</div>'
  tableContentHtml.value = gridHtml

  const dayChecks = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1; const ds = `${yr}-${p2(mo)}-${p2(d)}`
    const start = ds + 'T00:00:00', end = ds + 'T23:59:59.999'
    let q = sb.from(table).select('heartbeat,temp,sbp,dbp,breath', { count: 'exact' })
      .gte('date_minute', start).lte('date_minute', end).limit(300)
    if (currentMemberId.value !== 'ALL') q = q.eq('member_id', currentMemberId.value)
    return q.then(({ data, count, error }) => ({ ds, count: error ? 0 : (count || 0), rows: data || [] }))
  })
  const results = await Promise.all(dayChecks)
  if (tok !== undefined && tok !== loadToken) return

  const activeDays = results.filter(r => r.count > 0).length
  rowCountVisible.value = true
  rowCountHtml.value = `${currentMonth.value} 月份・有資料 <strong>${activeDays}</strong> 天（共 ${daysInMonth} 天）`

  // Update cards via DOM manipulation after v-html renders
  nextTick(() => {
    results.forEach(({ ds, count, rows }) => {
      const card = document.getElementById('dc-' + ds); if (!card) return
      card.classList.remove('loading-day')
      if (!count) {
        card.classList.add('no-data')
        card.innerHTML = `<div class="day-card-date">📅 ${ds}</div><div class="day-card-stats"><div class="day-stat"><div class="day-stat-label">無資料</div></div></div>`
        return
      }
      const avgF = (f) => { const v = rows.map(r => parseFloat(r[f])).filter(n => !isNaN(n)); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null }
      const aHb = avgF('heartbeat'), aTemp = avgF('temp'), aSbp = avgF('sbp')
      const hbLvl = anomalyLevel('heartbeat', aHb); const sbpLvl = anomalyLevel('sbp', aSbp)
      const hbBadge = aHb !== null ? `<span style="background:${hbLvl === 'red' ? 'var(--red-light)' : 'var(--mint-xlight)'};color:${hbLvl === 'red' ? 'var(--red)' : 'var(--mint-dark)'};border-radius:6px;padding:1px 6px;font-size:11px">❤️ ${aHb}</span>` : ''
      const tempBadge = aTemp !== null ? `<span style="background:var(--mint-xlight);color:var(--mint-dark);border-radius:6px;padding:1px 6px;font-size:11px">🌡 ${parseFloat(aTemp).toFixed(1)}</span>` : ''
      const sbpBadge = aSbp !== null ? `<span style="background:${sbpLvl === 'red' ? 'var(--red-light)' : 'var(--mint-xlight)'};color:${sbpLvl === 'red' ? 'var(--red)' : 'var(--mint-dark)'};border-radius:6px;padding:1px 6px;font-size:11px">🩺 ${aSbp}</span>` : ''
      const vitals = [hbBadge, tempBadge, sbpBadge].filter(Boolean).join(' ')
      card.innerHTML = `<div class="day-card-date">📅 ${ds}</div><div class="day-card-stats"><div class="day-stat"><div class="day-stat-label">📊 量測筆數</div><div class="day-stat-val">${count.toLocaleString()}</div></div></div>${vitals ? `<div style="margin:6px 10px 4px;display:flex;flex-wrap:wrap;gap:4px;">${vitals}</div>` : ''}<div class="day-card-footer"><span>${count.toLocaleString()} 筆</span><span style="color:var(--mint-mid);font-weight:600;">查看詳細 →</span></div>`
      card.style.cursor = 'pointer'
      card.onclick = () => { currentDate.value = ds; setView('day'); loadCurrentTable() }
    })
  })
}

async function loadCurrentTable() {
  const table = navStore.currentTable
  if (!table) return
  const tok = ++loadToken
  if (currentView.value === 'day') await loadDayView(tok)
  else await loadMonthView(tok)
}

// ── View / nav ────────────────────────────────────────────
function setView(v) {
  currentView.value = v
  navStore.currentView = v
  currentPage.value = 1
  if (v === 'month') { hbBreathRange = 'month'; trendHtml.value = '' }
  else hbBreathRange = 'day'
}

function navPrev() {
  if (currentView.value === 'day') {
    const d = new Date(currentDate.value + 'T00:00:00'); d.setDate(d.getDate() - 1)
    currentDate.value = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
  } else {
    const [y, m] = currentMonth.value.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    currentMonth.value = `${d.getFullYear()}-${p2(d.getMonth() + 1)}`
  }
  currentPage.value = 1; loadCurrentTable()
}

function navNext() {
  if (currentView.value === 'day') {
    const d = new Date(currentDate.value + 'T00:00:00'); d.setDate(d.getDate() + 1)
    currentDate.value = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
  } else {
    const [y, m] = currentMonth.value.split('-').map(Number)
    const d = new Date(y, m, 1)
    currentMonth.value = `${d.getFullYear()}-${p2(d.getMonth() + 1)}`
  }
  currentPage.value = 1; loadCurrentTable()
}

function goToday() {
  currentDate.value = todayStr(); currentMonth.value = monthStr()
  currentPage.value = 1; loadCurrentTable()
}

function gotoPage(p) { currentPage.value = p; renderPage() }

async function manualRefresh() {
  refreshing.value = true; try { await loadCurrentTable() } finally { refreshing.value = false }
}

// ── Account sidebar ───────────────────────────────────────
function openAccountSidebar() { acctSearchQuery.value = ''; acctSidebarOpen.value = true }
function closeAccountSidebar() { acctSidebarOpen.value = false }
function setMember(id) {
  currentMemberId.value = id; closeAccountSidebar()
  currentPage.value = 1; groupedCache = null; rawRowsCache = []
  loadCurrentTable()
}

// ── Auto-refresh ──────────────────────────────────────────
let arTimer = null
let arInterval = 30
let arCountdown = 30

function startAutoRefresh() {
  if (arTimer) clearInterval(arTimer)
  if (arInterval <= 0) return
  arCountdown = arInterval
  arTimer = setInterval(() => {
    arCountdown--
    if (arCountdown <= 0) {
      arCountdown = arInterval
      const isToday = currentView.value === 'day' && currentDate.value === todayStr()
      if (isToday && navStore.currentTable) loadCurrentTable()
    }
  }, 1000)
}

// ── Lifecycle ─────────────────────────────────────────────
onMounted(() => {
  // Restore view state from store
  if (dashStore.currentDate) currentDate.value = dashStore.currentDate
  if (dashStore.currentMonth) currentMonth.value = dashStore.currentMonth
  if (navStore.currentView) currentView.value = navStore.currentView

  if (navStore.currentTable) loadCurrentTable()
  startAutoRefresh()
})

onBeforeUnmount(() => {
  if (arTimer) clearInterval(arTimer)
  dashStore.currentDate = currentDate.value
  dashStore.currentMonth = currentMonth.value
})

watch(() => navStore.currentTable, (newTable) => {
  if (newTable) { currentPage.value = 1; groupedCache = null; loadCurrentTable() }
})
</script>

<style scoped>
/* ══ DASHBOARD ══ */
.dash-main{padding:28px 32px;max-width:1500px;margin:0 auto;}
.page-header{margin-bottom:22px;}
.page-header h1{font-size:22px;font-weight:700;letter-spacing:-.4px;margin-bottom:3px;}
.context-label{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:var(--mint-xlight);border:1.5px solid var(--mint-light);border-radius:40px;font-size:12.5px;color:var(--text-mid);font-weight:600;margin-top:8px;}
.context-label span{color:var(--mint-dark);}
.dashboard-topbar-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px;}
.nav-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;width:100%;}
.view-toggle{display:flex;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--shadow-sm);}
.view-btn{padding:11px 26px;background:transparent;border:none;font-size:15px;font-weight:600;font-family:inherit;color:var(--text-dim);cursor:pointer;transition:all .15s;}
.view-btn:hover{background:var(--bg-alt);color:var(--mint-dark);}
.view-btn.active{background:var(--mint);color:#fff;}
.date-nav{display:flex;align-items:center;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--shadow-sm);}
.date-nav-btn{padding:12px 18px;background:transparent;border:none;color:var(--text-mid);font-size:20px;cursor:pointer;transition:background .15s;display:flex;align-items:center;}
.date-nav-btn:hover{background:var(--bg-alt);color:var(--mint-dark);}
.date-display{padding:12px 24px;font-size:17px;font-weight:800;color:var(--text);letter-spacing:-.2px;white-space:nowrap;border-left:1px solid var(--border-light);border-right:1px solid var(--border-light);}
.btn-today{padding:12px 18px;background:transparent;border:none;font-size:14px;font-weight:700;color:var(--mint-mid);transition:background .15s;cursor:pointer;}
.btn-today:hover{background:var(--mint-xlight);}
.btn-back{display:flex;align-items:center;gap:6px;padding:8px 14px;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-md);color:var(--text-mid);font-size:14px;font-weight:600;transition:all .15s;cursor:pointer;}
.btn-back:hover{border-color:var(--mint);color:var(--mint-dark);background:var(--mint-xlight);}
.toolbar{display:flex;align-items:center;justify-content:space-between;margin:16px 0;gap:10px;flex-wrap:wrap;}
.count-badge{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);font-size:13px;color:var(--text-mid);box-shadow:var(--shadow-sm);}
.toolbar-right{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.last-upload{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);font-size:12px;color:var(--text-dim);box-shadow:var(--shadow-sm);font-feature-settings:'tnum';white-space:nowrap;}
.last-upload .lu-time{color:var(--text-mid);font-weight:600;}
.last-upload .lu-ago{color:var(--text-light);}
.last-upload.fresh .lu-time{color:var(--green);}
.btn-account{display:flex;align-items:center;gap:6px;padding:7px 14px;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-sm);color:var(--text-mid);font-size:13px;font-weight:600;transition:all .18s;cursor:pointer;}
.btn-account:hover{border-color:var(--mint);color:var(--mint-dark);background:var(--mint-xlight);}
.btn-account.has-filter{border-color:var(--mint);color:var(--mint-dark);background:var(--mint-xlight);}
.btn-refresh{display:flex;align-items:center;gap:7px;padding:11px 20px;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-sm);color:var(--text-mid);font-size:14px;transition:all .18s;box-shadow:var(--shadow-sm);cursor:pointer;}
.btn-refresh:hover{border-color:var(--mint);color:var(--mint-dark);background:var(--mint-xlight);}
.btn-refresh.spinning svg{animation:spin .6s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}

/* Trend panel */
.trend-panel{background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(249,252,250,.84));border:1px solid var(--glass-line);border-radius:var(--r-xl);box-shadow:0 12px 34px rgba(66,98,81,.08);backdrop-filter:blur(10px);margin-bottom:20px;overflow:hidden;}
:deep(.trend-body){padding:20px 24px;}
:deep(.trend-range-btns){display:flex;gap:6px;margin-bottom:14px;}
:deep(.trend-range-btn){padding:5px 14px;background:var(--bg-alt);border:1.5px solid var(--border);border-radius:20px;font-size:12px;font-weight:600;color:var(--text-mid);transition:all .13s;cursor:pointer;}
:deep(.trend-range-btn:hover){border-color:var(--mint);color:var(--mint-dark);}
:deep(.trend-range-btn.active){background:var(--mint);border-color:var(--mint);color:#fff;}
:deep(.trend-metric-btns){display:flex;gap:6px;flex-wrap:wrap;padding:0 0 10px;}
:deep(.trend-metric-toggle){padding:4px 12px;background:var(--bg-alt);border:1.5px solid var(--border);border-radius:20px;font-size:11.5px;font-weight:600;color:var(--text-dim);transition:all .13s;cursor:pointer;display:flex;align-items:center;gap:4px;}
:deep(.trend-metric-toggle:hover){border-color:var(--mint);color:var(--mint-dark);}
:deep(.trend-metric-toggle.active){background:var(--mint-xlight);border-color:var(--mint);color:var(--mint-dark);}
:deep(.trend-empty){text-align:center;padding:32px;color:var(--text-dim);font-size:13px;}

/* Table content via v-html */
:deep(.state-card){background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-xl);padding:72px 32px;text-align:center;color:var(--text-dim);font-size:15px;box-shadow:var(--shadow-sm);}
:deep(.progress-wrap){background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-xl);padding:40px;text-align:center;box-shadow:var(--shadow-sm);}
:deep(.progress-label){font-size:14px;color:var(--text-mid);margin-bottom:16px;}
:deep(.progress-bar-bg){width:100%;max-width:320px;height:6px;background:var(--border);border-radius:10px;margin:0 auto;}
:deep(.progress-bar-fill){height:6px;background:var(--mint);border-radius:10px;transition:width .3s ease;width:0%;}
:deep(.progress-note){font-size:12px;color:var(--text-dim);margin-top:10px;}
:deep(.date-card){background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(249,252,250,.84));border:1px solid var(--glass-line);border-radius:var(--r-xl);overflow:hidden;box-shadow:0 12px 32px rgba(66,98,81,.08);backdrop-filter:blur(10px);transition:box-shadow .2s,border-color .2s;}
:deep(.date-card:hover){box-shadow:0 16px 36px rgba(66,98,81,.1);border-color:rgba(122,170,150,.45);}
:deep(.date-header){display:flex;align-items:center;justify-content:space-between;padding:22px 28px;cursor:pointer;user-select:none;transition:background .15s;}
:deep(.date-header:hover){background:var(--bg-alt);}
:deep(.date-header-left){display:flex;align-items:center;gap:18px;flex:1;}
:deep(.date-icon){width:52px;height:52px;background:var(--mint-light);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;}
:deep(.date-info){flex:1;}
:deep(.date-label){font-size:20px;font-weight:800;letter-spacing:-.3px;}
:deep(.date-meta){font-size:14px;color:var(--text-dim);margin-top:4px;}
:deep(.date-vitals){display:flex;gap:18px;margin-top:8px;flex-wrap:wrap;}
:deep(.date-vital){font-size:14px;color:var(--text-mid);display:flex;align-items:center;gap:5px;}
:deep(.date-vital strong){font-weight:700;color:var(--text);}
:deep(.date-vital.std strong){color:var(--mint-mid);}
:deep(.date-chevron){width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:7px;color:var(--text-light);transition:transform .25s ease,color .15s;flex-shrink:0;}
:deep(.date-card.open .date-chevron){transform:rotate(180deg);color:var(--mint);}
:deep(.date-body){display:none;padding:0 16px 16px;flex-direction:column;gap:8px;}
:deep(.date-card.open .date-body){display:flex;}
:deep(.hour-card){background:linear-gradient(180deg,rgba(247,251,248,.92),rgba(242,248,244,.84));border:1px solid rgba(210,226,217,.85);border-radius:var(--r-lg);overflow:hidden;}
:deep(.hour-header){display:flex;align-items:center;gap:12px;padding:15px 20px;cursor:pointer;user-select:none;transition:background .15s;}
:deep(.hour-header:hover){background:var(--mint-xlight);}
:deep(.hour-label){font-size:16px;font-weight:700;font-feature-settings:'tnum';flex-shrink:0;}
:deep(.hour-count){font-size:13px;color:var(--text-dim);background:var(--surface);border:1px solid var(--border);padding:3px 11px;border-radius:20px;flex-shrink:0;}
:deep(.hour-stats){display:flex;align-items:center;gap:12px;flex:1;flex-wrap:wrap;}
:deep(.stat-chip){display:flex;align-items:center;gap:5px;font-size:13px;color:var(--text-mid);}
:deep(.stat-val){font-weight:700;color:var(--text);font-feature-settings:'tnum';}
:deep(.stat-val.is-red){color:var(--red);}
:deep(.stat-val.is-orange){color:var(--orange);}
:deep(.hour-chevron){width:20px;height:20px;display:flex;align-items:center;justify-content:center;color:var(--text-light);transition:transform .2s;flex-shrink:0;margin-left:auto;}
:deep(.hour-card.open .hour-chevron){transform:rotate(180deg);}
:deep(.hour-body){display:none;border-top:1px solid var(--border-light);}
:deep(.hour-card.open .hour-body){display:block;}
:deep(.data-table-wrap){overflow-x:auto;background:var(--surface);}
:deep(.data-table){width:100%;border-collapse:collapse;font-size:13px;min-width:920px;}
:deep(.data-table thead th){padding:12px 16px;text-align:left;font-weight:700;font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.7px;background:var(--bg-alt);border-bottom:1px solid var(--border-light);white-space:nowrap;}
:deep(.data-table tbody td){padding:13px 16px;border-bottom:1px solid var(--border-light);white-space:nowrap;vertical-align:middle;}
:deep(.data-table tbody tr:hover td){background:var(--mint-xlight);}
:deep(.data-table tbody tr:last-child td){border-bottom:none;}
:deep(.val-neutral){font-size:13px;color:var(--text);font-feature-settings:'tnum';}
:deep(.val-dim){color:var(--text-light);}
:deep(.val-badge){display:inline-block;padding:3px 10px;border-radius:6px;font-size:12.5px;font-weight:700;font-feature-settings:'tnum';}
:deep(.val-green){background:var(--green-light);color:#2d6b40;}
:deep(.val-orange){background:var(--orange-light);color:#7a4818;}
:deep(.val-red){background:var(--red-light);color:#862624;}
:deep(.val-count){font-size:11px;color:var(--text-dim);background:var(--bg-alt);padding:2px 8px;border-radius:5px;}
:deep(.month-grid){display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px;}
:deep(.day-card){background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(249,252,250,.84));border:1px solid var(--glass-line);border-radius:var(--r-lg);padding:20px 22px;box-shadow:0 10px 28px rgba(66,98,81,.08);backdrop-filter:blur(8px);transition:all .2s;position:relative;overflow:hidden;}
:deep(.day-card:hover){box-shadow:0 14px 32px rgba(66,98,81,.1);border-color:rgba(122,170,150,.5);transform:translateY(-1px);}
:deep(.day-card.loading-day::after){content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--mint-light),var(--mint),var(--mint-light));background-size:200% 100%;animation:shimmer 1.2s linear infinite;}
@keyframes shimmer{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
:deep(.day-card-date){font-size:15px;font-weight:700;letter-spacing:-.2px;margin-bottom:12px;}
:deep(.day-card-stats){display:grid;grid-template-columns:1fr 1fr;gap:8px;}
:deep(.day-stat){display:flex;flex-direction:column;gap:2px;}
:deep(.day-stat-label){font-size:10px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px;}
:deep(.day-stat-val){font-size:15px;font-weight:700;color:var(--text);font-feature-settings:'tnum';}
:deep(.day-card-footer){margin-top:14px;font-size:11.5px;color:var(--text-dim);display:flex;align-items:center;justify-content:space-between;}
:deep(.day-card.no-data){opacity:.5;cursor:default;}

/* Pagination */
.pagination{display:flex;align-items:center;justify-content:center;gap:6px;padding:20px 0 4px;flex-wrap:wrap;}
.page-btn{min-width:36px;height:36px;padding:0 10px;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-sm);font-size:13px;font-weight:500;color:var(--text-mid);transition:all .15s;display:flex;align-items:center;justify-content:center;cursor:pointer;}
.page-btn:hover{border-color:var(--mint);color:var(--mint-dark);background:var(--mint-xlight);}
.page-btn.active{background:var(--mint);border-color:var(--mint);color:#fff;box-shadow:0 2px 8px rgba(122,170,150,.35);}
.page-btn:disabled{opacity:.4;cursor:default;}
.page-info{font-size:12px;color:var(--text-dim);padding:0 4px;}

/* Account sidebar */
.acct-overlay{display:none;position:fixed;inset:0;z-index:400;}
.acct-overlay.open{display:block;}
.acct-backdrop{position:absolute;inset:0;background:rgba(30,45,38,.18);}
.acct-sidebar{position:absolute;top:0;right:0;bottom:0;width:320px;max-width:92vw;background:var(--surface);box-shadow:var(--shadow-md);display:flex;flex-direction:column;animation:slideIn .22s ease;}
@keyframes slideIn{from{transform:translateX(100%);}to{transform:translateX(0);}}
.acct-header{display:flex;align-items:center;justify-content:space-between;padding:20px 22px 16px;border-bottom:1px solid var(--border-light);}
.acct-header h3{font-size:15px;font-weight:700;}
.acct-close{width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:transparent;border:none;border-radius:var(--r-sm);color:var(--text-dim);font-size:18px;cursor:pointer;transition:all .15s;}
.acct-close:hover{background:var(--bg-alt);color:var(--text);}
.acct-search-wrap{padding:12px 16px;border-bottom:1px solid var(--border-light);}
.acct-search{width:100%;padding:9px 12px;background:var(--bg-alt);border:1.5px solid var(--border);border-radius:var(--r-md);font-size:13px;font-family:inherit;color:var(--text);outline:none;transition:border-color .15s;}
.acct-search:focus{border-color:var(--mint);}
.acct-list{flex:1;overflow-y:auto;padding:8px 10px;}
.acct-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r-md);cursor:pointer;transition:background .13s;margin-bottom:2px;}
.acct-item:hover{background:var(--bg-alt);}
.acct-item.active{background:var(--mint-xlight);border:1.5px solid var(--mint-light);}
.acct-dot{width:8px;height:8px;border-radius:50%;background:var(--mint);flex-shrink:0;}
.acct-dot.all{background:var(--text-dim);}
.acct-name{font-size:14px;font-weight:600;flex:1;}
.acct-item.active .acct-name{color:var(--mint-dark);}
.acct-check{color:var(--mint);font-size:14px;}

/* Footer */
.site-footer{text-align:center;padding:22px 40px;border-top:1px solid var(--border-light);margin-top:32px;font-size:13px;color:var(--text-dim);display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;}
.site-footer a{color:var(--mint-mid);text-decoration:none;font-weight:600;}
.site-footer a:hover{color:var(--mint-dark);}
.footer-sep{color:var(--border);}
.footer-author{font-weight:700;color:var(--text-mid);}

@media(max-width:800px){.dash-main{padding-left:16px;padding-right:16px;}:deep(.hour-stats){display:none;}:deep(.month-grid){grid-template-columns:1fr 1fr;}.trend-panel{display:none;}}
@media(max-width:480px){:deep(.month-grid){grid-template-columns:1fr;}}
</style>
