import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useHfStore = defineStore('hf', () => {
  const HF_API_CONNECTED = ref(false)
  const currentHfMemberId = ref(null)
  const hfMembersCache = ref([])
  const hfMetrics = ref(new Set(['bp', 'temp']))
  const hfVitalsCache = ref(null)

  function setApiConnected(v) {
    HF_API_CONNECTED.value = v
  }

  return { HF_API_CONNECTED, setApiConnected, currentHfMemberId, hfMembersCache, hfMetrics, hfVitalsCache }
})
