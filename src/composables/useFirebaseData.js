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

    // Veiligheidstimer zodat de laadscherm-overlay nooit oneindig blijft hangen bij trage netwerken
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

    try {
      // 1. Reserveringen luisteraar
      onSnapshot(collection(db, 'reservations'), s => {
        allDatabaseReservations.value = s.docs.map(d => ({ id: d.id, ...d.data() }))
        checkAllLoaded()
      }, (err) => {
        console.error('Fout bij ophalen reserveringen:', err)
        checkAllLoaded()
      })

      // 2. Activiteiten luisteraar
      onSnapshot(collection(db, 'activities'), s => {
        activities.value = s.docs.map(d => ({ id: d.id, ...d.data() }))
        checkAllLoaded()
      }, (err) => {
        console.error('Fout bij ophalen activiteiten:', err)
        checkAllLoaded()
      })

      // 3. Gebruikers luisteraar met automatische synchronisatie van ingelogde gebruiker
      onSnapshot(collection(db, 'users'), s => {
        registeredUsers.value = s.docs.map(d => ({ ...d.data() }))
        if (currentUser.value && !currentUser.value.isAdmin) {
          const latestMe = registeredUsers.value.find(u => u.email?.toLowerCase().trim() === currentUser.value.email?.toLowerCase().trim())
          if (latestMe) {
            currentUser.value = latestMe
          }
        }
        checkAllLoaded()
      }, (err) => {
        console.error('Fout bij ophalen gebruikers:', err)
        checkAllLoaded()
      })

      // 4. Verplichte blokken luisteraar
      onSnapshot(collection(db, 'mandatory'), s => {
        mandatoryBlocks.value = s.docs.map(d => ({ id: d.id, ...d.data() }))
        checkAllLoaded()
      }, (err) => {
        console.error('Fout bij ophalen verplichte blokken:', err)
        checkAllLoaded()
      })

    } catch (error) {
      console.error('Kritieke fout in useFirebaseData:', error)
      isLoading.value = false
    }
  })

  return {
    allDatabaseReservations,
    activities,
    registeredUsers,
    mandatoryBlocks,
    isLoading
  }
}