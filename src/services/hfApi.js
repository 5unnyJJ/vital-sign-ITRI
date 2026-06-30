/* ── HF API Service ── */

const BASE = import.meta.env.DEV
  ? '/hf-api'
  : 'https://www.sstcmedicare.com/imedical/division/api'

const ENDPOINT           = `${BASE}/getPhysiDataList?location=yt`
const SUMMARIES_ENDPOINT = `${BASE}/getPatientSummaries?location=yt`

export async function fetchPhysiData(userFormKeyno, records = 30) {
  if (!userFormKeyno) throw new Error('missing userFormKeyno')
  const fd = new FormData()
  fd.append('data', JSON.stringify({ userFormKeyno, records }))
  const res = await fetch(ENDPOINT, { method: 'POST', body: fd })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!json.success) throw new Error('API returned success=false')
  return json.physicalResponse
}

export async function fetchPatientSummaries(records = 20) {
  const fd = new FormData()
  fd.append('data', JSON.stringify({ records }))
  const res = await fetch(SUMMARIES_ENDPOINT, { method: 'POST', body: fd })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!json.success) throw new Error('API returned success=false')
  return json.patientDatas
}

export function normalizePatientList(patientDatas = []) {
  return patientDatas.map(p => ({
    id:                  p.keyno,
    userFormKeyno:       p.keyno,
    alias:               p.patientName,
    age:                 p.age || '—',
    room:                '',
    ward:                '',
    sbp:                 p.sbp,
    dbp:                 p.dbp,
    temp:                p.temp,
    lastMeasurementTime: p.lastMeasurementTime,
    dailyIntake:         p.dailyIntake,
    dailyOutput:         p.dailyOutput,
  }))
}

export function normalizeVitals(data = []) {
  return data
    .filter(r => !r.deleteFlag)
    .map(r => ({
      ts:   `${r.evalDate}T${r.evalTime}`,
      sbp:  r.sbp,
      dbp:  r.dbp,
      temp: r.temp,
      bpm:  r.bpm,
      spo2: r.spo2,
    }))
}
