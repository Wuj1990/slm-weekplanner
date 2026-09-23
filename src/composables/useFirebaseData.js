// src/composables/useFirebaseData.js
import { ref, onMounted } from 'vue'
import { getDb, getTools } from '../firebase'

export function useFirebaseData(currentUser) {
  // Laad direct uit LocalStorage indien beschikbaar voor supersnelle initiële weergave
  const loadCache = (key, fallback) => {
    try {
      const cached = localStorage.getItem(key)
      return cached ? JSON.parse(cached) : fallback
    } catch (e) {
      return fallback
    }
  }

  const allDatabaseReservations = ref(loadCache('slm_cache_reservations', []))
  const activities = ref(loadCache('slm_cache_activities', []))
  const registeredUsers = ref(loadCache('slm_cache_users', []))
  const mandatoryBlocks = ref(loadCache('slm_cache_mandatory', []))
  
  // Als we cache hebben, hoeft het laadscherm niet lang te wachten
  const isLoading = ref(activities.value.length === 0)

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
        const data = s.docs.map(d => ({ id: d.id, ...d.data() }))
        allDatabaseReservations.value = data
        localStorage.setItem('slm_cache_reservations', JSON.stringify(data))
        checkAllLoaded()
      }, (err) => {
        console.error('Fout bij ophalen reserveringen:', err)
        checkAllLoaded()
      })

      // 2. Activiteiten luisteraar
      onSnapshot(collection(db, 'activities'), s => {
        const data = s.docs.map(d => ({ id: d.id, ...d.data() }))
        activities.value = data
        localStorage.setItem('slm_cache_activities', JSON.stringify(data))
        checkAllLoaded()
      }, (err) => {
        console.error('Fout bij ophalen activiteiten:', err)
        checkAllLoaded()
      })

      // 3. Gebruikers luisteraar met automatische synchronisatie van ingelogde gebruiker
      onSnapshot(collection(db, 'users'), s => {
        const data = s.docs.map(d => ({ ...d.data() }))
        registeredUsers.value = data
        localStorage.setItem('slm_cache_users', JSON.stringify(data))

        if (currentUser.value && !currentUser.value.isAdmin) {
          const latestMe = data.find(u => u.email?.toLowerCase().trim() === currentUser.value.email?.toLowerCase().trim())
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
        const data = s.docs.map(d => ({ id: d.id, ...d.data() }))
        mandatoryBlocks.value = data
        localStorage.setItem('slm_cache_mandatory', JSON.stringify(data))
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