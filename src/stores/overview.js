import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useOverviewStore = defineStore('overview', () => {
  const overviewMode = ref('today')
  const memberList = ref([])
  const currentMemberId = ref('ALL')
  const overviewCardData = ref({})
  const overviewTodayData = ref({})
  const overviewAllData = ref({})
  const scanToken = ref(0)
  const loadToken = ref(0)
  return { overviewMode, memberList, currentMemberId, overviewCardData, overviewTodayData, overviewAllData, scanToken, loadToken }
})
