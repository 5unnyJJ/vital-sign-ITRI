import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useNavStore = defineStore('nav', () => {
  const currentScreen = ref('overview')
  const currentView = ref('day')
  const currentTable = ref(null)
  const currentPage = ref(0)
  return { currentScreen, currentView, currentTable, currentPage }
})
