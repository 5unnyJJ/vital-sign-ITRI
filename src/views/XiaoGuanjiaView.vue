<template>
  <div class="page-shell">
    <div class="page-header">
      <button class="btn-back" @click="$router.back()">返回總覽</button>
      <div class="page-title-wrap">
        <div class="page-eyebrow">Voice Care Flow</div>
        <div class="page-title">語音小管家綁定登記</div>
      </div>
    </div>

    <div class="info-bar">
      <div class="info-item">
        <div class="info-label">綁定方式</div>
        <div class="info-value">表單登記 + QR 掃碼</div>
      </div>
      <div class="info-item">
        <div class="info-label">服務名稱</div>
        <div class="info-value">國衛院健康小管家</div>
      </div>
      <div class="info-item">
        <div class="info-label">LINE ID</div>
        <div class="info-value line-id">@081jsdge</div>
      </div>
      <div class="info-item">
        <div class="info-label">資料來源</div>
        <div class="info-value subtle">已預留自動帶入欄位對應</div>
      </div>
    </div>

    <div class="content-grid">
      <div class="card form-card">
        <div class="card-head">
          <div class="card-head-icon">表</div>
          <div class="card-head-text">
            <div class="card-head-title">會員資料登記</div>
            <div class="card-head-sub">欄位格式已依照實際流程調整，後續可直接串接 API 自動帶入。</div>
          </div>
        </div>

        <div v-if="submitted" class="success-banner">
          <div class="success-icon">✓</div>
          <div class="success-text">
            <strong>資料已儲存</strong>，接著請掃描右側 QR code 加入小管家完成綁定。
          </div>
        </div>

        <div v-else class="form-grid">
          <div class="field full">
            <label>姓名<span class="req">*</span></label>
            <input
              v-model="form.name"
              type="text"
              :class="{ error: errors.name }"
              placeholder="請輸入會員姓名"
              autocomplete="name"
            />
          </div>

          <div class="field full">
            <label>手機號碼<span class="req">*</span></label>
            <div class="inline-input">
              <input
                v-model="form.phone"
                type="tel"
                :class="{ error: errors.phone }"
                placeholder="09xxxxxxxx"
                autocomplete="tel"
                maxlength="10"
              />
              <button type="button" class="btn-inline-edit">編輯</button>
            </div>
          </div>

          <div class="field full">
            <label>生日<span class="req">*</span></label>
            <div class="triple-grid">
              <select v-model="form.birthRocYear" :class="{ error: errors.birthRocYear }">
                <option value="">年</option>
                <option v-for="year in rocYearOptions" :key="year" :value="String(year)">{{ year }}</option>
              </select>
              <select v-model="form.birthMonth" :class="{ error: errors.birthMonth }">
                <option value="">月</option>
                <option v-for="month in monthOptions" :key="month" :value="String(month)">{{ month }}</option>
              </select>
              <select v-model="form.birthDay" :class="{ error: errors.birthDay }">
                <option value="">日</option>
                <option v-for="day in dayOptions" :key="day" :value="String(day)">{{ day }}</option>
              </select>
            </div>
          </div>

          <div class="field full">
            <label>性別<span class="req">*</span></label>
            <div class="gender-grid">
              <button
                v-for="option in genderOptions"
                :key="option.value"
                type="button"
                class="gender-btn"
                :class="{ active: form.gender === option.value, error: errors.gender }"
                @click="form.gender = option.value"
              >
                <span class="gender-check">{{ form.gender === option.value ? '✓' : '' }}</span>
                <span>{{ option.label }}</span>
              </button>
            </div>
          </div>

          <div class="field">
            <label>身分別<span class="req">*</span></label>
            <select v-model="form.identity" :class="{ error: errors.identity }">
              <option value="">請選擇</option>
              <option v-for="option in identityOptions" :key="option" :value="option">{{ option }}</option>
            </select>
          </div>

          <div class="field">
            <label>族</label>
            <select v-model="form.ethnicity">
              <option value="">請選擇</option>
              <option v-for="option in ethnicityOptions" :key="option" :value="option">{{ option }}</option>
            </select>
          </div>

          <div class="field">
            <label>社區</label>
            <select v-model="form.community">
              <option value="">請選擇</option>
              <option v-for="option in communityOptions" :key="option" :value="option">{{ option }}</option>
            </select>
          </div>

          <div class="field">
            <label>語言<span class="req">*</span></label>
            <select v-model="form.language" :class="{ error: errors.language }">
              <option value="">請選擇</option>
              <option v-for="option in languageOptions" :key="option" :value="option">{{ option }}</option>
            </select>
          </div>

          <div class="field full">
            <label>居住地<span class="req">*</span></label>
            <div class="address-grid">
              <select v-model="form.city" :class="{ error: errors.city }">
                <option value="">請選擇縣市</option>
                <option v-for="city in cityOptions" :key="city" :value="city">{{ city }}</option>
              </select>
              <select v-model="form.district" :class="{ error: errors.district }" :disabled="!districtOptions.length">
                <option value="">請選擇區</option>
                <option v-for="district in districtOptions" :key="district" :value="district">{{ district }}</option>
              </select>
              <select v-model="form.village" :class="{ error: errors.village }" :disabled="!villageOptions.length">
                <option value="">請選擇里</option>
                <option v-for="village in villageOptions" :key="village" :value="village">{{ village }}</option>
              </select>
            </div>
          </div>

          <div class="field full">
            <label class="check-row">
              <input v-model="form.agreeTerms" type="checkbox" />
              <span>同意 服務條款及隱私權政策</span>
            </label>
            <div v-if="errors.agreeTerms" class="field-error">請先同意服務條款及隱私權政策</div>
          </div>

          <div class="field full submit-row">
            <button class="btn-submit" :disabled="!canSubmit" @click="handleSubmit">儲存</button>
          </div>
        </div>
      </div>

      <div class="card qr-card">
        <div class="qr-eyebrow">掃描加入 LINE 小管家</div>
        <div class="qr-box">
          <img :src="QR_B64" alt="國衛院健康小管家 QR code" width="180" height="180" />
        </div>
        <div class="qr-line-id">LINE @081jsdge</div>
        <div class="qr-divider"></div>
        <div class="qr-steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-text">先完成左側會員資料儲存。</div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-text">掃描 QR code 加入 <strong>國衛院健康小管家</strong>。</div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-text">依照 LINE 對話流程完成後續綁定。</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { QR_B64 } from '../assets/qr_xiaogj.js'

const route = useRoute()
const submitted = ref(false)

const genderOptions = [
  { label: '男性', value: 'male' },
  { label: '女性', value: 'female' },
  { label: '其他', value: 'other' },
]

const identityOptions = ['一般民眾', '長者', '個管師', '照顧者', '家屬', '其他']
const ethnicityOptions = ['一般', '原住民', '客家', '新住民', '其他']
const communityOptions = ['一般民眾', '社區關懷據點', '日照中心', '衛生所', '其他']
const languageOptions = ['國語', '台語', '客語', '英語', '其他']

const locationTree = {
  台北市: {
    大安區: ['大安里', '龍安里', '學府里'],
    信義區: ['西村里', '興雅里', '松隆里'],
  },
  新北市: {
    土城區: ['土城里', '員仁里', '清水里'],
    板橋區: ['景星里', '福丘里', '後埔里'],
    中和區: ['中原里', '景平里', '秀福里'],
  },
  桃園市: {
    桃園區: ['中正里', '同安里', '文明里'],
    中壢區: ['石頭里', '五權里', '自立里'],
  },
  台中市: {
    西屯區: ['何安里', '何德里', '潮洋里'],
    北屯區: ['平德里', '平心里', '松竹里'],
  },
  台南市: {
    東區: ['東明里', '崇文里', '裕農里'],
    永康區: ['中華里', '崑山里', '復興里'],
  },
  高雄市: {
    三民區: ['安發里', '本館里', '鼎盛里'],
    左營區: ['福山里', '菜公里', '新上里'],
  },
}

const form = reactive({
  name: '',
  phone: '',
  birthRocYear: '',
  birthMonth: '',
  birthDay: '',
  gender: '',
  identity: '',
  ethnicity: '',
  community: '',
  language: '',
  city: '',
  district: '',
  village: '',
  agreeTerms: false,
})

const errors = reactive({
  name: false,
  phone: false,
  birthRocYear: false,
  birthMonth: false,
  birthDay: false,
  gender: false,
  identity: false,
  language: false,
  city: false,
  district: false,
  village: false,
  agreeTerms: false,
})

const currentRocYear = new Date().getFullYear() - 1911
const rocYearOptions = Array.from({ length: 100 }, (_, index) => currentRocYear - index)
const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1)
const cityOptions = Object.keys(locationTree)

const dayOptions = computed(() => {
  const year = Number(form.birthRocYear)
  const month = Number(form.birthMonth)
  if (!year || !month) return []
  const adYear = year + 1911
  const lastDay = new Date(adYear, month, 0).getDate()
  return Array.from({ length: lastDay }, (_, index) => index + 1)
})

const districtOptions = computed(() => {
  if (!form.city) return []
  return Object.keys(locationTree[form.city] || {})
})

const villageOptions = computed(() => {
  if (!form.city || !form.district) return []
  return locationTree[form.city]?.[form.district] || []
})

const canSubmit = computed(() =>
  !!form.name.trim() &&
  /^09\d{8}$/.test(form.phone) &&
  !!form.birthRocYear &&
  !!form.birthMonth &&
  !!form.birthDay &&
  !!form.gender &&
  !!form.identity &&
  !!form.language &&
  !!form.city &&
  !!form.district &&
  !!form.village &&
  form.agreeTerms
)

watch(() => form.birthMonth, () => {
  if (form.birthDay && !dayOptions.value.includes(Number(form.birthDay))) form.birthDay = ''
})

watch(() => form.birthRocYear, () => {
  if (form.birthDay && !dayOptions.value.includes(Number(form.birthDay))) form.birthDay = ''
})

watch(() => form.city, () => {
  form.district = ''
  form.village = ''
})

watch(() => form.district, () => {
  form.village = ''
})

applyPrefill(route.query)

function applyPrefill(query) {
  const mapping = {
    name: 'name',
    phone: 'phone',
    gender: 'gender',
    identity: 'identity',
    ethnicity: 'ethnicity',
    community: 'community',
    language: 'language',
    city: 'city',
    district: 'district',
    village: 'village',
  }

  Object.entries(mapping).forEach(([queryKey, formKey]) => {
    const value = query[queryKey]
    if (typeof value === 'string' && value.trim()) form[formKey] = value.trim()
  })

  const birthday = typeof query.birthday === 'string' ? query.birthday.trim() : ''
  if (birthday) {
    const [y, m, d] = birthday.split(/[-/]/).map(Number)
    if (y && m && d) {
      form.birthRocYear = String(y > 1911 ? y - 1911 : y)
      form.birthMonth = String(m)
      form.birthDay = String(d)
    }
  }

  if (typeof query.agreeTerms === 'string') {
    form.agreeTerms = ['1', 'true', 'yes'].includes(query.agreeTerms.toLowerCase())
  }
}

function handleSubmit() {
  errors.name = !form.name.trim()
  errors.phone = !/^09\d{8}$/.test(form.phone)
  errors.birthRocYear = !form.birthRocYear
  errors.birthMonth = !form.birthMonth
  errors.birthDay = !form.birthDay
  errors.gender = !form.gender
  errors.identity = !form.identity
  errors.language = !form.language
  errors.city = !form.city
  errors.district = !form.district
  errors.village = !form.village
  errors.agreeTerms = !form.agreeTerms

  if (Object.values(errors).some(Boolean)) return

  const payload = {
    ...form,
    birthday: `${form.birthRocYear}/${form.birthMonth}/${form.birthDay}`,
  }

  console.log('xiao-guanjia submit', payload)
  submitted.value = true
}
</script>

<style scoped>
/* ── Shell ── */
.page-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 32px 48px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.btn-back {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--r-md);
  color: var(--text-mid);
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all .15s;
  backdrop-filter: blur(8px);
  box-shadow: 0 1px 4px rgba(40,70,55,.07);
}
.btn-back:hover { border-color: var(--mint); color: var(--mint-dark); background: var(--mint-xlight); }
.page-title-wrap { display: flex; flex-direction: column; gap: 2px; }
.page-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; color: var(--mint); }
.page-title { font-size: 19px; font-weight: 700; color: var(--text); letter-spacing: -.3px; }

/* ── Info bar ── */
.info-bar {
  display: flex;
  background: linear-gradient(180deg,rgba(255,255,255,.92),rgba(249,252,250,.84));
  border: 1px solid rgba(255,255,255,.72);
  border-radius: var(--r-lg);
  box-shadow: 0 1px 4px rgba(40,70,55,.07);
  overflow: hidden;
}
.info-item { flex: 1; padding: 12px 20px; border-right: 1px solid var(--border-light); }
.info-item:last-child { border-right: none; }
.info-label { font-size: 11px; font-weight: 600; letter-spacing: .4px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 4px; }
.info-value { font-size: 14.5px; font-weight: 700; color: var(--text); }
.info-value.line-id { color: var(--mint-mid); }
.info-value.subtle { font-weight: 500; font-size: 13px; color: var(--text-dim); }

/* ── Two-column ── */
.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 20px;
  align-items: start;
}

/* ── Card ── */
.card {
  background: linear-gradient(180deg,rgba(255,255,255,.92),rgba(249,252,250,.84));
  border: 1px solid rgba(255,255,255,.72);
  border-radius: var(--r-xl);
  box-shadow: 0 12px 34px rgba(66,98,81,.08);
  backdrop-filter: blur(10px);
  overflow: hidden;
}
.form-card { padding: 28px 32px 30px; }

/* ── Card head ── */
.card-head {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 24px; padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}
.card-head-icon {
  width: 36px; height: 36px;
  background: var(--mint-xlight); border: 1.5px solid var(--mint-light);
  border-radius: var(--r-md);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 800; color: var(--mint-dark); flex-shrink: 0;
}
.card-head-text { display: flex; flex-direction: column; gap: 2px; }
.card-head-title { font-size: 15px; font-weight: 700; color: var(--text); letter-spacing: -.2px; }
.card-head-sub { font-size: 12px; color: var(--text-dim); }

/* ── Form grid ── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 22px;
}
.field { display: flex; flex-direction: column; gap: 6px; }
.field.full { grid-column: 1 / -1; }

.field > label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .3px;
  text-transform: uppercase;
  color: var(--text-dim);
}
.req { color: var(--red); margin-left: 3px; }

/* ── Inputs & selects ── */
.field input,
.field select {
  height: 42px;
  padding: 0 13px;
  border: 1.5px solid var(--border);
  border-radius: var(--r-md);
  background: #fff;
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
  transition: border-color .15s, box-shadow .15s;
  outline: none;
}
.field input:focus,
.field select:focus {
  border-color: var(--mint);
  box-shadow: 0 0 0 3px rgba(122,170,150,.15);
}
.field input.error,
.field select.error { border-color: var(--red); background: #fff6f5; }
.field select:disabled { background: var(--bg); color: var(--text-dim); cursor: not-allowed; }

/* ── Phone row ── */
.inline-input {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}
.btn-inline-edit {
  height: 42px;
  padding: 0 16px;
  border: 1.5px solid var(--border);
  border-radius: var(--r-md);
  background: #fff;
  color: var(--mint-mid);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: border-color .15s;
  white-space: nowrap;
}
.btn-inline-edit:hover { border-color: var(--mint); }

/* ── Birthday ── */
.triple-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

/* ── Address ── */
.address-grid {
  display: grid;
  grid-template-columns: 2fr 2fr 2fr;
  gap: 10px;
}

/* ── Gender ── */
.gender-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.gender-btn {
  height: 46px;
  border: 1.5px solid var(--border);
  border-radius: var(--r-md);
  background: #fff;
  color: var(--text-dim);
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  cursor: pointer;
  transition: all .15s;
}
.gender-btn:hover { border-color: var(--mint); color: var(--mint-dark); }
.gender-btn.active {
  border-color: var(--mint);
  color: var(--mint-dark);
  background: var(--mint-xlight);
  box-shadow: inset 0 0 0 1px rgba(122,170,150,.2);
}
.gender-btn.error { border-color: var(--red); }
.gender-check { font-size: 13px; font-weight: 700; color: var(--mint-mid); }

/* ── Agree ── */
.check-row {
  display: flex; align-items: center; gap: 10px;
  font-size: 13.5px; font-weight: 600; color: var(--text-mid);
  cursor: pointer;
}
.check-row input[type="checkbox"] {
  width: 18px; height: 18px; min-height: 18px;
  accent-color: var(--mint);
  cursor: pointer;
}
.field-error { font-size: 12px; color: var(--red); font-weight: 600; margin-top: 2px; }

/* ── Submit ── */
.submit-row { margin-top: 4px; }
.btn-submit {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: var(--r-md);
  background: var(--mint);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  letter-spacing: .3px;
  transition: background .15s, transform .1s, opacity .15s;
}
.btn-submit:hover:not(:disabled) { background: var(--mint-mid); }
.btn-submit:active:not(:disabled) { transform: scale(.98); }
.btn-submit:disabled { background: var(--border); opacity: .7; cursor: not-allowed; }

/* ── Success ── */
.success-banner {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 16px 18px;
  background: var(--green-light);
  border: 1.5px solid var(--green);
  border-radius: var(--r-md);
}
.success-icon {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--green); color: #fff;
  font-size: 14px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.success-text { font-size: 14px; color: var(--text-mid); line-height: 1.55; }
.success-text strong { color: var(--text); }

/* ── QR card ── */
.qr-card {
  padding: 28px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  text-align: center;
  position: sticky; top: 84px;
}
.qr-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: var(--mint); }
.qr-box {
  width: 200px; height: 200px;
  background: #fff;
  border: 1.5px solid var(--border-light);
  border-radius: var(--r-lg);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 18px rgba(40,70,55,.09);
}
.qr-box img { width: 180px; height: 180px; object-fit: contain; display: block; }
.qr-line-id { font-size: 13px; font-weight: 700; color: var(--mint-mid); letter-spacing: .5px; }
.qr-divider { width: 80%; height: 1px; background: var(--border-light); }
.qr-steps { display: flex; flex-direction: column; gap: 10px; width: 100%; text-align: left; }
.step { display: flex; align-items: flex-start; gap: 10px; }
.step-num {
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--mint-xlight); border: 1.5px solid var(--mint-light);
  color: var(--mint-dark); font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.step-text { font-size: 12.5px; color: var(--text-dim); line-height: 1.5; }
.step-text strong { color: var(--text-mid); }

/* ── Responsive ── */
@media (max-width: 1000px) {
  .content-grid { grid-template-columns: 1fr; }
  .qr-card { position: static; flex-direction: row; flex-wrap: wrap; justify-content: center; padding: 24px 20px; }
  .qr-eyebrow { width: 100%; }
  .qr-divider { display: none; }
  .qr-steps { max-width: 220px; }
}
@media (max-width: 700px) {
  .page-shell { padding: 14px 14px 36px; }
  .form-card { padding: 20px 18px 22px; }
  .form-grid { grid-template-columns: 1fr; gap: 14px; }
  .info-bar { flex-wrap: wrap; }
  .info-item { min-width: 50%; border-bottom: 1px solid var(--border-light); }
  .address-grid { grid-template-columns: 1fr; }
  .triple-grid { grid-template-columns: repeat(3, 1fr); }
  .inline-input { grid-template-columns: 1fr auto; }
}
@media (max-width: 400px) {
  .triple-grid { grid-template-columns: 1fr; }
  .gender-grid { grid-template-columns: 1fr; }
}
</style>
