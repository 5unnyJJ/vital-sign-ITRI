import { ref } from 'vue'
import { defineStore } from 'pinia'

export const usePostureStore = defineStore('posture', () => {
  const postureScreenDate = ref('')
  const postureScreenMemberId = ref('ALL')
  const postureCheckedActions = ref(new Set())
  const postureScreenMinuteRows = ref([])
  const postureRawRowsCache = ref([])
  return { postureScreenDate, postureScreenMemberId, postureCheckedActions, postureScreenMinuteRows, postureRawRowsCache }
})
