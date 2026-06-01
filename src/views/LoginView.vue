<template>
  <div id="login-screen">
    <div class="login-stage">
      <div class="botanical-floating login-decor-2">
        <img :src="base + 'logo/vitalily-logo.png'" alt="" loading="lazy">
      </div>
      <div class="botanical-floating login-decor-4">
        <img :src="base + 'images/Snipaste_2026-04-08_17-10-44_nobg.png'" alt="" loading="lazy">
      </div>
      <div class="botanical-floating login-decor-5">
        <img :src="base + 'images/Snipaste_2026-04-08_17-10-51_nobg.png'" alt="" loading="lazy">
      </div>

      <div class="login-wrap">
        <!-- Aside / Brand -->
        <div class="login-aside">
          <div class="login-brand">
            <div class="login-frame">
              <img class="login-frame-img" :src="base + '金邊.png'" alt="" loading="lazy">
              <h1>VitaLily</h1>
            </div>
            <small>健康資料平台</small>
          </div>
        </div>

        <!-- Form -->
        <div class="login-form">
          <h2>歡迎回來</h2>
          <p class="sub">請使用已授權的帳號登入</p>

          <!-- Session restore banner -->
          <div class="session-banner" v-if="showSessionBanner">
            <p>偵測到已登入帳號：<span class="session-email">{{ sessionEmail }}</span></p>
            <div class="session-btns">
              <button class="btn-resume" @click="resumeSession">繼續使用</button>
              <button class="btn-relogin" @click="dismissResume">重新登入</button>
            </div>
          </div>

          <!-- Error message -->
          <div class="error-msg" v-if="errorMsg">{{ errorMsg }}</div>

          <div class="field">
            <label>Email</label>
            <input
              type="email"
              v-model="email"
              placeholder="your@email.com"
              autocomplete="email"
              @keydown.enter="doLogin"
            >
          </div>
          <div class="field">
            <label>密碼</label>
            <input
              type="password"
              v-model="password"
              placeholder="••••••••"
              autocomplete="current-password"
              @keydown.enter="doLogin"
            >
          </div>
          <div class="remember-row">
            <input type="checkbox" id="remember" v-model="remember">
            <label for="remember">
              記住帳號<span style="font-size:11px;color:var(--text-light);margin-left:4px;">（僅儲存 Email，不含密碼）</span>
            </label>
          </div>
          <button class="btn-login" :disabled="loading" @click="doLogin">
            {{ loading ? loginBtnText : '登入' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { sb } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()
const base = import.meta.env.BASE_URL

// Form state
const email = ref('')
const password = ref('')
const remember = ref(false)
const loading = ref(false)
const loginBtnText = ref('登入')
const errorMsg = ref('')
const showSessionBanner = ref(false)
const sessionEmail = ref('')
let resumeSessionData = null

// ── Rate limit state ──
const _loginAttempts = { count: 0, lockUntil: 0 }

function showError(msg) {
  errorMsg.value = msg
}

function clearError() {
  errorMsg.value = ''
}

function _loginCheckRateLimit() {
  const now = Date.now()
  if (_loginAttempts.lockUntil > now) {
    const sec = Math.ceil((_loginAttempts.lockUntil - now) / 1000)
    showError(`登入失敗過多，請 ${sec} 秒後再試`)
    return false
  }
  return true
}

function _loginRecordFailure() {
  _loginAttempts.count++
  if (_loginAttempts.count >= 5) {
    _loginAttempts.lockUntil = Date.now() + 15 * 60 * 1000 // 15 分鐘鎖定
    _loginAttempts.count = 0
  }
}

function _loginResetAttempts() {
  _loginAttempts.count = 0
  _loginAttempts.lockUntil = 0
}

function loadRemembered() {
  const em = localStorage.getItem('rm_email')
  if (em) {
    email.value = em
    remember.value = true
  }
  localStorage.removeItem('rm_pass')
}

async function fetchUserTables() {
  try {
    const { data, error } = await sb.from('user_access').select('table_name')
    if (!error && data && data.length) {
      const tables = data.map(r => r.table_name)
      if (tables.length) return tables
    }
    console.warn('[Auth] user_access 查詢失敗：', error?.message || 'empty')
  } catch (e) {
    console.warn('[Auth] exception:', e.message)
  }
  return []
}

async function checkExistingSession() {
  const { data: { session } } = await sb.auth.getSession()
  if (session?.user?.email) {
    const tables = await fetchUserTables()
    if (tables.length) {
      authStore.setLoggedIn(session.user.email, tables)
      router.push('/overview')
      return
    }
    // No accessible tables — show login with banner option
    resumeSessionData = session
    sessionEmail.value = session.user.email
    showSessionBanner.value = true
  }
  loadRemembered()
}

async function resumeSession() {
  if (!resumeSessionData) return
  const tables = await fetchUserTables()
  if (!tables.length) {
    showError('此帳號無可存取的機構，請聯絡管理員。')
    return
  }
  authStore.setLoggedIn(resumeSessionData.user.email, tables)
  router.push('/overview')
}

function dismissResume() {
  resumeSessionData = null
  showSessionBanner.value = false
  sb.auth.signOut({ scope: 'global' }).catch(() => {})
}

async function doLogin() {
  if (loading.value) return
  if (!_loginCheckRateLimit()) return

  const em = email.value.trim()
  const pass = password.value
  clearError()

  if (!em || !pass) {
    showError('請填寫 Email 和密碼')
    return
  }

  loading.value = true
  loginBtnText.value = '登入中…'

  // 慢網路提示：超過 3 秒顯示提醒
  const slowTimer = setTimeout(() => {
    if (loading.value) loginBtnText.value = '連線中，請稍候…'
  }, 3000)

  let data, error
  try {
    ;({ data, error } = await sb.auth.signInWithPassword({ email: em, password: pass }))
  } catch (e) {
    error = e
  }
  clearTimeout(slowTimer)

  if (error) {
    const isNetErr = error.message && (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed')
    )
    if (!isNetErr) _loginRecordFailure()
    showError(isNetErr ? '無法連線至伺服器，請確認網路後重試' : '帳號或密碼錯誤，請確認後重試')
    loading.value = false
    loginBtnText.value = '登入'
    return
  }

  _loginResetAttempts()
  const tables = await fetchUserTables()
  if (!tables.length) {
    await sb.auth.signOut({ scope: 'global' })
    showError('此帳號無可存取的機構，請聯絡管理員。')
    loading.value = false
    loginBtnText.value = '登入'
    return
  }

  if (remember.value) {
    localStorage.setItem('rm_email', em)
  } else {
    localStorage.removeItem('rm_email')
  }
  localStorage.removeItem('rm_pass')

  authStore.setLoggedIn(em, tables)
  router.push('/overview')
}

onMounted(() => {
  checkExistingSession()
})
</script>

<style scoped>
#login-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background:
    linear-gradient(rgba(16, 27, 42, .38), rgba(24, 39, 58, .44)),
    url('/vital-sign-ITRI/images/timthumb.jpg');
  background-size: cover, cover;
  background-repeat: no-repeat, no-repeat;
  background-position: center center, center center;
  background-attachment: fixed;
}

.login-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(93vw, 820px);
  margin: 0 auto;
  padding: 0;
  overflow: visible;
}

.login-wrap {
  display: flex;
  background: linear-gradient(135deg, rgba(242, 248, 255, .16), rgba(255, 255, 255, .08));
  border: 1px solid rgba(255, 255, 255, .42);
  backdrop-filter: blur(24px) saturate(1.15);
  -webkit-backdrop-filter: blur(24px) saturate(1.15);
  border-radius: 24px;
  box-shadow: 0 22px 60px rgba(11, 22, 37, .28), inset 0 1px 0 rgba(255, 255, 255, .32);
  overflow: hidden;
  width: 820px;
  max-width: 93vw;
  position: relative;
}

.login-aside {
  width: 320px;
  flex-shrink: 0;
  background: linear-gradient(160deg, rgba(42, 72, 108, .38) 0%, rgba(30, 51, 78, .30) 55%, rgba(20, 34, 56, .42) 100%);
  padding: 28px 36px 52px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  position: relative;
  overflow: hidden;
}

.login-aside::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, .08), rgba(255, 255, 255, 0) 38%, rgba(9, 18, 31, .1) 100%);
  pointer-events: none;
}

.login-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 0;
  position: relative;
  z-index: 2;
  margin-top: 40px;
}

.login-brand h1 {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 62px;
  font-weight: 300;
  color: #d7b57a;
  line-height: .94;
  letter-spacing: .05em;
  margin: 0;
  text-align: center;
  position: relative;
  z-index: 1;
}

.login-brand small {
  font-size: 17px;
  font-weight: 500;
  color: rgba(227, 235, 245, .78);
  letter-spacing: .01em;
  text-transform: none;
  margin-top: 0;
  display: block;
  line-height: 1.35;
  text-align: center;
}

.login-frame {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 78px 78px;
}

.login-frame-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  z-index: 0;
}

.login-form {
  flex: 1;
  padding: 78px 48px 118px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: linear-gradient(180deg, rgba(255, 255, 255, .28), rgba(244, 249, 253, .18));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.login-form::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, .26), rgba(255, 255, 255, .08) 42%, rgba(213, 228, 239, .06) 100%);
  pointer-events: none;
  z-index: 1;
}

.login-form::after {
  content: '';
  position: absolute;
  inset: 18px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, .18);
  pointer-events: none;
  z-index: 1;
  opacity: .9;
}

.login-form h2,
.login-form .sub,
.login-form .session-banner,
.login-form .error-msg,
.login-form .field,
.login-form .remember-row,
.login-form .btn-login {
  position: relative;
  z-index: 4;
}

.login-form h2 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -.4px;
  margin-bottom: 8px;
  max-width: 100%;
  line-height: 1.15;
}

.login-form .sub {
  font-size: 14px;
  color: var(--text-dim);
  margin-bottom: 34px;
  max-width: 100%;
}

.field {
  margin-bottom: 17px;
}

.field label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-mid);
  margin-bottom: 7px;
  text-transform: uppercase;
  letter-spacing: .6px;
}

.field input {
  width: 100%;
  padding: 12px 15px;
  background: rgba(255, 255, 255, .36);
  border: 1.5px solid rgba(197, 221, 213, .72);
  border-radius: var(--r-md);
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color .18s, box-shadow .18s, background .15s;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-sizing: border-box;
}

.field input:focus {
  border-color: rgba(122, 170, 150, .92);
  background: rgba(255, 255, 255, .5);
  box-shadow: 0 0 0 3px rgba(122, 170, 150, .14);
}

.remember-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 22px;
}

.remember-row input[type=checkbox] {
  width: 14px;
  height: 14px;
  accent-color: var(--mint);
  cursor: pointer;
}

.remember-row label {
  font-size: 13px;
  color: var(--text-dim);
  cursor: pointer;
}

.btn-login {
  width: 100%;
  padding: 13px;
  background: var(--mint);
  color: #fff;
  border: none;
  border-radius: var(--r-md);
  font-size: 15px;
  font-weight: 600;
  transition: background .18s, transform .1s;
  box-shadow: 0 4px 14px rgba(122, 170, 150, .38);
  margin-top: 14px;
  cursor: pointer;
}

.btn-login:hover {
  background: var(--mint-mid);
}

.btn-login:active {
  transform: scale(.99);
}

.btn-login:disabled {
  opacity: .5;
  cursor: not-allowed;
  box-shadow: none;
}

.error-msg {
  background: var(--red-light);
  border: 1px solid rgba(184, 84, 80, .18);
  color: var(--red);
  padding: 10px 14px;
  border-radius: var(--r-sm);
  font-size: 13px;
  margin-bottom: 15px;
}

.session-banner {
  background: rgba(240, 249, 244, .42);
  border: 1.5px solid rgba(216, 239, 229, .7);
  border-radius: var(--r-md);
  padding: 13px 16px;
  margin-bottom: 18px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.session-banner p {
  font-size: 13px;
  color: var(--text-mid);
  margin-bottom: 10px;
}

.session-banner .session-email {
  font-weight: 700;
  color: var(--mint-dark);
}

.session-btns {
  display: flex;
  gap: 8px;
}

.btn-resume {
  flex: 1;
  padding: 9px;
  background: var(--mint);
  color: #fff;
  border: none;
  border-radius: var(--r-sm);
  font-size: 13px;
  font-weight: 600;
  transition: background .15s;
  cursor: pointer;
}

.btn-resume:hover {
  background: var(--mint-mid);
}

.btn-relogin {
  flex: 1;
  padding: 9px;
  background: transparent;
  border: 1.5px solid var(--border);
  border-radius: var(--r-sm);
  font-size: 13px;
  color: var(--text-dim);
  transition: all .15s;
  cursor: pointer;
}

.btn-relogin:hover {
  border-color: var(--red);
  color: var(--red);
}

/* Botanical floating decorations */
.botanical-floating {
  position: absolute;
  display: block;
  pointer-events: none;
  user-select: none;
  z-index: 3;
  filter: drop-shadow(0 8px 18px rgba(18, 28, 42, .12));
}

.botanical-floating img {
  display: block;
  width: 100%;
  height: auto;
}

.login-stage .login-wrap {
  position: relative;
  z-index: 2;
}

.login-decor-2 {
  width: 186px;
  left: 67px;
  bottom: 34px;
  opacity: .74;
  filter: drop-shadow(0 12px 22px rgba(10, 20, 34, .18));
}

.login-decor-4 {
  width: 420px;
  right: 20px;
  top: 14px;
  opacity: .06;
}

.login-decor-5 {
  width: 420px;
  right: 16px;
  bottom: -12px;
  opacity: .1;
  transform: rotate(-2deg);
}

/* Responsive */
@media (max-width: 980px) {
  .login-decor-2 {
    display: none;
  }
  .login-decor-4 {
    width: 400px;
    right: 15px;
    top: 10px;
    opacity: .10;
  }
  .login-decor-5 {
    width: 400px;
    right: 10px;
    bottom: 0;
    opacity: .14;
  }
  .login-aside {
    width: 292px;
    padding: 26px 28px 44px;
  }
  .login-brand {
    margin-top: 28px;
  }
  .login-brand h1 {
    font-size: 39px;
  }
  .login-brand small {
    font-size: 15px;
  }
  .login-form {
    padding: 68px 34px 96px;
  }
}

@media (max-width: 760px) {
  .login-decor-2,
  .login-decor-4,
  .login-decor-5 {
    display: none;
  }
}

@media (max-width: 600px) {
  .login-aside {
    display: none;
  }
  .login-form {
    padding: 42px 24px 62px;
  }
}
</style>
