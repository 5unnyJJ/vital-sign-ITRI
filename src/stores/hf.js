import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useHfStore = defineStore('hf', () => {
  const HF_API_CONNECTED = false
  const currentHfMemberId = ref(null)
  const hfMembersCache = ref([])
  const hfMetrics = ref(new Set(['bp', 'temp']))
  const hfVitalsCache = ref(null)
  return { HF_API_CONNECTED, currentHfMemberId, hfMembersCache, hfMetrics, hfVitalsCache }
})
