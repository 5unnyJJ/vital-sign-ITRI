/* ── HF Mock Data (替換為真實 API 後移除) ── */

export const HF_MOCK_PATIENTS = [
  { id: 'HF001', alias: '病患 A', age: 72, room: '301-A', ward: '心臟科' },
  { id: 'HF002', alias: '病患 B', age: 68, room: '302-B', ward: '心臟科' },
  { id: 'HF003', alias: '病患 C', age: 75, room: '303-C', ward: '心臟科' },
]

function _d(offset, hh, mm) {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${hh}:${mm}`
}

export const HF_MOCK_VITALS = {
  'HF001': [
    { ts: _d(0, '08', '10'), sbp: 138, dbp: 88, temp: 36.9 }, { ts: _d(0, '14', '00'), sbp: 142, dbp: 91, temp: 37.1 }, { ts: _d(0, '20', '30'), sbp: 135, dbp: 85, temp: 36.8 },
    { ts: _d(1, '08', '05'), sbp: 140, dbp: 90, temp: 36.7 }, { ts: _d(1, '14', '10'), sbp: 145, dbp: 93, temp: 37.0 }, { ts: _d(1, '20', '00'), sbp: 138, dbp: 87, temp: 36.9 },
    { ts: _d(2, '08', '15'), sbp: 136, dbp: 86, temp: 36.8 }, { ts: _d(2, '14', '20'), sbp: 141, dbp: 89, temp: 37.2 },
    { ts: _d(3, '09', '00'), sbp: 143, dbp: 92, temp: 37.0 }, { ts: _d(3, '15', '00'), sbp: 139, dbp: 88, temp: 36.9 },
    { ts: _d(4, '08', '30'), sbp: 137, dbp: 85, temp: 36.7 }, { ts: _d(4, '14', '30'), sbp: 140, dbp: 89, temp: 37.1 },
    { ts: _d(5, '08', '00'), sbp: 144, dbp: 91, temp: 37.0 }, { ts: _d(5, '14', '00'), sbp: 141, dbp: 90, temp: 36.8 },
    { ts: _d(6, '08', '20'), sbp: 139, dbp: 87, temp: 36.9 }, { ts: _d(6, '14', '10'), sbp: 142, dbp: 90, temp: 37.1 },
  ],
  'HF002': [
    { ts: _d(0, '07', '50'), sbp: 125, dbp: 78, temp: 36.5 }, { ts: _d(0, '13', '30'), sbp: 128, dbp: 80, temp: 36.7 }, { ts: _d(0, '19', '45'), sbp: 122, dbp: 76, temp: 36.6 },
    { ts: _d(1, '08', '10'), sbp: 130, dbp: 82, temp: 36.8 }, { ts: _d(1, '14', '00'), sbp: 127, dbp: 79, temp: 36.6 },
    { ts: _d(2, '08', '00'), sbp: 124, dbp: 77, temp: 36.5 }, { ts: _d(2, '14', '15'), sbp: 129, dbp: 81, temp: 36.9 },
    { ts: _d(3, '09', '10'), sbp: 126, dbp: 78, temp: 36.7 }, { ts: _d(4, '08', '00'), sbp: 131, dbp: 83, temp: 36.8 },
    { ts: _d(5, '09', '00'), sbp: 123, dbp: 76, temp: 36.5 }, { ts: _d(6, '08', '30'), sbp: 128, dbp: 80, temp: 36.6 },
  ],
  'HF003': [
    { ts: _d(0, '08', '30'), sbp: 152, dbp: 95, temp: 37.3 }, { ts: _d(0, '14', '00'), sbp: 158, dbp: 99, temp: 37.5 }, { ts: _d(0, '21', '00'), sbp: 150, dbp: 94, temp: 37.2 },
    { ts: _d(1, '08', '15'), sbp: 155, dbp: 97, temp: 37.4 }, { ts: _d(1, '13', '50'), sbp: 160, dbp: 100, temp: 37.6 },
    { ts: _d(2, '08', '00'), sbp: 153, dbp: 96, temp: 37.3 }, { ts: _d(2, '14', '30'), sbp: 156, dbp: 98, temp: 37.4 },
    { ts: _d(3, '08', '45'), sbp: 154, dbp: 97, temp: 37.2 }, { ts: _d(4, '09', '00'), sbp: 157, dbp: 99, temp: 37.5 },
    { ts: _d(5, '08', '00'), sbp: 151, dbp: 95, temp: 37.3 }, { ts: _d(6, '08', '30'), sbp: 155, dbp: 98, temp: 37.4 },
  ],
}

export const HF_MOCK_IO = {
  'HF001': [
    { ts: _d(0, '07', '30'), type: 'intake', amount: 200, note: '水' }, { ts: _d(0, '07', '45'), type: 'intake', amount: 150, note: '牛奶' },
    { ts: _d(0, '10', '00'), type: 'output', amount: 300, note: '尿' }, { ts: _d(0, '12', '00'), type: 'intake', amount: 250, note: '湯' },
    { ts: _d(0, '12', '30'), type: 'intake', amount: 100, note: '飲料' }, { ts: _d(0, '15', '00'), type: 'output', amount: 250, note: '尿' },
    { ts: _d(0, '18', '00'), type: 'intake', amount: 200, note: '水' }, { ts: _d(0, '18', '15'), type: 'intake', amount: 180, note: '稀飯' },
    { ts: _d(1, '07', '30'), type: 'intake', amount: 180, note: '水' }, { ts: _d(1, '08', '00'), type: 'intake', amount: 200, note: '牛奶' },
    { ts: _d(1, '10', '30'), type: 'output', amount: 350, note: '尿' }, { ts: _d(1, '12', '00'), type: 'intake', amount: 300, note: '湯' },
    { ts: _d(1, '15', '30'), type: 'output', amount: 280, note: '尿' }, { ts: _d(1, '18', '00'), type: 'intake', amount: 150, note: '水' },
    { ts: _d(2, '07', '45'), type: 'intake', amount: 200, note: '水' }, { ts: _d(2, '10', '00'), type: 'output', amount: 320, note: '尿' },
    { ts: _d(2, '12', '00'), type: 'intake', amount: 250, note: '湯' }, { ts: _d(2, '15', '00'), type: 'output', amount: 260, note: '尿' },
    { ts: _d(3, '08', '00'), type: 'intake', amount: 180, note: '水' }, { ts: _d(3, '10', '30'), type: 'output', amount: 300, note: '尿' },
    { ts: _d(4, '07', '30'), type: 'intake', amount: 200, note: '水' }, { ts: _d(4, '09', '30'), type: 'output', amount: 280, note: '尿' },
  ],
  'HF002': [
    { ts: _d(0, '07', '00'), type: 'intake', amount: 250, note: '水' }, { ts: _d(0, '09', '00'), type: 'output', amount: 200, note: '尿' },
    { ts: _d(0, '12', '00'), type: 'intake', amount: 300, note: '湯' }, { ts: _d(0, '14', '00'), type: 'output', amount: 250, note: '尿' },
    { ts: _d(0, '18', '00'), type: 'intake', amount: 200, note: '水' },
    { ts: _d(1, '07', '30'), type: 'intake', amount: 200, note: '水' }, { ts: _d(1, '10', '00'), type: 'output', amount: 220, note: '尿' },
    { ts: _d(1, '12', '00'), type: 'intake', amount: 280, note: '湯' }, { ts: _d(1, '15', '00'), type: 'output', amount: 230, note: '尿' },
    { ts: _d(2, '08', '00'), type: 'intake', amount: 220, note: '水' }, { ts: _d(2, '10', '30'), type: 'output', amount: 240, note: '尿' },
    { ts: _d(3, '08', '00'), type: 'intake', amount: 200, note: '水' }, { ts: _d(3, '10', '00'), type: 'output', amount: 210, note: '尿' },
    { ts: _d(4, '07', '45'), type: 'intake', amount: 230, note: '水' }, { ts: _d(4, '09', '30'), type: 'output', amount: 200, note: '尿' },
  ],
  'HF003': [
    { ts: _d(0, '06', '00'), type: 'intake', amount: 100, note: '水' }, { ts: _d(0, '08', '30'), type: 'output', amount: 400, note: '尿' },
    { ts: _d(0, '12', '00'), type: 'intake', amount: 350, note: '湯' }, { ts: _d(0, '13', '00'), type: 'output', amount: 350, note: '尿' },
    { ts: _d(0, '18', '00'), type: 'intake', amount: 200, note: '水' }, { ts: _d(0, '20', '00'), type: 'output', amount: 180, note: '尿' },
    { ts: _d(1, '06', '30'), type: 'intake', amount: 150, note: '水' }, { ts: _d(1, '09', '00'), type: 'output', amount: 420, note: '尿' },
    { ts: _d(1, '12', '00'), type: 'intake', amount: 300, note: '湯' }, { ts: _d(1, '14', '00'), type: 'output', amount: 360, note: '尿' },
    { ts: _d(2, '07', '00'), type: 'intake', amount: 200, note: '水' }, { ts: _d(2, '09', '30'), type: 'output', amount: 390, note: '尿' },
    { ts: _d(3, '07', '00'), type: 'intake', amount: 180, note: '水' }, { ts: _d(3, '09', '00'), type: 'output', amount: 380, note: '尿' },
    { ts: _d(4, '07', '30'), type: 'intake', amount: 160, note: '水' }, { ts: _d(4, '09', '30'), type: 'output', amount: 350, note: '尿' },
  ],
}
