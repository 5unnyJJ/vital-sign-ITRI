<template>
  <div class="ov-main">
    <!-- Header -->
    <div class="ov-header">
      <div class="ov-title-group">
        <div class="ov-title">{{ headerTitle }}</div>
        <div class="ov-subtitle">{{ headerSubtitle }}</div>
        <div v-if="freshnessText" class="ov-freshness" style="font-size:12px;color:var(--text-light);margin-top:2px;">{{ freshnessText }}</div>
        <div v-if="errorBanner" class="ov-error-banner">
          {{ errorBanner }}
          <span style="cursor:pointer;text-decoration:underline;margin-left:8px;" @click="retryLoad">重試</span>
        </div>
      </div>
      <div class="ov-header-right">
        <!-- Institution tabs -->
        <div class="ov-inst-tabs" v-if="authStore.tables.length > 1">
          <button
            v-for="t in authStore.tables"
            :key="t"
            class="tab"
            :class="{ active: navStore.currentTable === t }"
            @click="switchTable(t)"
          >
            <span class="tab-dot"></span>{{ TABLE_LABELS[t] || t }}
          </button>
        </div>
        <!-- View toggle -->
        <div class="ov-view-toggle">
          <button
            class="ov-view-btn"
            :class="{ active: overviewMode === 'today' }"
            @click="setMode('today')"
          >今日會員</button>
          <button
            class="ov-view-btn"
            :class="{ active: overviewMode === 'all' }"
            @click="setMode('all')"
          >全部會員</button>
        </div>
        <!-- HF button -->
        <button class="btn-scan" @click="router.push('/hf')" title="心衰生理資料模組" style="margin-right:6px;">
          🫀 心衰資料
        </button>
        <!-- Compare mode -->
        <button class="btn-scan" :class="{ 'btn-scan-active': compareMode }" @click="toggleCompareMode" title="選擇多位成員進行同時監測" style="margin-right:6px;">
          ⚖️ {{ compareMode ? `已選 ${compareSet.size} 位` : '多人監測' }}
        </button>
        <button v-if="compareMode && compareSet.size >= 2" class="btn-scan btn-compare-go" @click="openCompareModal" style="margin-right:6px;">
          查看比較 →
        </button>
        <!-- Scan button -->
        <button class="btn-scan" :disabled="scanning" @click="rescan">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" :style="scanning ? 'animation:spin .7s linear infinite' : ''">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          重新掃描
        </button>
      </div>
    </div>

    <!-- Scan progress -->
    <div class="ov-scan-label" :class="{ hidden: !scanning && !scanLabel }">{{ scanLabel }}</div>
    <div class="ov-scan-bar-wrap" :class="{ hidden: !scanning }">
      <div class="ov-scan-bar" :style="`width:${scanPct}%`"></div>
    </div>

    <!-- Member grid -->
    <div class="member-grid">
      <!-- Loading skeletons -->
      <template v-if="skeletonIds.length > 0 && state === 'loading'">
        <div
          v-for="mid in skeletonIds"
          :key="'skel-' + mid"
          class="member-card skel-card"
        >
          <div class="mc-head">
            <div class="mc-avatar ok">{{ (mid[0] || '?').toUpperCase() }}</div>
            <div class="mc-info">
              <div class="mc-id">{{ mid }}</div>
            </div>
          </div>
          <div class="mc-vitals">
            <div v-for="lbl in ['心跳','收縮壓','體溫','呼吸']" :key="lbl" class="mc-vital">
              <div class="mc-vital-label">{{ lbl }}</div>
              <div class="mc-vital-val" style="color:var(--text-dim)">--</div>
            </div>
          </div>
          <div class="mc-footer">
            <span class="mc-time">資料載入中…</span>
            <span class="mc-arrow">查看詳情</span>
          </div>
        </div>
      </template>

      <!-- Empty state: no table selected -->
      <div v-else-if="!navStore.currentTable" class="ov-empty">
        <div class="ov-empty-icon">🏥</div>
        <p>請先選擇機構</p>
        <small>點選上方機構標籤後自動載入</small>
      </div>

      <!-- Empty state: no data -->
      <div v-else-if="state === 'empty'" class="ov-empty">
        <div class="ov-empty-icon">📭</div>
        <p>{{ overviewMode === 'today' ? '今日尚無會員資料' : '目前查無會員資料' }}</p>
        <small>{{ overviewMode === 'today' ? '若裝置已開機請稍後重新掃描' : '請先確認是否已有歷史會員量測資料' }}</small>
      </div>

      <!-- Member cards -->
      <template v-else-if="state === 'loaded' || state === 'loading'">
        <div
          v-for="mid in displayMembers"
          :key="mid"
          class="member-card"
          :class="[cardStatusClass(mid), compareMode && compareSet.has(mid) ? 'compare-selected' : '']"
          @click="compareMode ? toggleCompareSelect(mid) : goDetail(mid)"
        >
          <div class="mc-head">
            <div class="mc-avatar" :class="cardAvatarClass(mid)">{{ (mid[0] || '?').toUpperCase() }}</div>
            <div class="mc-info">
              <div class="mc-id" :title="mid">{{ mid }}</div>
              <div class="mc-status-badge" :class="cardAvatarClass(mid)">{{ cardStatusLabel(mid) }}</div>
            </div>
          </div>
          <div class="mc-vitals">
            <div class="mc-vital">
              <div class="mc-vital-label">心跳</div>
              <div class="mc-vital-val" :class="vitalColorClass('heartbeat', cardVal(mid, 'heartbeat'))">
                {{ fmtVal(cardVal(mid, 'heartbeat')) }}
              </div>
            </div>
            <div class="mc-vital">
              <div class="mc-vital-label">收縮壓</div>
              <div class="mc-vital-val" :class="vitalColorClass('sbp', cardVal(mid, 'sbp'))">
                {{ fmtVal(cardVal(mid, 'sbp')) }}
              </div>
            </div>
            <div class="mc-vital">
              <div class="mc-vital-label">體溫</div>
              <div class="mc-vital-val" :class="vitalColorClass('temp', cardVal(mid, 'temp'))">
                {{ fmtTemp(cardVal(mid, 'temp')) }}
              </div>
            </div>
            <div class="mc-vital">
              <div class="mc-vital-label">呼吸</div>
              <div class="mc-vital-val">{{ fmtVal(cardVal(mid, 'breath')) }}</div>
            </div>
          </div>
          <div class="mc-footer">
            <span class="mc-time">{{ cardTimeLabel(mid) }}</span>
            <span class="mc-arrow">查看詳情</span>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- Compare modal -->
  <div v-if="compareModalOpen" class="compare-overlay" @click.self="compareModalOpen = false">
    <div class="compare-modal">
      <div class="compare-modal-header">
        <span class="compare-modal-title">⚖️ 多人監測比較</span>
        <button class="compare-modal-close" @click="compareModalOpen = false">✕</button>
      </div>
      <div v-if="compareLoading" class="compare-loading">載入中…</div>
      <div v-else class="compare-modal-body">
        <div v-for="item in compareResults" :key="item.mid" class="compare-member-block">
          <div class="compare-member-title">{{ item.mid }}</div>
          <div class="compare-vitals">
            <div class="compare-vital-chip">❤️ 心跳 <strong>{{ item.hb ?? '--' }}</strong></div>
            <div class="compare-vital-chip">🩺 收縮壓 <strong>{{ item.sbp ?? '--' }}</strong></div>
            <div class="compare-vital-chip">🌡 體溫 <strong>{{ item.temp ?? '--' }}</strong></div>
            <div class="compare-vital-chip">🫁 呼吸 <strong>{{ item.br ?? '--' }}</strong></div>
          </div>
          <div v-if="item.chartHtml" v-html="item.chartHtml" class="compare-chart"></div>
          <div v-else class="compare-no-data">今日無量測資料</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNavStore } from '@/stores/nav.js'
import { useAuthStore } from '@/stores/auth.js'
import { useOverviewStore } from '@/stores/overview.js'
import { sb, TABLE_LABELS, RPC_TABLE_MAP } from '@/lib/supabase.js'
import { todayStr } from '@/utils/format.js'
import { avg, anomalyLevel } from '@/utils/math.js'
import { loadScanCache, saveScanCache } from '@/utils/cache.js'
import { trendSVG } from '@/utils/chart.js'

const router = useRouter()
const navStore = useNavStore()
const authStore = useAuthStore()
const overviewStore = useOverviewStore()

// ── State ──────────────────────────────────────────────────
const state = ref('idle')           // 'idle' | 'loading' | 'loaded' | 'empty'
const overviewMode = ref('today')   // 'today' | 'all'
const scanning = ref(false)
const scanPct = ref(0)
const scanLabel = ref('')
const freshnessText = ref('')
const errorBanner = ref('')
const skeletonIds = ref([])

// Card data: { memberId: [row, ...] }
const todayGroups = ref({})
const allGroups = ref({})
const memberList = ref([])

// Compare mode
const compareMode = ref(false)
const compareSet = ref(new Set())
const compareModalOpen = ref(false)
const compareLoading = ref(false)
const compareResults = ref([])

// ── Helpers ────────────────────────────────────────────────
function memberSearchToken(v) { return String(v ?? '').trim().replace(/\s+/g, '').toLowerCase() }
function memberSort(a, b) { return String(a).localeCompare(String(b), 'zh-Hant', { numeric: true, sensitivity: 'base' }) }
function uniqueMemberIds(rows) {
  const seen = new Set(), ids = []
  ;(rows || []).forEach(r => {
    const raw = String(r?.member_id ?? '').trim()
    const token = memberSearchToken(raw)
    if (!token || seen.has(token)) return
    seen.add(token); ids.push(raw)
  })
  return ids.sort(memberSort)
}
function isMemberIdValidForOrg(memberId, table) {
  const org = authStore.orgByTable[table]
  if (!org || !org.org_code) return true
  const code = org.org_code.toUpperCase()
  return String(memberId).toUpperCase().startsWith(code)
}
function getAllowedMemberTokenSet(table) {
  if (!(table in authStore.memberIdsByTable)) return null
  const ids = authStore.memberIdsByTable[table] || []
  if (!ids.length) return null  // empty list = no filter (don't block all members)
  return new Set(ids.map(memberSearchToken).filter(Boolean))
}

// 分頁抓全部列（對應原版 fetchPagedRows）
async function fetchPagedRows(table, applyQuery, pageSize = 1000) {
  let all = [], page = 0
  while (true) {
    let q = sb.from(table).select('member_id').order('member_id', { ascending: true })
    q = applyQuery ? applyQuery(q) : q
    const { data, error } = await q.range(page * pageSize, (page + 1) * pageSize - 1)
    if (error || !data || !data.length) break
    all = all.concat(data)
    if (data.length < pageSize) break
    page++
  }
  return all
}

// 載入機構對照表（orgByTable）— 原版 loadOrganizations()
async function loadOrganizations() {
  if (Object.keys(authStore.orgByTable).length > 0) return // 已載入，跳過
  try {
    const { data, error } = await sb.from('organizations').select('id,org_code,org_name,table_name').not('table_name', 'is', null)
    if (!error && data) {
      const map = {}
      data.forEach(org => { map[org.table_name] = { id: org.id, org_code: org.org_code, org_name: org.org_name } })
      authStore.orgByTable = map
    }
  } catch (e) { console.warn('[Org] loadOrganizations failed:', e.message) }
}

async function fetchAllMemberIds(table) {
  const org = authStore.orgByTable[table]
  if (org) {
    const { data, error } = await sb.from('users').select('member_id').eq('org_id', org.id).order('member_id', { ascending: true })
    if (!error && data?.length) {
      // org_id filter already ensures correct org; no additional prefix check needed here
      // (users.member_id format may differ from data table format, e.g. TEST_DC001 vs DC001)
      const ids = uniqueMemberIds(data)
      if (ids.length) {
        authStore.memberIdsByTable[table] = ids
        return ids
      }
    }
  }
  // fallback：分頁掃描 vital signs table + dominant prefix 過濾（防止跨機構 ID 混入）
  const rows = await fetchPagedRows(table, null, 1000)
  const rawIds = uniqueMemberIds(rows).filter(id => id && isMemberIdValidForOrg(id, table))
  const prefixCount = {}
  rawIds.forEach(id => {
    const m = String(id).match(/^([A-Za-z]{2,4})/)
    if (m) prefixCount[m[1].toUpperCase()] = (prefixCount[m[1].toUpperCase()] || 0) + 1
  })
  const dominant = Object.entries(prefixCount).sort((a, b) => b[1] - a[1])[0]?.[0]
  const ids = dominant ? rawIds.filter(id => String(id).toUpperCase().startsWith(dominant)) : rawIds
  authStore.memberIdsByTable[table] = ids
  return ids
}

// ── Computed display ──────────────────────────────────────
const sourceData = computed(() => {
  const all = allGroups.value
  const today = todayGroups.value
  return (all && Object.keys(all).length) ? all : today
})
const displaySource = computed(() => {
  if (overviewMode.value !== 'today') return sourceData.value
  const base = sourceData.value || {}
  const today = todayGroups.value || {}
  if (!Object.keys(base).length) return today
  if (!Object.keys(today).length) return base
  return { ...base, ...today }
})
const displayMembers = computed(() => {
  const src = displaySource.value
  const allowed = getAllowedMemberTokenSet(navStore.currentTable)
  const keys = Object.keys(src).filter(mid => !allowed || allowed.has(memberSearchToken(mid)))
  return keys.sort(memberSort)
})

const headerTitle = computed(() => {
  const t = navStore.currentTable
  const label = TABLE_LABELS[t] || t || ''
  return label ? `${label} · ${overviewMode.value === 'today' ? '今日會員' : '全部會員'}` : '今日會員狀態'
})
const headerSubtitle = computed(() => {
  if (state.value === 'loading') return overviewMode.value === 'today' ? '今日資料讀取中...' : '全部會員資料讀取中...'
  const members = displayMembers.value
  if (!members.length) return overviewMode.value === 'today' ? `${todayStr()} · 今日無資料` : '目前查無會員資料'
  return overviewMode.value === 'today'
    ? `${todayStr()} · ${members.length} 位會員`
    : `全部會員 · ${members.length} 位會員`
})

// ── Card data helpers ─────────────────────────────────────
function cardRows(mid) {
  const src = displaySource.value
  return src[mid] || []
}
function cardVal(mid, field) {
  const rows = cardRows(mid)
  if (!rows.length) return null
  if (overviewMode.value === 'all') return rows[0]?.[field] ?? null
  return avg(rows.map(r => r[field]))
}
function fmtVal(v) { return v !== null && v !== undefined ? Math.round(v) : '--' }
function fmtTemp(v) { return v !== null && v !== undefined ? parseFloat(v).toFixed(1) + '°C' : '--' }
function vitalColorClass(key, v) {
  const lv = anomalyLevel(key, v)
  if (lv === 'red') return 'is-red'
  if (lv === 'orange') return 'is-orange'
  return ''
}
function cardOverallStatus(mid) {
  const hb = cardVal(mid, 'heartbeat')
  const sbp = cardVal(mid, 'sbp')
  const temp = cardVal(mid, 'temp')
  const rows = cardRows(mid)
  if (!rows.length) return 'none'
  const levels = [anomalyLevel('heartbeat', hb), anomalyLevel('sbp', sbp), anomalyLevel('temp', temp)].filter(l => l !== 'neutral' && l !== 'green')
  if (levels.includes('red')) return 'err'
  if (levels.includes('orange')) return 'warn'
  return 'ok'
}
function cardAvatarClass(mid) { return cardOverallStatus(mid) }
function cardStatusClass(mid) {
  const s = cardOverallStatus(mid)
  if (s === 'err') return 'status-red'
  if (s === 'warn') return 'status-orange'
  return ''
}
function cardStatusLabel(mid) {
  const s = cardOverallStatus(mid)
  if (s === 'err') return '異常'
  if (s === 'warn') return '注意'
  if (s === 'none') return '無資料'
  return '正常'
}
function cardTimeLabel(mid) {
  const rows = cardRows(mid)
  if (!rows.length) return '--'
  const lastRow = rows.reduce((a, b) => (a.date_minute || '') > (b.date_minute || '') ? a : b)
  if (!lastRow.date_minute) return '--'
  if (overviewMode.value === 'all') return '最近資料 ' + lastRow.date_minute.slice(0, 16).replace('T', ' ')
  return '最後更新 ' + lastRow.date_minute.slice(11, 16) + ` · ${rows.length} 筆`
}

// ── Navigation ────────────────────────────────────────────
function goDetail(mid) { router.push('/detail/' + mid) }

// ── Mode & table ─────────────────────────────────────────
function setMode(mode) { overviewMode.value = mode }

// ── Compare mode ──────────────────────────────────────────
function toggleCompareMode() {
  compareMode.value = !compareMode.value
  if (!compareMode.value) { compareSet.value = new Set(); compareModalOpen.value = false }
}
function toggleCompareSelect(mid) {
  const s = new Set(compareSet.value)
  if (s.has(mid)) s.delete(mid); else s.add(mid)
  compareSet.value = s
}
async function openCompareModal() {
  compareModalOpen.value = true
  compareLoading.value = true
  compareResults.value = []
  const table = navStore.currentTable
  const today = todayStr()
  const ids = [...compareSet.value]
  try {
    const results = await Promise.all(ids.map(async mid => {
      const { data } = await sb.from(table)
        .select('member_id,heartbeat,temp,sbp,dbp,breath,date_minute')
        .eq('member_id', mid)
        .gte('date_minute', today + 'T00:00:00')
        .lte('date_minute', today + 'T23:59:59.999')
        .order('date_minute', { ascending: true })
        .limit(200)
      const rows = data || []
      const hb = rows.length ? avg(rows.map(r => r.heartbeat)) : null
      const sbp = rows.length ? avg(rows.map(r => r.sbp)) : null
      const temp = rows.length ? avg(rows.map(r => r.temp)) : null
      const br = rows.length ? avg(rows.map(r => r.breath)) : null
      let chartHtml = ''
      if (rows.length) {
        const labels = rows.map(r => r.date_minute.slice(11, 16))
        const series = [
          { label: '心跳 bpm', color: '#7aaa96', values: rows.map(r => r.heartbeat) },
          { label: '收縮壓 mmHg', color: '#b85450', values: rows.map(r => r.sbp) },
        ]
        chartHtml = trendSVG(series, labels, { sharedCursor: false }, 140)
      }
      return {
        mid,
        hb: hb !== null ? Math.round(hb) : null,
        sbp: sbp !== null ? Math.round(sbp) : null,
        temp: temp !== null ? parseFloat(temp).toFixed(1) : null,
        br: br !== null ? Math.round(br) : null,
        chartHtml,
      }
    }))
    compareResults.value = results
  } catch (e) { console.error('[Compare]', e) }
  finally { compareLoading.value = false }
}

function switchTable(name) {
  if (name === navStore.currentTable) return
  navStore.currentTable = name
  localStorage.setItem('vd_session_table', name)
  // data clearing and scan are handled by the navStore.currentTable watcher
}
function rescan() {
  const t = navStore.currentTable
  if (t) localStorage.removeItem(`vd_scan__${t}__${todayStr()}`)
  scanAndLoadCards()
}
function retryLoad() {
  errorBanner.value = ''
  rescan()
}
function stubCompare() {
  // TODO: implement compare mode (multi-member monitoring)
  console.info('[OverviewView] Compare mode not yet implemented')
  alert('多人監測模式尚未實作（TODO）')
}

// ── Scan & load ───────────────────────────────────────────
let _scanToken = 0
async function scanAndLoadCards() {
  const table = navStore.currentTable
  if (!table) return
  const myToken = ++_scanToken
  const today = todayStr()
  const start = today + 'T00:00:00', end = today + 'T23:59:59.999'

  errorBanner.value = ''
  freshnessText.value = ''

  // Try cache first
  const cached = loadScanCache(table, today)
  if (cached) {
    if (myToken !== _scanToken) return
    if (!authStore.memberIdsByTable[table]?.length) {
      authStore.memberIdsByTable[table] = (cached.memberList || []).filter(id => id && isMemberIdValidForOrg(id, table))
    }
    const cachedList = cached.memberList || []
    memberList.value = cachedList
    todayGroups.value = cached.todayGroups || {}
    allGroups.value = cached.allGroups || {}
    state.value = displayMembers.value.length ? 'loaded' : 'empty'
    scanning.value = false
    scanPct.value = 0
    if (cached.ts) {
      const cacheAgeMin = Math.round((Date.now() - cached.ts) / 60000)
      freshnessText.value = cacheAgeMin < 1 ? '顯示剛更新的快取資料' : `顯示 ${cacheAgeMin} 分鐘前的快取資料`
    }
    return
  }

  scanning.value = true
  scanPct.value = 20
  scanLabel.value = '讀取會員清單…'
  state.value = 'loading'
  skeletonIds.value = []

  try {
    // Phase 1: Fetch member IDs
    const allIds = await fetchAllMemberIds(table)
    if (myToken !== _scanToken) return

    const shellIds = [...allIds].sort(memberSort)
    memberList.value = shellIds
    skeletonIds.value = shellIds
    scanPct.value = 55
    scanLabel.value = '讀取生命徵象…'

    // Phase 2: Fetch vitals data via RPC or fallback
    const orgKnown = !!authStore.orgByTable[table]
    const newTodayGroups = {}
    const newAllGroups = {}

    const rpcName = RPC_TABLE_MAP[table]
    let rpcRows = null
    if (orgKnown && allIds.length && rpcName) {
      try {
        const { data, error } = await sb.rpc(rpcName, { p_member_ids: allIds, p_today_start: start, p_today_end: end })
        if (!error) rpcRows = data || []
      } catch { /* RPC not available, use fallback */ }
    }
    if (myToken !== _scanToken) return

    if (rpcRows) {
      rpcRows.forEach(r => {
        if (!r.member_id || !isMemberIdValidForOrg(r.member_id, table)) return
        const row = { member_id: r.member_id, heartbeat: r.heartbeat, temp: r.temp, sbp: r.sbp, dbp: r.dbp, breath: r.breath, date_minute: r.latest_at }
        newAllGroups[r.member_id] = [row]
        if (Number(r.today_count) > 0) newTodayGroups[r.member_id] = [row]
      })
    } else {
      // Fallback: fetch today's data and latest rows
      const validTokens = orgKnown ? new Set(allIds.map(memberSearchToken)) : null
      const chunkSize = 25
      const chunks = []
      for (let i = 0; i < allIds.length; i += chunkSize) chunks.push(allIds.slice(i, i + chunkSize))

      const [todayBatches, latestResult] = await Promise.all([
        allIds.length
          ? Promise.all(chunks.map(ids =>
              sb.from(table).select('member_id,heartbeat,temp,sbp,dbp,breath,date_minute')
                .in('member_id', ids).gte('date_minute', start).lte('date_minute', end).order('date_minute', { ascending: true }).limit(1000)
                .then(r => r.data || [])
            )).then(batches => batches.flat())
          : [],
        allIds.length
          ? sb.from(table).select('member_id,heartbeat,temp,sbp,dbp,breath,date_minute')
              .in('member_id', allIds).order('date_minute', { ascending: false }).limit(allIds.length * 3)
              .then(r => r.data || [])
          : [],
      ])
      if (myToken !== _scanToken) return

      todayBatches.forEach(r => {
        if (!r.member_id) return
        if (validTokens && !validTokens.has(memberSearchToken(r.member_id))) return
        if (!isMemberIdValidForOrg(r.member_id, table)) return
        if (!newTodayGroups[r.member_id]) newTodayGroups[r.member_id] = []
        newTodayGroups[r.member_id].push(r)
      })
      const seenLatest = new Set()
      ;(latestResult || []).forEach(r => {
        if (!r?.member_id || seenLatest.has(r.member_id)) return
        if (validTokens && !validTokens.has(memberSearchToken(r.member_id))) return
        if (!isMemberIdValidForOrg(r.member_id, table)) return
        seenLatest.add(r.member_id)
        newAllGroups[r.member_id] = [r]
      })
    }

    // Fill in members with no data
    allIds.forEach(id => {
      if (!newAllGroups[id] && isMemberIdValidForOrg(id, table)) {
        newAllGroups[id] = [{ member_id: id, heartbeat: null, temp: null, sbp: null, dbp: null, breath: null, date_minute: null }]
      }
    })

    const newList = orgKnown ? [...allIds].sort(memberSort) : [...new Set([...allIds, ...Object.keys(newTodayGroups), ...Object.keys(newAllGroups)])].sort(memberSort)
    saveScanCache(table, today, newTodayGroups, newAllGroups, newList)

    if (myToken !== _scanToken) return
    memberList.value = newList
    todayGroups.value = newTodayGroups
    // Safety net: only overwrite allGroups if new scan got members, or existing is empty
    if (Object.keys(newAllGroups).length || !Object.keys(allGroups.value).length) {
      allGroups.value = newAllGroups
    }
    skeletonIds.value = []
    scanPct.value = 100
    scanLabel.value = '載入完成'
    state.value = displayMembers.value.length ? 'loaded' : 'empty'
    freshnessText.value = '資料為最新'
    setTimeout(() => { if (myToken === _scanToken) { scanning.value = false; scanPct.value = 0 } }, 1200)
  } catch (err) {
    if (myToken !== _scanToken) return
    const fb = loadScanCache(table, today)
    if (fb) {
      todayGroups.value = fb.todayGroups || {}
      allGroups.value = fb.allGroups || {}
      memberList.value = fb.memberList || []
      state.value = displayMembers.value.length ? 'loaded' : 'empty'
      errorBanner.value = `無法取得最新資料，目前顯示快取資料`
    } else {
      state.value = 'empty'
      errorBanner.value = `會員掃描失敗：${err.message || String(err)}`
    }
  } finally {
    if (myToken === _scanToken) {
      scanning.value = false
    }
  }
}

// ── Lifecycle ─────────────────────────────────────────────
onMounted(() => {
  // Only set the table if not yet set; actual scan is handled by the watcher below
  if (!navStore.currentTable) {
    const savedTable = localStorage.getItem('vd_session_table')
    if (savedTable && authStore.tables.includes(savedTable)) {
      navStore.currentTable = savedTable
    } else if (authStore.tables.length) {
      navStore.currentTable = authStore.tables[0]
    }
    // If tables still empty (auth not restored yet), App.vue will set currentTable → watcher fires
  }
})

// Single entry point for all scans: initial load, table switch, App.vue session restore
// immediate:true handles the case where currentTable is already set (navigating from another view)
watch(() => navStore.currentTable, async (newTable, oldTable) => {
  if (!newTable) return
  if (oldTable !== undefined) {
    // Table was changed (not initial immediate fire): clear stale data first
    todayGroups.value = {}; allGroups.value = {}; memberList.value = []; skeletonIds.value = []
  }
  await loadOrganizations()
  scanAndLoadCards()
}, { immediate: true })

// TODO: subscribeRealtime — Supabase realtime subscription for live updates
// When implemented, subscribe to INSERT events on the current table and refresh cards
</script>

<style scoped>
/* ══ MEMBER OVERVIEW ══ */
.ov-main{padding:28px 32px;max-width:1400px;margin:0 auto;}
.ov-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:22px;gap:16px;flex-wrap:wrap;}
.ov-title-group{}
.ov-title{font-size:22px;font-weight:800;letter-spacing:-.4px;}
.ov-subtitle{font-size:14px;color:var(--text-dim);margin-top:3px;}
.ov-freshness{font-size:12px;color:var(--text-light);margin-top:2px;}
.ov-error-banner{margin-top:6px;padding:7px 12px;background:rgba(240,240,240,.85);border:1px solid var(--border);border-radius:var(--r-sm);font-size:12px;color:var(--text-mid);}
.ov-header-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}

/* Institution tabs */
.ov-inst-tabs{display:flex;gap:6px;flex-wrap:wrap;}
.tab{display:flex;align-items:center;gap:6px;padding:8px 14px;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-md);color:var(--text-mid);font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;}
.tab.active{background:var(--mint-dark);color:#fff;border-color:var(--mint-dark);}
.tab:hover:not(.active){border-color:var(--mint);color:var(--mint-dark);background:var(--mint-xlight);}
.tab-dot{width:7px;height:7px;border-radius:50%;background:currentColor;opacity:.5;}

.ov-view-toggle{display:flex;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-md);overflow:hidden;box-shadow:var(--shadow-sm);}
.ov-view-btn{padding:9px 16px;background:transparent;border:none;font-size:13px;font-weight:700;color:var(--text-dim);transition:all .15s;cursor:pointer;}
.ov-view-btn:hover{background:var(--bg-alt);color:var(--mint-dark);}
.ov-view-btn.active{background:var(--mint);color:#fff;}

.btn-scan{display:flex;align-items:center;gap:7px;padding:10px 18px;background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-md);color:var(--text-mid);font-size:14px;font-weight:600;transition:all .18s;box-shadow:var(--shadow-sm);cursor:pointer;}
.btn-scan:hover{border-color:var(--mint);color:var(--mint-dark);background:var(--mint-xlight);}
.btn-scan:disabled{opacity:.5;cursor:not-allowed;}

/* Scan progress bar */
.ov-scan-label{font-size:12px;color:var(--mint-mid);font-weight:600;margin-bottom:6px;min-height:16px;transition:opacity .3s;}
.ov-scan-label.hidden{opacity:0;pointer-events:none;}
.ov-scan-bar-wrap{height:4px;background:var(--border-light);border-radius:4px;overflow:hidden;margin-bottom:18px;transition:opacity .4s;}
.ov-scan-bar-wrap.hidden{opacity:0;pointer-events:none;}
.ov-scan-bar{height:100%;width:0%;background:linear-gradient(90deg,var(--mint),var(--mint-mid));border-radius:4px;transition:width .5s cubic-bezier(.4,0,.2,1);}

/* Member grid */
.member-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;}
.member-card{background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(251,254,252,.84));border:1px solid rgba(255,255,255,.72);border-radius:var(--r-xl);padding:20px 22px;box-shadow:0 10px 30px rgba(74,106,88,.08);backdrop-filter:blur(10px);cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
.member-card::before{content:'';position:absolute;inset:0 0 auto 0;height:72px;background:linear-gradient(135deg,rgba(122,170,150,.16),transparent 62%);pointer-events:none;}
.member-card:hover{box-shadow:0 16px 36px rgba(74,106,88,.12);border-color:rgba(122,170,150,.5);transform:translateY(-3px);}
.member-card.status-red{border-color:var(--red);border-width:2px;}
.member-card.status-orange{border-color:var(--orange);border-width:2px;}
.member-card.status-red:hover{border-color:var(--red);}
.member-card.status-orange:hover{border-color:var(--orange);}
.mc-head{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
.mc-avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0;color:#fff;}
.mc-avatar.ok{background:var(--mint);}
.mc-avatar.warn{background:var(--orange);}
.mc-avatar.err{background:var(--red);}
.mc-avatar.none{background:var(--text-dim);}
.mc-info{flex:1;min-width:0;}
.mc-id{font-size:15px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mc-status-badge{font-size:11px;font-weight:700;padding:3px 9px;border-radius:12px;display:inline-block;margin-top:3px;}
.mc-status-badge.ok{background:var(--green-light);color:#2d6b40;}
.mc-status-badge.warn{background:var(--orange-light);color:#7a4818;}
.mc-status-badge.err{background:var(--red-light);color:#862624;}
.mc-status-badge.none{background:var(--bg-alt);color:var(--text-dim);}
.mc-vitals{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
.mc-vital{display:flex;flex-direction:column;gap:2px;}
.mc-vital-label{font-size:10px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px;}
.mc-vital-val{font-size:20px;font-weight:800;color:var(--text);font-feature-settings:'tnum';}
.mc-vital-val.is-red{color:var(--red);}
.mc-vital-val.is-orange{color:var(--orange);}
.mc-vital-val.is-green{color:var(--green);}
.mc-footer{display:flex;align-items:center;justify-content:space-between;}
.mc-time{font-size:11px;color:var(--text-dim);}
.mc-arrow{font-size:12px;font-weight:700;color:var(--mint-mid);}

/* Skeleton loading */
.member-card.skel-card{cursor:default;pointer-events:none;}

/* Empty state */
.ov-empty{text-align:center;padding:72px 32px;color:var(--text-dim);background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-xl);}
.ov-empty-icon{font-size:48px;margin-bottom:12px;}
.ov-empty p{font-size:15px;}
.ov-empty small{font-size:13px;margin-top:6px;display:block;}

@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:768px){.ov-main{padding:16px;}.ov-header-right{gap:6px;}.member-grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));}}
/* Compare mode */
.btn-scan-active{background:var(--mint)!important;color:#fff!important;border-color:var(--mint)!important;}
.btn-compare-go{background:var(--mint-dark)!important;color:#fff!important;}
.compare-selected{outline:3px solid var(--mint);outline-offset:2px;}
.compare-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;}
.compare-modal{background:#fff;border-radius:var(--r-xl);box-shadow:0 20px 60px rgba(40,70,55,.2);padding:24px;max-width:92vw;width:640px;max-height:80vh;overflow-y:auto;}
.compare-modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}
.compare-modal-title{font-size:16px;font-weight:700;color:var(--text);}
.compare-modal-close{background:transparent;border:none;font-size:18px;color:var(--text-dim);cursor:pointer;padding:4px 8px;border-radius:var(--r-sm);}
.compare-modal-close:hover{background:var(--bg-alt);}
.compare-loading{text-align:center;padding:32px;color:var(--text-dim);}
.compare-modal-body{display:flex;flex-direction:column;gap:20px;}
.compare-member-block{background:var(--bg-alt);border-radius:var(--r-lg);padding:16px;}
.compare-member-title{font-size:15px;font-weight:700;color:var(--mint-dark);margin-bottom:10px;}
.compare-vitals{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;}
.compare-vital-chip{background:#fff;border:1px solid var(--border);border-radius:20px;padding:5px 12px;font-size:13px;color:var(--text-mid);}
.compare-chart{margin-top:8px;}
.compare-no-data{font-size:13px;color:var(--text-dim);padding:8px 0;}
</style>
