<template>
  <div id="app-root">
    <!-- Shared topbar: shown after login -->
    <header
      v-if="authStore.isLoggedIn"
      class="shared-topbar screen-shell"
      id="shared-topbar"
    >
      <div class="screen-decor decor-topbar">
        <img :src="base + 'images/Snipaste_2026-04-08_17-10-44_nobg.png'" alt="" loading="lazy">
      </div>
      <div class="topbar-left">
        <button class="btn-hamburger" @click="sidebarOpen = true" title="功能選單" aria-label="開啟功能選單">
          <span></span><span></span><span></span>
        </button>
        <div class="topbar-brand" style="display:flex;align-items:center;gap:8px;">
          <img :src="base + 'logo/vitalily-logo.png'" alt="" style="width:28px;height:28px;flex-shrink:0;" loading="lazy">
          <span>VitaLily</span>
        </div>
      </div>

      <!-- Institution tabs -->
      <div class="topbar-tabs-area">
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

      <div class="topbar-right">
        <div class="rt-badge" :class="{ active: rtActive }">
          <span class="rt-dot" :class="{ pulse: rtActive }"></span>
          <span>{{ rtActive ? '即時' : '離線' }}</span>
        </div>
        <div class="user-chip">
          <div class="user-avatar">{{ userInitial }}</div>
          <span>{{ authStore.userEmail }}</span>
        </div>
        <button class="btn-logout" @click="doLogout">登出</button>
      </div>
    </header>

    <!-- Sidebar drawer -->
    <div
      v-if="authStore.isLoggedIn && sidebarOpen"
      class="sidebar-overlay open"
      @click="sidebarOpen = false"
    ></div>
    <nav
      v-if="authStore.isLoggedIn"
      id="sidebar-drawer"
      class="sidebar-drawer"
      :class="{ open: sidebarOpen }"
    >
      <div class="sidebar-drw-head">
        <span class="sidebar-drw-brand">🌿 功能選單</span>
        <button class="sidebar-drw-close" @click="sidebarOpen = false" aria-label="關閉選單">✕</button>
      </div>
      <div class="sidebar-drw-body">
        <div class="sidebar-section">
          <div class="sidebar-section-label">導覽</div>
          <button class="sidebar-nav-btn" :class="{ active: isOverviewActive }" @click="navTo('/overview')">
            <span class="snb-icon">🏠</span>會員總覽
          </button>
          <button class="sidebar-nav-btn" :class="{ active: route.path === '/dashboard' && navStore.currentView === 'day' }" @click="navToDash('day')">
            <span class="snb-icon">📅</span>日視圖
          </button>
          <button class="sidebar-nav-btn" :class="{ active: route.path === '/dashboard' && navStore.currentView === 'month' }" @click="navToDash('month')">
            <span class="snb-icon">📆</span>月視圖
          </button>
          <button class="sidebar-nav-btn" :class="{ active: route.path === '/posture' }" @click="navTo('/posture')">
            <span class="snb-icon">🧘</span>動作姿態統計
          </button>
          <button class="sidebar-nav-btn" :class="{ active: route.path.startsWith('/hf') }" @click="navTo('/hf')">
            <span class="snb-icon">🫀</span>心衰生理資料
          </button>
        </div>
        <div class="sidebar-divider"></div>
        <div class="sidebar-section">
          <div class="sidebar-section-label">設定</div>
          <button class="sidebar-nav-btn" @click="cycleFontSize">
            <span class="snb-icon">🔤</span>調整字體 ({{ fontSizeLabel }})
          </button>
        </div>
      </div>
      <div class="sidebar-drw-footer">
        <div style="font-size:12px;color:var(--text-dim)">{{ authStore.userEmail }}</div>
      </div>
    </nav>

    <!-- Main router view -->
    <RouterView />

    <!-- Bottom nav (mobile) -->
    <nav v-if="authStore.isLoggedIn" id="bottom-nav" class="bottom-nav">
      <button class="bnav-btn" :class="{ active: isOverviewActive }" @click="router.push('/overview')">
        <span class="bnav-icon">👥</span><span>總覽</span>
      </button>
      <button class="bnav-btn" :class="{ active: route.path === '/dashboard' }" @click="router.push('/dashboard')">
        <span class="bnav-icon">📊</span><span>資料</span>
      </button>
      <button class="bnav-btn" :class="{ active: route.path === '/posture' }" @click="router.push('/posture')">
        <span class="bnav-icon">🏃</span><span>姿態</span>
      </button>
      <button class="bnav-btn" @click="sidebarOpen = true">
        <span class="bnav-icon">⚙️</span><span>設定</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useNavStore } from '@/stores/nav.js'
import { sb, TABLE_LABELS } from '@/lib/supabase.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const navStore = useNavStore()

const base = import.meta.env.BASE_URL
const sidebarOpen = ref(false)
const rtActive = ref(false)

// ── Realtime subscription ─────────────────────────────────
let rtChannel = null
let rtTable = null

function subscribeRealtime(table) {
  if (rtChannel && rtTable === table) return
  if (rtChannel) { sb.removeChannel(rtChannel); rtChannel = null }
  rtTable = table
  rtChannel = sb.channel(`rt-${table}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table }, () => {
      rtActive.value = true
    })
    .subscribe(status => {
      rtActive.value = status === 'SUBSCRIBED'
    })
}

function unsubscribeRealtime() {
  if (rtChannel) { sb.removeChannel(rtChannel); rtChannel = null }
  rtActive.value = false
}

// Subscribe when table changes, unsubscribe on logout
watch(() => navStore.currentTable, (t) => { if (t) subscribeRealtime(t) })
watch(() => authStore.isLoggedIn, (v) => { if (!v) unsubscribeRealtime() })

// Restore session on page refresh (runs for all routes, not just /login)
onMounted(async () => {
  if (authStore.isLoggedIn) return
  try {
    const { data: { session } } = await sb.auth.getSession()
    if (session?.user?.email) {
      const { data, error } = await sb.from('user_access').select('table_name')
      if (!error && data?.length) {
        const tables = data.map(r => r.table_name)
        authStore.setLoggedIn(session.user.email, tables)
        const saved = localStorage.getItem('vd_session_table')
        navStore.currentTable = (saved && tables.includes(saved)) ? saved : tables[0]
      } else {
        if (route.path !== '/login') router.push('/login')
      }
    } else {
      if (route.path !== '/login') router.push('/login')
    }
  } catch (e) {
    console.warn('[App] session restore failed:', e.message)
    if (route.path !== '/login') router.push('/login')
  }
})

// Font size cycling
const fontSizes = ['標準', '大字', '特大']
const fontSizeIdx = ref(0)
const fontSizeLabel = computed(() => fontSizes[fontSizeIdx.value])
function cycleFontSize() {
  fontSizeIdx.value = (fontSizeIdx.value + 1) % fontSizes.length
  document.body.classList.remove('font-lg', 'font-xl')
  if (fontSizeIdx.value === 1) document.body.classList.add('font-lg')
  else if (fontSizeIdx.value === 2) document.body.classList.add('font-xl')
}

const userInitial = computed(() => {
  const e = authStore.userEmail
  return e ? e[0].toUpperCase() : '?'
})

const isOverviewActive = computed(() =>
  route.path === '/overview' || route.path.startsWith('/detail') || route.path.startsWith('/hf')
)

function switchTable(name) {
  if (name === navStore.currentTable) return
  navStore.currentTable = name
  localStorage.setItem('vd_session_table', name)
}

function navTo(path) {
  sidebarOpen.value = false
  router.push(path)
}

function navToDash(view) {
  navStore.currentView = view
  sidebarOpen.value = false
  router.push('/dashboard')
}

async function doLogout() {
  unsubscribeRealtime()
  await sb.auth.signOut({ scope: 'global' })
  authStore.logout()
  router.push('/login')
}
</script>

<style>
/* CSS variables */
:root {
  --bg: #eef4ef;
  --bg-alt: #f7fbf8;
  --surface: rgba(255, 255, 255, .86);
  --border: #d2e2d9;
  --border-light: #e5eeea;
  --mint: #7aaa96;
  --mint-mid: #5d9180;
  --mint-dark: #3d6b5a;
  --mint-light: #d8efe5;
  --mint-xlight: #f0f9f4;
  --text: #1e2d26;
  --text-mid: #486055;
  --text-dim: #84a098;
  --text-light: #b5ccc5;
  --red: #b85450;
  --red-light: #faeeee;
  --orange: #bf7a45;
  --orange-light: #faf1e6;
  --green: #5e9e72;
  --green-light: #e6f4eb;
  --shadow-sm: 0 1px 4px rgba(40, 70, 55, .07);
  --shadow: 0 4px 18px rgba(40, 70, 55, .09);
  --shadow-md: 0 8px 36px rgba(40, 70, 55, .12);
  --r-xl: 20px;
  --r-lg: 14px;
  --r-md: 10px;
  --r-sm: 7px;
  --glass-line: rgba(255, 255, 255, .72);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Noto Sans TC', 'DM Sans', sans-serif;
  background:
    linear-gradient(rgba(243, 248, 244, .76), rgba(234, 242, 236, .82)),
    url('/vital-sign-ITRI/images/zipN-4240-00-000027-wpu.jpg');
  background-size: cover, cover;
  background-attachment: fixed;
  color: var(--text);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

button, select { font-family: inherit; cursor: pointer; }

/* Screen shell (decorative positioning) */
.screen-shell { position: relative; }
.screen-shell .screen-decor {
  position: absolute; pointer-events: none; user-select: none;
  z-index: 0; opacity: .22; filter: drop-shadow(0 8px 16px rgba(61, 107, 90, .08));
}
.screen-shell .screen-decor img { display: block; width: 100%; height: auto; }
.screen-shell > *:not(.screen-decor) { position: relative; z-index: 1; }
.decor-topbar { width: 110px; top: 8px; right: 22px; opacity: .16; filter: none; }
.decor-det-1 { width: 112px; top: 14px; right: -14px; transform: rotate(9deg); }
.decor-det-2 { width: 122px; bottom: 58px; left: -24px; transform: rotate(-10deg); }
.decor-det-3 { width: 84px; top: 44%; right: -18px; opacity: .17; transform: rotate(-8deg); }
.decor-det-4 { width: 68px; bottom: 30px; right: 54px; opacity: .15; transform: rotate(4deg); }
.decor-dash-1 { width: 200px; top: 8px; right: 18px; opacity: .18; transform: rotate(3deg); }
.decor-dash-2 { width: 166px; bottom: 36px; left: -18px; opacity: .2; transform: rotate(-7deg); }
.decor-dash-3 { width: 148px; bottom: 48px; right: -14px; opacity: .18; transform: rotate(-4deg); }
.decor-dash-4 { width: 90px; top: 42%; left: -20px; opacity: .15; transform: rotate(7deg); }

/* ══ SHARED TOPBAR ══ */
.shared-topbar {
  position: sticky; top: 0; z-index: 300;
  display: flex; align-items: center; justify-content: space-between;
  height: 62px; padding: 0 28px;
  background: rgba(255, 255, 255, .78);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(255, 255, 255, .6);
  box-shadow: 0 8px 24px rgba(68, 101, 84, .08);
  gap: 12px; overflow: hidden;
}
.topbar-left { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.btn-hamburger {
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  background: transparent; border: 1.5px solid var(--border); border-radius: var(--r-sm);
  color: var(--text-mid); cursor: pointer; transition: all .15s; flex-direction: column; gap: 4px;
}
.btn-hamburger:hover { border-color: var(--mint); color: var(--mint-dark); background: var(--mint-xlight); }
.btn-hamburger span { display: block; width: 14px; height: 2px; background: currentColor; border-radius: 2px; }
.topbar-brand { font-size: 15px; font-weight: 700; color: var(--mint-dark); letter-spacing: -.2px; white-space: nowrap; }
.topbar-tabs-area { flex: 1; display: flex; gap: 7px; overflow-x: auto; scrollbar-width: none; }
.topbar-tabs-area::-webkit-scrollbar { display: none; }
.topbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.rt-badge {
  display: inline-flex; align-items: center; gap: 5px; padding: 5px 11px;
  border-radius: 20px; font-size: 12px; font-weight: 600;
  background: rgba(239, 68, 68, .1); color: #b85450; border: 1px solid rgba(184, 84, 80, .2);
}
.rt-badge.active { background: rgba(94, 158, 114, .12); color: #2d6b40; border-color: rgba(94, 158, 114, .25); }
.rt-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.rt-dot.pulse { animation: rtpulse 1.2s ease infinite; }
@keyframes rtpulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(.8); } }
.user-chip { display: flex; align-items: center; gap: 7px; padding: 4px 13px 4px 5px; background: var(--mint-xlight); border: 1.5px solid var(--mint-light); border-radius: 40px; }
.user-avatar { width: 28px; height: 28px; background: var(--mint); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.user-chip span { font-size: 13px; color: var(--text-mid); font-weight: 500; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-logout { padding: 7px 15px; background: transparent; border: 1.5px solid var(--border); border-radius: var(--r-sm); color: var(--text-dim); font-size: 13px; transition: all .18s; }
.btn-logout:hover { border-color: var(--red); color: var(--red); background: var(--red-light); }
.tab { display: flex; align-items: center; gap: 6px; padding: 8px 18px; background: var(--surface); border: 1.5px solid var(--border); border-radius: 40px; color: var(--text-dim); font-size: 13px; font-weight: 500; transition: all .18s; white-space: nowrap; box-shadow: var(--shadow-sm); }
.tab:hover { border-color: var(--mint); color: var(--mint-dark); background: var(--mint-xlight); }
.tab.active { background: var(--mint); border-color: var(--mint); color: #fff; box-shadow: 0 3px 12px rgba(122, 170, 150, .38); }
.tab-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: .7; flex-shrink: 0; }

/* ══ SIDEBAR DRAWER ══ */
.sidebar-overlay { display: none; position: fixed; inset: 0; z-index: 800; background: rgba(30, 45, 38, .22); }
.sidebar-overlay.open { display: block; }
.sidebar-drawer {
  position: fixed; top: 0; left: 0; bottom: 0; width: 240px; max-width: 85vw;
  background: var(--surface); box-shadow: var(--shadow-md); z-index: 810;
  display: flex; flex-direction: column;
  transform: translateX(-100%); transition: transform .25s ease; will-change: transform;
}
.sidebar-drawer.open { transform: translateX(0); }
.sidebar-drw-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 18px 16px; border-bottom: 1px solid var(--border-light); }
.sidebar-drw-brand { font-size: 15px; font-weight: 700; color: var(--mint-dark); }
.sidebar-drw-close { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; border-radius: var(--r-sm); color: var(--text-dim); font-size: 18px; cursor: pointer; transition: all .15s; }
.sidebar-drw-close:hover { background: var(--bg-alt); color: var(--text); }
.sidebar-drw-body { flex: 1; overflow-y: auto; padding: 10px 10px; }
.sidebar-section { margin-bottom: 20px; }
.sidebar-section-label { font-size: 10px; font-weight: 700; color: var(--text-light); text-transform: uppercase; letter-spacing: .8px; padding: 0 8px; margin-bottom: 6px; }
.sidebar-nav-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 11px 12px; background: transparent; border: none; border-radius: var(--r-md); font-size: 14px; font-weight: 500; color: var(--text-mid); transition: all .14s; text-align: left; }
.sidebar-nav-btn:hover { background: var(--mint-xlight); color: var(--mint-dark); }
.sidebar-nav-btn.active { background: var(--mint-xlight); color: var(--mint-dark); font-weight: 700; }
.sidebar-nav-btn .snb-icon { font-size: 18px; width: 24px; text-align: center; flex-shrink: 0; }
.sidebar-divider { height: 1px; background: var(--border-light); margin: 8px 0; }
.sidebar-drw-footer { padding: 16px 18px; border-top: 1px solid var(--border-light); }

/* ══ BOTTOM NAV ══ */
.bottom-nav {
  display: none; position: fixed; bottom: 0; left: 0; right: 0;
  background: rgba(255, 255, 255, .92); border-top: 1px solid var(--border);
  backdrop-filter: blur(12px); z-index: 200;
  padding-bottom: env(safe-area-inset-bottom);
}
.bnav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6px 0; min-height: 56px; background: none; border: none; font-size: 11px; color: var(--text-dim); transition: color .15s; gap: 3px; }
.bnav-btn.active { color: var(--mint-dark); }
.bnav-btn .bnav-icon { font-size: 20px; line-height: 1; }

@media (max-width: 600px) {
  .bottom-nav { display: flex; }
  body { padding-bottom: 64px; }
}

/* Font size variants */
body.font-lg { font-size: 15px; }
body.font-xl { font-size: 17px; }
</style>
