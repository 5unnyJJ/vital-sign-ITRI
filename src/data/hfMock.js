/* ── HF Mock Data (替換為真實 API 後移除) ── */

export const HF_MOCK_PATIENTS = [
  { id: 'HF001', chartNo: 'A128288236', name: '謝小易', alias: '謝小易', gender: '男', age: 72, room: '301-A', ward: '心臟科', status: '例行追蹤' },
  { id: 'HF002', chartNo: 'B209374851', name: '林大明', alias: '林大明', gender: '男', age: 68, room: '302-B', ward: '心臟科', status: '積極治療' },
  { id: 'HF003', chartNo: 'C317456920', name: '王美珍', alias: '王美珍', gender: '女', age: 75, room: '303-C', ward: '心臟科', status: '例行追蹤' },
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

// type: '飯前' | '小便' | '大便' | '點滴'
// unit: 'g' | 'cc'
export const HF_MOCK_IO = {
  'HF001': [
    // 今天
    { ts: _d(0, '07', '30'), type: '飯前', value: 120,   unit: 'g' },
    { ts: _d(0, '08', '15'), type: '小便', value: 110,   unit: 'g' },
    { ts: _d(0, '11', '00'), type: '飯前', value: 180,   unit: 'g' },
    { ts: _d(0, '11', '20'), type: '小便', value: 95,    unit: 'g' },
    { ts: _d(0, '12', '00'), type: '點滴', value: 0,     unit: 'cc' },
    { ts: _d(0, '14', '30'), type: '大便', value: 327,   unit: 'g' },
    { ts: _d(0, '17', '00'), type: '小便', value: 98,    unit: 'g' },
    { ts: _d(0, '18', '00'), type: '大便', value: 145,   unit: 'g' },
    // 昨天
    { ts: _d(1, '11', '13'), type: '飯前', value: 153.5, unit: 'g' },
    { ts: _d(1, '11', '16'), type: '小便', value: 81,    unit: 'g' },
    { ts: _d(1, '11', '17'), type: '大便', value: 256,   unit: 'g' },
    { ts: _d(1, '11', '50'), type: '點滴', value: 130,   unit: 'cc' },
    // 前天
    { ts: _d(2, '08', '00'), type: '飯前', value: 200,   unit: 'g' },
    { ts: _d(2, '09', '30'), type: '小便', value: 120,   unit: 'g' },
    { ts: _d(2, '12', '00'), type: '飯前', value: 175,   unit: 'g' },
    { ts: _d(2, '14', '00'), type: '小便', value: 100,   unit: 'g' },
    { ts: _d(2, '14', '30'), type: '點滴', value: 250,   unit: 'cc' },
    { ts: _d(2, '16', '45'), type: '大便', value: 210,   unit: 'g' },
    // 3 天前
    { ts: _d(3, '08', '10'), type: '飯前', value: 165,   unit: 'g' },
    { ts: _d(3, '09', '00'), type: '小便', value: 88,    unit: 'g' },
    { ts: _d(3, '12', '30'), type: '飯前', value: 190,   unit: 'g' },
    { ts: _d(3, '13', '00'), type: '小便', value: 92,    unit: 'g' },
    { ts: _d(3, '15', '00'), type: '點滴', value: 130,   unit: 'cc' },
    // 4 天前
    { ts: _d(4, '08', '00'), type: '飯前', value: 140,   unit: 'g' },
    { ts: _d(4, '10', '00'), type: '小便', value: 75,    unit: 'g' },
    { ts: _d(4, '12', '00'), type: '飯前', value: 160,   unit: 'g' },
    { ts: _d(4, '14', '00'), type: '小便', value: 80,    unit: 'g' },
    { ts: _d(4, '14', '30'), type: '大便', value: 185,   unit: 'g' },
  ],
  'HF002': [
    { ts: _d(0, '07', '00'), type: '飯前', value: 200,   unit: 'g' },
    { ts: _d(0, '09', '00'), type: '小便', value: 150,   unit: 'g' },
    { ts: _d(0, '12', '00'), type: '飯前', value: 220,   unit: 'g' },
    { ts: _d(0, '14', '00'), type: '小便', value: 130,   unit: 'g' },
    { ts: _d(0, '15', '00'), type: '點滴', value: 200,   unit: 'cc' },
    { ts: _d(0, '18', '00'), type: '飯前', value: 180,   unit: 'g' },
    { ts: _d(1, '07', '30'), type: '飯前', value: 190,   unit: 'g' },
    { ts: _d(1, '10', '00'), type: '小便', value: 140,   unit: 'g' },
    { ts: _d(1, '12', '00'), type: '飯前', value: 210,   unit: 'g' },
    { ts: _d(1, '14', '00'), type: '點滴', value: 200,   unit: 'cc' },
    { ts: _d(1, '15', '00'), type: '小便', value: 125,   unit: 'g' },
    { ts: _d(2, '08', '00'), type: '飯前', value: 200,   unit: 'g' },
    { ts: _d(2, '10', '30'), type: '小便', value: 145,   unit: 'g' },
    { ts: _d(2, '12', '30'), type: '大便', value: 195,   unit: 'g' },
    { ts: _d(3, '08', '00'), type: '飯前', value: 185,   unit: 'g' },
    { ts: _d(3, '10', '00'), type: '小便', value: 110,   unit: 'g' },
  ],
  'HF003': [
    { ts: _d(0, '06', '00'), type: '點滴', value: 500,   unit: 'cc' },
    { ts: _d(0, '08', '30'), type: '小便', value: 320,   unit: 'g' },
    { ts: _d(0, '12', '00'), type: '飯前', value: 150,   unit: 'g' },
    { ts: _d(0, '13', '00'), type: '小便', value: 280,   unit: 'g' },
    { ts: _d(0, '18', '00'), type: '飯前', value: 120,   unit: 'g' },
    { ts: _d(0, '20', '00'), type: '小便', value: 190,   unit: 'g' },
    { ts: _d(1, '06', '30'), type: '點滴', value: 500,   unit: 'cc' },
    { ts: _d(1, '09', '00'), type: '小便', value: 350,   unit: 'g' },
    { ts: _d(1, '12', '00'), type: '飯前', value: 130,   unit: 'g' },
    { ts: _d(1, '14', '00'), type: '小便', value: 290,   unit: 'g' },
    { ts: _d(1, '16', '00'), type: '大便', value: 240,   unit: 'g' },
    { ts: _d(2, '07', '00'), type: '點滴', value: 500,   unit: 'cc' },
    { ts: _d(2, '09', '30'), type: '小便', value: 310,   unit: 'g' },
    { ts: _d(2, '12', '30'), type: '飯前', value: 140,   unit: 'g' },
    { ts: _d(3, '07', '00'), type: '點滴', value: 500,   unit: 'cc' },
    { ts: _d(3, '09', '00'), type: '小便', value: 300,   unit: 'g' },
  ],
}
