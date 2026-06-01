import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useDashboardStore = defineStore('dashboard', () => {
  const currentDate = ref('')
  const currentMonth = ref('')
  const groupedCache = ref(null)
  const rawRowsCache = ref([])
  const dayViewRawRowsCache = ref([])
  const dayViewRawRowsCacheKey = ref('')
  const dailySummaryCache = ref({})
  const trendTab = ref('hbbr')
  const hbBreathRange = ref('day')
  const hbBreathSelectedDay = ref(null)
  const trendLineSet = ref(new Set(['hb', 'br']))
  const dayStats = ref(null)
  return {
    currentDate, currentMonth, groupedCache, rawRowsCache,
    dayViewRawRowsCache, dayViewRawRowsCacheKey, dailySummaryCache,
    trendTab, hbBreathRange, hbBreathSelectedDay, trendLineSet, dayStats
  }
})
