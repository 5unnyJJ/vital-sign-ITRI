<template>
  <div class="ps-main">
    <!-- Header -->
    <div class="ps-header">
      <div>
        <div class="ps-title">🧘 動作姿態統計</div>
        <div class="ps-subtitle">{{ subtitle }}</div>
      </div>
      <button class="btn-back" @click="router.push('/overview')" aria-label="返回總覽">← 返回總覽</button>
    </div>

    <!-- Toolbar -->
    <div class="ps-toolbar">
      <div class="ps-toolbar-group">
        <span class="ps-toolbar-label">👤 會員</span>
        <select class="ps-select" v-model="selectedMemberId" @change="updateDetailBtnVisible">
          <option value="ALL">全部</option>
          <option v-for="m in memberOptions" :key="m" :value="m">{{ m }}</option>
        </select>
      </div>
      <div class="ps-toolbar-group">
        <span class="ps-toolbar-label">📅 日期</span>
        <button class="ps-date-btn" @click="openPsCal">
          {{ selectedDate || '選擇日期' }}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="margin-left:6px;flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </button>
      </div>
      <button type="button" class="ps-btn ps-btn-primary" :disabled="loading" @click="loadData" style="align-self:flex-end">
        <svg v-if="loading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="animation:spin .7s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        {{ loading ? '載入中...' : '載入資料' }}
      </button>
      <button type="button" class="ps-btn" @click="downloadCSV" style="align-self:flex-end;background:#fff;border:1.5px solid var(--border);">
        📥 匯出數據
      </button>
      <button
        v-if="showDetailBtn"
        type="button"
        class="ps-btn"
        @click="goMemberDetail"
        style="align-self:flex-end;background:#fff;border:1.5px solid var(--border);"
      >
        👤 查看詳情
      </button>
    </div>

    <!-- Content area -->
    <div id="ps-content">
      <!-- Empty state -->
      <div v-if="state === 'empty'" class="ps-empty">
        <div class="ps-empty-icon">📋</div>
        <div>請選擇條件後載入資料</div>
      </div>

      <!-- Loading state -->
      <div v-else-if="state === 'loading'" class="ps-loading">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="animation:spin .7s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        <span>載入中...</span>
      </div>

      <!-- No data -->
      <div v-else-if="state === 'nodata'" class="ps-empty">
        <div class="ps-empty-icon">📭</div>
        <div>查無資料，請調整日期或會員條件後重新載入</div>
      </div>

      <!-- Data loaded -->
      <template v-else-if="state === 'loaded'">
        <!-- KPI Row -->
        <div class="ps-kpi-row">
          <div class="ps-kpi" :style="`--kc:${topColor}`">
            <div class="ps-kpi-label">主要姿態</div>
            <div class="ps-kpi-main">
              <div class="ps-kpi-dot"></div>
              <div class="ps-kpi-val">{{ topLabel }}</div>
            </div>
            <div class="ps-kpi-sub">{{ topMin }} 分鐘・佔 {{ topPct }}%</div>
          </div>
          <div class="ps-kpi" style="--kc:var(--mint)">
            <div class="ps-kpi-label">有效分鐘</div>
            <div class="ps-kpi-num">{{ minuteRows.length }}</div>
            <div class="ps-kpi-sub">分鐘（已過濾暖機）</div>
          </div>
          <div class="ps-kpi" style="--kc:#a855f7">
            <div class="ps-kpi-label">姿態種類</div>
            <div class="ps-kpi-num">{{ sortedActions.length }}</div>
            <div class="ps-kpi-sub">種不同動作</div>
          </div>
          <div class="ps-kpi" style="--kc:#f97316">
            <div class="ps-kpi-label">活動時段</div>
            <div class="ps-kpi-time">{{ activeStart }}</div>
            <div class="ps-kpi-sub">至 {{ activeEnd }}</div>
          </div>
        </div>

        <!-- Main grid: activity list + donut -->
        <div class="ps-main-grid">
          <div class="ps-card">
            <div class="ps-card-header">
              <div>
                <div class="ps-card-title">姿態明細</div>
                <div class="ps-card-desc">各動作佔比與時間</div>
              </div>
            </div>
            <div class="ps-card-body">
              <div class="ps-act-list">
                <div
                  v-for="[lbl, cnt] in sortedActions"
                  :key="lbl"
                  class="ps-act-item"
                  :style="`--ac:${actionColor(lbl)}`"
                >
                  <div class="ps-act-swatch"></div>
                  <div class="ps-act-body">
                    <div class="ps-act-top">
                      <span class="ps-act-name">{{ lbl }}</span>
                      <span class="ps-act-pct">{{ actionPct(cnt) }}%</span>
                    </div>
                    <div class="ps-progress-bg">
                      <div
                        class="ps-progress-fill"
                        :style="`width:${actionPct(cnt)}%;background:${actionColor(lbl)}`"
                      ></div>
                    </div>
                    <div class="ps-act-min">{{ cnt }} 分鐘</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="ps-card">
            <div class="ps-card-header">
              <div>
                <div class="ps-card-title">姿態分佈</div>
                <div class="ps-card-desc">各動作佔當日總時間比例</div>
              </div>
            </div>
            <div class="ps-card-body">
              <div v-html="donutHtml"></div>
            </div>
          </div>
        </div>

        <!-- Timeline card -->
        <div class="ps-card">
          <div class="ps-card-header">
            <div>
              <div class="ps-card-title">全天時間軸</div>
              <div class="ps-card-desc">24小時活動分佈，將滑鼠移至色塊查看時段詳情</div>
            </div>
          </div>
          <div class="ps-card-body">
            <div v-html="timelineHtml"></div>
          </div>
        </div>

        <!-- Export CSV card -->
        <div class="ps-card">
          <div class="ps-card-header">
            <div>
              <div class="ps-card-title">匯出 CSV</div>
              <div class="ps-card-desc">勾選要匯出的姿態類別</div>
            </div>
            <button class="ps-btn ps-btn-primary ps-btn-sm" @click="downloadCSV">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              匯出
            </button>
          </div>
          <div class="ps-card-body">
            <div class="ps-pill-group">
              <label
                v-for="def in actionDefs"
                :key="def.a"
                class="ps-pill"
                :class="checkedActions.has(def.a) ? `on-${def.a}` : ''"
                @click.prevent="toggleCheck(def.a)"
              >
                <input type="checkbox" style="display:none" :checked="checkedActions.has(def.a)" readonly>
                {{ def.l }}
              </label>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- 姿態日期月曆 Modal -->
  <div v-if="psCalOpen" class="det-cal-overlay" @click.self="psCalOpen = false">
    <div class="det-cal-panel">
      <div class="ps-cal-header">
        <button class="ps-cal-nav" @click="psCalChangeMonth(-1)">&#8592;</button>
        <span class="ps-cal-month-label">{{ psCalYearMonth }}</span>
        <button class="ps-cal-nav" @click="psCalChangeMonth(1)">&#8594;</button>
        <button class="det-cal-close" @click="psCalOpen = false">✕</button>
      </div>
      <div v-if="psCalLoading" class="ps-cal-loading">載入中…</div>
      <div v-else class="ps-cal-grid">
        <div v-for="d in ['日','一','二','三','四','五','六']" :key="d" class="ps-cal-dow">{{ d }}</div>
        <div v-for="cell in psCalCells" :key="cell.key"
          class="ps-cal-day"
          :class="{ 'has-data': cell.hasData, 'is-today': cell.isToday, 'empty': cell.empty }"
          @click="cell.hasData ? pickPsDay(cell.ds) : null"
        >{{ cell.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNavStore } from '@/stores/nav.js'
import { useAuthStore } from '@/stores/auth.js'
import { usePostureStore } from '@/stores/posture.js'
import { sb, TABLE_LABELS } from '@/lib/supabase.js'
import { todayStr, p2, escHtml } from '@/utils/format.js'
import { filterWarmupMinutes, aggregateToMinutes } from '@/utils/math.js'

const router = useRouter()
const navStore = useNavStore()
const authStore = useAuthStore()
const postureStore = usePostureStore()

// ── Action label / color maps ──────────────────────────────
const ACTION_LABEL_MAP = { 0:'靜止', 1:'走路', 2:'走路', 3:'慢跑', 4:'慢跑', 5:'快跑', 6:'躺姿', 7:'姿勢異常' }
const ACTION_LABEL_COLOR = { '靜止':'#94a3b8', '走路':'#3b82f6', '慢跑':'#22c55e', '快跑':'#f97316', '躺姿':'#a855f7', '姿勢異常':'#ef4444' }
function actionLabel(n) {
  if (n === null || n === undefined || n === '') return null
  const k = parseInt(n); return isNaN(k) ? null : (ACTION_LABEL_MAP[k] || null)
}
function actionColor(lbl) { return ACTION_LABEL_COLOR[lbl] || '#94a3b8' }

// ── State ──────────────────────────────────────────────────
const state = ref('empty')           // 'empty' | 'loading' | 'nodata' | 'loaded'
const loading = ref(false)
const subtitle = ref('選擇日期與會員後載入')
const minuteRows = ref([])           // aggregated + warmup-filtered rows
const actionCounts = ref({})         // { label: count }
const memberOptions = ref([])
const selectedMemberId = ref(postureStore.postureScreenMemberId || 'ALL')
const selectedDate = ref(postureStore.postureScreenDate || todayStr())
const showDetailBtn = computed(() => selectedMemberId.value && selectedMemberId.value !== 'ALL')
const checkedActions = ref(new Set(postureStore.postureCheckedActions))

const actionDefs = [
  { a: 0, l: '靜止' }, { a: 1, l: '走路' }, { a: 3, l: '慢跑' },
  { a: 5, l: '快跑' }, { a: 6, l: '躺姿' }, { a: 7, l: '姿勢異常' }
]

// ── Computed KPI ──────────────────────────────────────────
const sortedActions = computed(() => Object.entries(actionCounts.value).sort((a, b) => b[1] - a[1]))
const totalMinutes = computed(() => Object.values(actionCounts.value).reduce((s, v) => s + v, 0))
const topLabel = computed(() => sortedActions.value[0]?.[0] || '—')
const topMin = computed(() => sortedActions.value[0]?.[1] || 0)
const topPct = computed(() => totalMinutes.value ? Math.round(topMin.value / totalMinutes.value * 100) : 0)
const topColor = computed(() => actionColor(topLabel.value))
const activeStart = computed(() => minuteRows.value.length ? minuteRows.value[0].time.slice(11, 16) : '--')
const activeEnd = computed(() => minuteRows.value.length ? minuteRows.value[minuteRows.value.length - 1].time.slice(11, 16) : '--')
function actionPct(cnt) { return totalMinutes.value ? ((cnt / totalMinutes.value) * 100).toFixed(1) : 0 }

// ── Donut HTML ────────────────────────────────────────────
const donutHtml = computed(() => {
  const entries = sortedActions.value
  const total = totalMinutes.value
  if (!total) return ''
  const R = 44, cx = 55, cy = 55, circ = 2 * Math.PI * R
  let offset = 0, slices = ''
  entries.forEach(([lbl, cnt]) => {
    const frac = cnt / total, dash = frac * circ
    const color = actionColor(lbl)
    slices += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${color}" stroke-width="18" stroke-dasharray="${dash.toFixed(2)} ${(circ - dash).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"><title>${escHtml(lbl)}: ${cnt} 分鐘 (${Math.round(frac * 100)}%)</title></circle>`
    offset += dash
  })
  let legend = ''
  entries.forEach(([lbl, cnt]) => {
    const color = actionColor(lbl)
    const pct = Math.round(cnt / total * 100)
    legend += `<div class="ps-legend-item"><div class="ps-legend-swatch" style="background:${color}"></div><span class="ps-legend-name">${escHtml(lbl)}</span><span class="ps-legend-pct">${pct}%</span><span class="ps-legend-min">${cnt}分</span></div>`
  })
  return `<div class="ps-donut-row"><div class="ps-donut-wrap"><svg viewBox="0 0 110 110">${slices}<text x="55" y="51" text-anchor="middle" font-size="11" fill="var(--text-mid)" font-weight="600">${total}</text><text x="55" y="64" text-anchor="middle" font-size="9" fill="var(--text-dim)">分鐘</text></svg></div><div class="ps-donut-legend">${legend}</div></div>`
})

// ── Timeline HTML ─────────────────────────────────────────
const timelineHtml = computed(() => {
  const rows = minuteRows.value
  if (!rows.length) return ''
  const segs = []
  rows.forEach(r => {
    const t = r.time.slice(11, 16)
    const startMin = parseInt(t.slice(0, 2)) * 60 + parseInt(t.slice(3, 5))
    const lbl = actionLabel(r.action)
    const last = segs[segs.length - 1]
    if (last && last.lbl === lbl) { last.endMin = startMin + 1; last.count++ }
    else segs.push({ lbl, startMin, endMin: startMin + 1, count: 1 })
  })
  let rects = ''
  segs.forEach(s => {
    const x = (s.startMin / 1440 * 100).toFixed(3)
    const w = Math.max((s.endMin - s.startMin) / 1440 * 100, 0.07).toFixed(3)
    const color = actionColor(s.lbl)
    const h1 = String(Math.floor(s.startMin / 60)).padStart(2, '0') + ':' + String(s.startMin % 60).padStart(2, '0')
    const h2 = String(Math.floor(s.endMin / 60)).padStart(2, '0') + ':' + String(s.endMin % 60).padStart(2, '0')
    rects += `<rect x="${x}%" y="0" width="${w}%" height="100%" fill="${color}" rx="0"><title>${escHtml(s.lbl || '未知')}: ${h1} ～ ${h2}（${s.count} 分）</title></rect>`
  })
  const counts = actionCounts.value
  const legendItems = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([lbl]) => {
    const color = actionColor(lbl)
    return `<div class="ps-timeline-legend-item"><div class="ps-timeline-legend-dot" style="background:${color}"></div>${escHtml(lbl)}</div>`
  }).join('')
  return `<div class="ps-timeline-wrap"><div class="ps-timeline-labels"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div><div class="ps-timeline-bar-row"><svg viewBox="0 0 1440 52" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%">${rects}</svg></div><div class="ps-timeline-legend">${legendItems}</div></div>`
})

// ── Methods ───────────────────────────────────────────────
function updateDetailBtnVisible() { /* computed handles it */ }

// ── 姿態月曆 ─────────────────────────────────────────────
const psCalOpen = ref(false)
const psCalLoading = ref(false)
const psCalYear = ref(new Date().getFullYear())
const psCalMonth = ref(new Date().getMonth() + 1)
const psCalDaysWithData = ref(new Set())

const psCalYearMonth = computed(() => `${psCalYear.value}年${p2(psCalMonth.value)}月`)
const psCalCells = computed(() => {
  const year = psCalYear.value, month = psCalMonth.value
  const today = todayStr()
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push({ key: 'e' + i, empty: true, label: '' })
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${p2(month)}-${p2(d)}`
    cells.push({ key: ds, ds, empty: false, label: d, hasData: psCalDaysWithData.value.has(ds), isToday: ds === today })
  }
  return cells
})

async function openPsCal() {
  const base = selectedDate.value || todayStr()
  const d = new Date(base)
  psCalYear.value = d.getFullYear()
  psCalMonth.value = d.getMonth() + 1
  psCalOpen.value = true
  await loadPsCalMonth()
}

async function psCalChangeMonth(delta) {
  psCalMonth.value += delta
  if (psCalMonth.value < 1) { psCalMonth.value = 12; psCalYear.value-- }
  else if (psCalMonth.value > 12) { psCalMonth.value = 1; psCalYear.value++ }
  await loadPsCalMonth()
}

async function loadPsCalMonth() {
  const table = navStore.currentTable
  if (!table) return
  psCalLoading.value = true
  psCalDaysWithData.value = new Set()
  try {
    const year = psCalYear.value, month = psCalMonth.value
    const daysInMonth = new Date(year, month, 0).getDate()
    const filterMember = selectedMemberId.value !== 'ALL' ? selectedMemberId.value : null
    let q = sb.from(table).select('date_minute')
      .gte('date_minute', `${year}-${p2(month)}-01T00:00:00`)
      .lte('date_minute', `${year}-${p2(month)}-${p2(daysInMonth)}T23:59:59`)
      .limit(150000)
    if (filterMember) q = q.eq('member_id', filterMember)
    const { data, error } = await q
    if (!error && data) {
      const days = new Set()
      data.forEach(r => { if (r.date_minute) days.add(r.date_minute.slice(0, 10)) })
      psCalDaysWithData.value = days
    }
  } catch (e) { console.warn('psCalLoad error', e) }
  finally { psCalLoading.value = false }
}

function pickPsDay(dateStr) {
  selectedDate.value = dateStr
  psCalOpen.value = false
}

function toggleCheck(action) {
  const s = new Set(checkedActions.value)
  if (s.has(action)) s.delete(action)
  else s.add(action)
  checkedActions.value = s
  postureStore.postureCheckedActions = s
}

async function loadData() {
  const table = navStore.currentTable
  if (!table) { alert('請先選擇機構資料庫'); return }
  const date = selectedDate.value || todayStr()
  const memberId = selectedMemberId.value || 'ALL'

  postureStore.postureScreenDate = date
  postureStore.postureScreenMemberId = memberId
  loading.value = true
  state.value = 'loading'

  try {
    let q = sb.from(table)
      .select('member_id,date_minute,heartbeat,temp,sbp,dbp,breath,pulse,step,calorie,action')
      .gte('date_minute', date + 'T00:00:00')
      .lte('date_minute', date + 'T23:59:59.999')
      .order('date_minute', { ascending: true })
      .limit(100000)
    if (memberId !== 'ALL') q = q.eq('member_id', memberId)

    const { data, error } = await q
    if (error) throw error

    const rawRows = data || []
    const aggregated = aggregateToMinutes(rawRows)
    const filtered = filterWarmupMinutes(aggregated)

    minuteRows.value = filtered
    postureStore.postureScreenMinuteRows = filtered

    if (!filtered.length) {
      state.value = 'nodata'
      subtitle.value = `${TABLE_LABELS[table] || table} ／ ${date} ／ ${memberId === 'ALL' ? '全部' : memberId} ／ 無資料`
      return
    }

    // Compute action counts
    const counts = {}
    filtered.forEach(r => {
      if (r.action !== null && r.action !== undefined) {
        const lbl = actionLabel(r.action) || String(r.action)
        counts[lbl] = (counts[lbl] || 0) + 1
      }
    })
    actionCounts.value = counts
    state.value = 'loaded'
    subtitle.value = `${TABLE_LABELS[table] || table} ／ ${date} ／ ${memberId === 'ALL' ? '全部' : memberId} ／ ${filtered.length} 筆`
  } catch (err) {
    console.error('[PostureView] loadData error:', err)
    state.value = 'nodata'
    subtitle.value = '載入失敗：' + (err.message || String(err))
  } finally {
    loading.value = false
  }
}

function downloadCSV() {
  const rows = minuteRows.value
  if (!rows.length) { alert('沒有資料可匯出'); return }
  const allowedActions = checkedActions.value
  const filtered = rows.filter(r => r.action === null || r.action === undefined || allowedActions.has(parseInt(r.action)))
  const header = '時間,會員ID,動作代碼,動作名稱\n'
  const body = filtered.map(r => {
    const lbl = actionLabel(r.action) || ''
    return `${r.time},${r.member_id || ''},${r.action ?? ''},${lbl}`
  }).join('\n')
  const blob = new Blob(['﻿' + header + body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `動作姿態_${postureStore.postureScreenDate || todayStr()}_${postureStore.postureScreenMemberId || 'ALL'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function goMemberDetail() {
  const id = selectedMemberId.value
  if (id && id !== 'ALL') router.push('/detail/' + id)
}

async function initMemberList() {
  const table = navStore.currentTable
  if (!table) return
  try {
    const { data, error } = await sb.from('users')
      .select('member_id')
      .order('member_id', { ascending: true })
    if (!error && data) {
      memberOptions.value = data.map(r => r.member_id).filter(Boolean)
    }
  } catch {
    // fallback: no member list
  }
}

onMounted(() => {
  if (!selectedDate.value) selectedDate.value = todayStr()
  initMemberList()
  // Initialize checked actions: default all checked
  if (checkedActions.value.size === 0) {
    checkedActions.value = new Set([0, 1, 3, 5, 6, 7])
  }
})
</script>

<style scoped>
/* ══ POSTURE SCREEN ══ */
.ps-main{padding:12px 48px 72px;max-width:1320px;margin:0 auto;display:flex;flex-direction:column;gap:28px;}
#ps-content{display:flex;flex-direction:column;gap:20px;scroll-margin-top:140px;}
.ps-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px;padding-bottom:8px;border-bottom:1px solid var(--border-light);}
.ps-title{font-size:26px;font-weight:800;letter-spacing:-.4px;color:var(--text);}
.ps-subtitle{font-size:13px;color:var(--text-dim);margin-top:5px;line-height:1.6;}

.ps-toolbar{display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap;padding:18px 22px;background:var(--bg-alt);border:1px solid var(--border);border-radius:16px;box-shadow:0 2px 8px rgba(40,70,55,.07);position:-webkit-sticky;position:sticky;top:0;z-index:20;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);}
.ps-toolbar-group{display:flex;flex-direction:column;gap:5px;}
.ps-toolbar-label{font-size:11px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:.7px;white-space:nowrap;}
.ps-date-input,.ps-select{height:38px;padding:0 14px;background:#fff;border:1.5px solid var(--border);border-radius:10px;font-size:15px;font-family:inherit;color:var(--text);outline:none;cursor:pointer;transition:border-color .15s,box-shadow .15s;-webkit-appearance:none;appearance:auto;}
.ps-date-input{min-width:175px;width:175px;}
.ps-date-btn{height:38px;padding:0 14px;background:#fff;border:1.5px solid var(--border);border-radius:10px;font-size:14px;font-family:inherit;color:var(--text);outline:none;cursor:pointer;transition:border-color .15s,box-shadow .15s;min-width:175px;display:flex;align-items:center;font-weight:500;}
.ps-date-btn:hover{border-color:var(--mint);box-shadow:0 0 0 3px rgba(122,170,150,.18);}
/* 月曆 Modal（scoped 版，共用 det-cal-* 命名） */
.det-cal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.38);z-index:500;display:flex;align-items:center;justify-content:center;}
.det-cal-panel{background:#fff;border-radius:var(--r-xl);box-shadow:0 20px 60px rgba(40,70,55,.18);padding:20px;min-width:300px;max-width:340px;width:90vw;}
.det-cal-close{margin-left:auto;background:transparent;border:none;font-size:16px;color:var(--text-dim);cursor:pointer;padding:4px 8px;border-radius:var(--r-sm);}
.det-cal-close:hover{background:var(--bg-alt);color:var(--text);}
.ps-cal-header{display:flex;align-items:center;gap:8px;margin-bottom:14px;}
.ps-cal-month-label{flex:1;text-align:center;font-size:15px;font-weight:700;color:var(--text);}
.ps-cal-nav{background:transparent;border:1.5px solid var(--border);border-radius:var(--r-sm);padding:5px 12px;color:var(--text-mid);cursor:pointer;font-size:16px;transition:all .13s;}
.ps-cal-nav:hover{border-color:var(--mint);color:var(--mint-dark);background:var(--mint-xlight);}
.ps-cal-loading{text-align:center;padding:24px;font-size:13px;color:var(--text-dim);}
.ps-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
.ps-cal-dow{display:flex;align-items:center;justify-content:center;height:32px;font-size:11px;font-weight:600;color:var(--text-dim);}
.ps-cal-day{display:flex;align-items:center;justify-content:center;height:36px;border-radius:var(--r-sm);font-size:13px;color:var(--text-dim);opacity:.35;cursor:default;position:relative;}
.ps-cal-day.has-data{opacity:1;color:var(--mint-dark);background:var(--mint-xlight);border:1px solid var(--mint-light);cursor:pointer;font-weight:600;}
.ps-cal-day.has-data:hover{background:var(--mint-light);border-color:var(--mint);transform:scale(1.06);}
.ps-cal-day.is-today::after{content:'';position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:var(--orange);}
.ps-cal-day.empty{opacity:0;pointer-events:none;}
.ps-select{min-width:150px;}
.ps-date-input:focus,.ps-select:focus{border-color:var(--mint);box-shadow:0 0 0 3px rgba(122,170,150,.18);}

.ps-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:46px;padding:0 20px;border:none;border-radius:10px;font-size:14px;font-weight:600;transition:all .15s;white-space:nowrap;cursor:pointer;}
.ps-btn-primary{background:var(--mint);color:#fff;box-shadow:0 2px 6px rgba(122,170,150,.4);}
.ps-btn-primary:hover{background:var(--mint-mid);}
.ps-btn-primary:disabled{opacity:.5;cursor:not-allowed;}
.ps-btn-sm{height:34px;padding:0 14px;font-size:12px;font-weight:600;border-radius:7px;}
.ps-btn-ghost{background:transparent;color:var(--text-mid);border:1px solid var(--border);}
.ps-btn-ghost:hover{border-color:var(--mint);color:var(--mint-dark);background:var(--mint-xlight);}

.ps-card{background:#fff;border:1px solid var(--border);border-radius:12px;box-shadow:0 1px 3px rgba(40,70,55,.06),0 4px 12px rgba(40,70,55,.04);overflow:hidden;}
.ps-card-header{padding:20px 24px 14px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between;gap:12px;}
.ps-card-title{font-size:14px;font-weight:700;color:var(--text);}
.ps-card-desc{font-size:12px;color:var(--text-dim);margin-top:2px;}
.ps-card-body{padding:24px;}

.ps-kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;scroll-margin-top:140px;}
.ps-kpi{background:#fff;border:1px solid var(--border);border-radius:14px;padding:22px 24px 18px;position:relative;overflow:hidden;box-shadow:0 1px 4px rgba(40,70,55,.06),0 4px 12px rgba(40,70,55,.04);display:flex;flex-direction:column;gap:4px;}
.ps-kpi::before{content:'';position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--kc,var(--mint));border-radius:14px 0 0 14px;}
.ps-kpi-label{font-size:11px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:.6px;}
.ps-kpi-num{font-size:36px;font-weight:800;color:var(--text);line-height:1;font-variant-numeric:tabular-nums;margin:8px 0 2px;}
.ps-kpi-main{display:flex;align-items:center;gap:8px;margin:8px 0 2px;}
.ps-kpi-dot{width:11px;height:11px;border-radius:50%;background:var(--kc,var(--mint));flex-shrink:0;}
.ps-kpi-val{font-size:24px;font-weight:800;color:var(--text);line-height:1;}
.ps-kpi-sub{font-size:12px;color:var(--text-dim);margin-top:2px;}
.ps-kpi-time{font-size:26px;font-weight:800;color:var(--text);line-height:1;font-variant-numeric:tabular-nums;margin:8px 0 2px;letter-spacing:.02em;}
.ps-main-grid{display:grid;grid-template-columns:55fr 45fr;gap:20px;align-items:start;}
.ps-act-list{display:flex;flex-direction:column;gap:10px;}
.ps-act-item{display:flex;align-items:stretch;border-radius:10px;overflow:hidden;background:var(--bg-alt);border:1px solid var(--border-light);transition:box-shadow .15s;}
.ps-act-item:hover{box-shadow:0 2px 8px rgba(40,70,55,.08);}
.ps-act-swatch{width:6px;flex-shrink:0;background:var(--ac,#94a3b8);}
.ps-act-body{flex:1;padding:14px 18px;}
.ps-act-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:10px;}
.ps-act-name{font-size:14px;font-weight:700;color:var(--text);}
.ps-act-pct{font-size:20px;font-weight:800;color:var(--ac,#94a3b8);font-variant-numeric:tabular-nums;line-height:1;}
.ps-act-min{font-size:11px;color:var(--text-dim);margin-top:7px;font-variant-numeric:tabular-nums;}

.ps-progress-wrap{margin-top:8px;}
.ps-progress-bg{height:6px;background:#f1f5f9;border-radius:999px;overflow:hidden;}
.ps-progress-fill{height:100%;border-radius:999px;transition:width .5s cubic-bezier(.4,0,.2,1);}

/* Donut (injected via v-html) */
:deep(.ps-donut-row){display:flex;align-items:center;gap:28px;flex-wrap:wrap;justify-content:center;}
:deep(.ps-donut-wrap){width:200px;height:200px;flex-shrink:0;}
:deep(.ps-donut-wrap) svg{width:100%;height:100%;}
:deep(.ps-donut-legend){display:flex;flex-direction:column;gap:10px;flex:1;min-width:130px;}
:deep(.ps-legend-item){display:flex;align-items:center;gap:10px;font-size:13px;}
:deep(.ps-legend-swatch){width:12px;height:12px;border-radius:3px;flex-shrink:0;}
:deep(.ps-legend-name){flex:1;color:var(--text-mid);font-weight:500;}
:deep(.ps-legend-pct){font-size:12px;font-weight:700;color:var(--text);font-variant-numeric:tabular-nums;}
:deep(.ps-legend-min){font-size:11px;color:var(--text-dim);font-variant-numeric:tabular-nums;}

/* Timeline (injected via v-html) */
:deep(.ps-timeline-wrap){display:flex;flex-direction:column;gap:10px;}
:deep(.ps-timeline-bar-row){position:relative;height:52px;border-radius:10px;overflow:hidden;background:#f1f5f9;}
:deep(.ps-timeline-bar-row) svg{position:absolute;inset:0;width:100%;height:100%;}
:deep(.ps-timeline-labels){display:flex;justify-content:space-between;font-size:11px;color:var(--text-dim);padding:0 2px;}
:deep(.ps-timeline-legend){display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;}
:deep(.ps-timeline-legend-item){display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-mid);font-weight:500;}
:deep(.ps-timeline-legend-dot){width:10px;height:10px;border-radius:3px;flex-shrink:0;}

/* States */
.ps-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:80px 32px;color:var(--text-dim);font-size:14px;text-align:center;}
.ps-empty-icon{font-size:40px;opacity:.35;}
.ps-loading{display:flex;align-items:center;justify-content:center;gap:12px;padding:72px;color:var(--text-dim);font-size:14px;}

/* Export pills */
.ps-pill-group{display:flex;flex-wrap:wrap;gap:8px;}
.ps-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border:1.5px solid var(--border);border-radius:999px;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;user-select:none;color:var(--text-mid);background:#fff;}
.ps-pill:hover{border-color:var(--mint);background:var(--mint-xlight);color:var(--mint-dark);}
.ps-pill.on-0{border-color:#94a3b8;background:#f8fafc;color:#475569;}
.ps-pill.on-1,.ps-pill.on-2{border-color:#3b82f6;background:#eff6ff;color:#1d4ed8;}
.ps-pill.on-3,.ps-pill.on-4{border-color:#22c55e;background:#f0fdf4;color:#15803d;}
.ps-pill.on-5{border-color:#f97316;background:#fff7ed;color:#c2410c;}
.ps-pill.on-6{border-color:#a855f7;background:#faf5ff;color:#7e22ce;}
.ps-pill.on-7{border-color:#ef4444;background:#fef2f2;color:#b91c1c;}

.btn-back{display:flex;align-items:center;gap:6px;padding:8px 14px;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-md);color:var(--text-mid);font-size:14px;font-weight:600;transition:all .15s;cursor:pointer;}
.btn-back:hover{border-color:var(--mint);color:var(--mint-dark);background:var(--mint-xlight);}

@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:1100px){.ps-kpi-row{grid-template-columns:repeat(2,1fr);}.ps-main-grid{grid-template-columns:1fr;}}
@media(max-width:700px){.ps-main{padding:20px 16px 40px;gap:20px;}.ps-toolbar{position:static;top:auto;}.ps-date-input,.ps-select,.ps-btn{width:100%;}.ps-title{font-size:22px;}.ps-kpi-row{grid-template-columns:1fr 1fr;}}
@media(max-width:600px){.ps-kpi-row{grid-template-columns:1fr 1fr;}}
@media(max-width:480px){.ps-kpi-row{grid-template-columns:1fr;}}
</style>
