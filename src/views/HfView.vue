<template>
  <div class="hf-main screen-shell">
    <div class="hf-header">
      <div>
        <div class="hf-title">🫀 心衰生理資料</div>
        <div class="hf-subtitle">即時資料</div>
      </div>
      <button class="btn-back" @click="router.push('/overview')" aria-label="返回總覽">← 返回總覽</button>
    </div>

    <!-- Patient grid -->
    <div class="hf-grid" v-if="patients.length">
      <div
        class="hf-card"
        v-for="p in patients"
        :key="p.id"
        @click="goHfDetail(p.id)"
      >
        <div class="hf-card-top">
          <div class="hf-avatar">{{ p.alias[0] }}</div>
          <div>
            <div class="hf-card-name">{{ p.alias }}</div>
            <div class="hf-card-room">{{ p.room }} · {{ p.ward }}</div>
          </div>
        </div>
        <div class="hf-vitals">
          <div class="hf-vital-item">
            <div class="hf-vital-label">血壓</div>
            <div class="hf-vital-val" :class="{ 'no-data': !lastVital(p) }">
              {{ lastVital(p) ? `${lastVital(p).sbp}/${lastVital(p).dbp} mmHg` : '—' }}
            </div>
          </div>
          <div class="hf-vital-item">
            <div class="hf-vital-label">額溫</div>
            <div class="hf-vital-val" :class="{ 'no-data': !lastVital(p) }">
              {{ lastVital(p) ? `${lastVital(p).temp} °C` : '—' }}
            </div>
          </div>
          <div class="hf-vital-item">
            <div class="hf-vital-label">年齡</div>
            <div class="hf-vital-val">{{ p.age }} 歲</div>
          </div>
          <div class="hf-vital-item">
            <div class="hf-vital-label">最後量測</div>
            <div class="hf-vital-val">{{ lastVital(p) ? lastVital(p).ts.slice(11, 16) : '—' }}</div>
          </div>
        </div>
        <div class="hf-io-row">
          <div class="hf-io-badge">
            <div class="hf-io-badge-label">今日攝入</div>
            <div class="hf-io-badge-val">{{ todayIntake(p) ? todayIntake(p) + ' ml' : '—' }}</div>
          </div>
          <div class="hf-io-badge">
            <div class="hf-io-badge-label">今日排出</div>
            <div class="hf-io-badge-val">{{ todayOutput(p) ? todayOutput(p) + ' ml' : '—' }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="trend-empty" v-else>無資料</div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHfStore } from '@/stores/hf.js'
import { fetchPatientSummaries, normalizePatientList } from '@/services/hfApi.js'

const router = useRouter()
const hfStore = useHfStore()

const patients = computed(() => hfStore.hfMembersCache)

function lastVital(p) {
  if (!p.sbp && !p.dbp && !p.temp) return null
  return { sbp: p.sbp, dbp: p.dbp, temp: p.temp, ts: `0000-00-00T${p.lastMeasurementTime || ''}` }
}

function todayIntake(p) { return p.dailyIntake || 0 }
function todayOutput(p) { return p.dailyOutput || 0 }

function goHfDetail(id) {
  hfStore.currentHfMemberId = id
  router.push(`/hf/${id}`)
}

onMounted(async () => {
  try {
    const raw = await fetchPatientSummaries(20)
    hfStore.hfMembersCache = normalizePatientList(raw)
  } catch (e) {
    console.warn('[HF] 個案清單 API 失敗：', e.message)
  }
})
</script>

<style scoped>
.screen-shell {
  position: relative;
}

.hf-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 16px 100px;
}

.hf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.hf-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--mint-dark);
}

.hf-subtitle {
  font-size: 13px;
  color: var(--text-dim);
  margin-top: 2px;
}

.hf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.hf-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 16px;
  cursor: pointer;
  transition: all .15s;
  position: relative;
  overflow: hidden;
}

.hf-card:hover {
  box-shadow: var(--shadow);
  border-color: var(--mint);
}

.hf-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.hf-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--mint), var(--mint-mid));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.hf-card-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.hf-card-room {
  font-size: 12px;
  color: var(--text-dim);
}

.hf-vitals {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 12px;
  margin-bottom: 10px;
}

.hf-vital-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.hf-vital-label {
  font-size: 10px;
  color: var(--text-light);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .4px;
}

.hf-vital-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.hf-vital-val.no-data {
  color: var(--text-light);
  font-weight: 400;
}

.hf-io-row {
  display: flex;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--border-light);
}

.hf-io-badge {
  flex: 1;
  text-align: center;
  background: var(--bg-alt);
  border-radius: var(--r-sm);
  padding: 6px 4px;
}

.hf-io-badge-label {
  font-size: 9px;
  color: var(--text-light);
  font-weight: 600;
  letter-spacing: .4px;
}

.hf-io-badge-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--mint-dark);
}

.hf-card-footer {
  font-size: 11px;
  color: var(--text-light);
  margin-top: 8px;
}

.hf-api-banner {
  background: var(--orange-light);
  border: 1px solid var(--orange);
  border-radius: var(--r-md);
  padding: 10px 14px;
  font-size: 12px;
  color: var(--orange);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
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

.trend-empty {
  text-align: center;
  padding: 40px 0;
  color: var(--text-dim);
  font-size: 14px;
}
</style>
