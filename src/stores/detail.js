import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useDetailStore = defineStore('detail', () => {
  const detailMemberId = ref(null)
  const detailMetrics = ref(new Set(['hb', 'bp', 'temp', 'br']))
  const detailRange = ref('today')
  const detailRawData = ref(null)
  const detailDailySummary = ref({})
  const detailSyncedDayRowsCache = ref([])
  return { detailMemberId, detailMetrics, detailRange, detailRawData, detailDailySummary, detailSyncedDayRowsCache }
})
