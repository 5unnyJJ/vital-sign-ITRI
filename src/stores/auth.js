import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false)
  const userEmail = ref('')
  const resumeSessionData = ref(null)
  const orgByTable = ref({})
  const memberIdsByTable = ref({})
  const tables = ref([])

  function setLoggedIn(email, tableList) {
    isLoggedIn.value = true
    userEmail.value = email
    tables.value = tableList
  }

  function logout() {
    isLoggedIn.value = false
    userEmail.value = ''
    resumeSessionData.value = null
    orgByTable.value = {}
    memberIdsByTable.value = {}
    tables.value = []
  }

  return { isLoggedIn, userEmail, resumeSessionData, orgByTable, memberIdsByTable, tables, setLoggedIn, logout }
})
