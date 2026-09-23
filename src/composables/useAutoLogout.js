// src/composables/useAutoLogout.js
import { onMounted, onUnmounted, watch } from 'vue'

export function useAutoLogout(currentUser, onLogout, timeoutMinutes = 15) {
  let timer = null
  const timeoutMs = timeoutMinutes * 60 * 1000
  const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
  let lastActiveTimestamp = Date.now()

  const resetTimer = () => {
    if (timer) clearTimeout(timer)
    if (currentUser.value) {
      lastActiveTimestamp = Date.now()
      timer = setTimeout(() => {
        onLogout('Je bent automatisch uitgelogd wegens inactiviteit.')
      }, timeoutMs)
    }
  }

  const handleActivity = () => {
    resetTimer()
  }

  // Ondersteuning voor mobiele achtergrond-staten (wanneer het scherm uitgaat of van app gewisseld wordt)
  const handleVisibilityChange = () => {
    if (!currentUser.value) return
    
    if (document.visibilityState === 'visible') {
      const elapsed = Date.now() - lastActiveTimestamp
      if (elapsed >= timeoutMs) {
        onLogout('Je bent automatisch uitgelogd wegens inactiviteit.')
      } else {
        resetTimer()
      }
    } else {
      lastActiveTimestamp = Date.now()
      if (timer) clearTimeout(timer)
    }
  }

  onMounted(() => {
    events.forEach(e => window.addEventListener(e, handleActivity))
    document.addEventListener('visibilitychange', handleVisibilityChange)
    resetTimer()
  })

  onUnmounted(() => {
    events.forEach(e => window.removeEventListener(e, handleActivity))
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    if (timer) clearTimeout(timer)
  })

  watch(currentUser, (user) => {
    if (user) {
      resetTimer()
    } else if (timer) {
      clearTimeout(timer)
    }
  })
}