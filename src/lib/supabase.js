import { createClient } from '@supabase/supabase-js'

// OWASP A04: SUPABASE_ANON_KEY 為 Supabase 公開設計的前端金鑰（非 service_role key）
// 安全性依賴 Supabase 後台的 Row Level Security (RLS) 政策 — 請確保 RLS 已啟用
// 若 repo 為 public，此 key 可被他人看到，但在 RLS 正確設定下不會造成資料外洩
export const SUPABASE_URL = 'https://lrrxswxvphoeyuvemvin.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxycnhzd3h2cGhvZXl1dmVtdmluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMzU1NjksImV4cCI6MjA4MzkxMTU2OX0.54qS-CTVL9XeIbNO83r8spsRrk8woyBz3u-HoRdFxHs'

export const TABLE_LABELS = {
  'DC_data_base': '都蘭診所',
  'CY_data_base': '嘉義醫院',
  'YK_data_base': '員郭醫院',
  'T1_data_base': '紡綜所',
}

export const RPC_TABLE_MAP = {
  'DC_data_base': 'get_dc_overview',
  'CY_data_base': 'get_cy_overview',
  'YK_data_base': 'get_yk_overview',
  'T1_data_base': 'get_t1_overview',
}

export const ACTION_COLORS = {
  0: '#94a3b8',
  1: '#3b82f6',
  2: '#3b82f6',
  3: '#22c55e',
  4: '#22c55e',
  5: '#f97316',
  6: '#a855f7',
  7: '#ef4444',
}

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
