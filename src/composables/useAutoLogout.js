import { onMounted, onUnmounted, watch } from 'vue'

export function useAutoLogout(currentUser, onLogout, timeoutMinutes = 15) {
  let timer = null
  const timeoutMs = timeoutMinutes * 60 * 1000
  const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']

  const resetTimer = () => {
    if (timer) clearTimeout(timer)
    if (currentUser.value) {
      timer = setTimeout(() => {
        onLogout('Je bent automatisch uitgelogd wegens inactiviteit.')
      }, timeoutMs)
    }
  }

  const handleActivity = () => {
    resetTimer()
  }

  onMounted(() => {
    events.forEach(e => window.addEventListener(e, handleActivity))
    resetTimer()
  })

  onUnmounted(() => {
    events.forEach(e => window.removeEventListener(e, handleActivity))
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