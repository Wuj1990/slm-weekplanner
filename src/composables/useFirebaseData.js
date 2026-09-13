// src/composables/useFirebaseData.js
import { ref, onMounted } from 'vue'
import { getDb, getTools } from '../firebase'

export function useFirebaseData(currentUser) {
  const allDatabaseReservations = ref([])
  const activities = ref([])
  const registeredUsers = ref([])
  const mandatoryBlocks = ref([])
  const isLoading = ref(true)

  onMounted(() => {
    const db = getDb()
    const { collection, onSnapshot } = getTools()
    if (!db || !collection || !onSnapshot) {
      isLoading.value = false
      return
    }

    const safetyTimeout = setTimeout(() => {
      if (isLoading.value) {
        isLoading.value = false
      }
    }, 1500)

    let loadedCount = 0
    const checkAllLoaded = () => {
      loadedCount++
      if (loadedCount >= 4) {
        clearTimeout(safetyTimeout)
        isLoading.value = false
      }
    }

    onSnapshot(collection(db, 'reservations'), s => {
      allDatabaseReservations.value = s.docs.map(d => ({ id: d.id, ...d.data() }))
      checkAllLoaded()
    }, () => checkAllLoaded())

    onSnapshot(collection(db, 'activities'), s => {
      activities.value = s.docs.map(d => ({ id: d.id, ...d.data() }))
      checkAllLoaded()
    }, () => checkAllLoaded())

    onSnapshot(collection(db, 'users'), s => {
      registeredUsers.value = s.docs.map(d => ({ ...d.data() }))
      if (currentUser.value && !currentUser.value.isAdmin) {
        const latestMe = registeredUsers.value.find(u => u.email?.toLowerCase().trim() === currentUser.value.email?.toLowerCase().trim())
        if (latestMe) {
          currentUser.value = latestMe
        }
      }
      checkAllLoaded()
    }, () => checkAllLoaded())

    onSnapshot(collection(db, 'mandatory'), s => {
      mandatoryBlocks.value = s.docs.map(d => ({ id: d.id, ...d.data() }))
      checkAllLoaded()
    }, () => checkAllLoaded())
  })

  return {
    allDatabaseReservations,
    activities,
    registeredUsers,
    mandatoryBlocks,
    isLoading
  }
}