<!-- src/App.vue -->
<script setup>
import { ref, watch, onMounted } from 'vue'
import Header from './components/Header.vue'
import AuthView from './components/AuthView.vue'
import AdminManage from './components/AdminManage.vue'
import AdminOverview from './components/AdminOverview.vue'
import AdminUsers from './components/AdminUsers.vue'
import AdminHistory from './components/AdminHistory.vue'
import StudentProgress from './components/StudentProgress.vue'
import SchedulePlanner from './components/SchedulePlanner.vue'

import { useAutoLogout } from './composables/useAutoLogout'
import { getSchoolWeeksList } from './utils/dateUtils'
import { 
  getDb, 
  getTools, 
  registerUserInFirebase, 
  fetchUserByEmail,
  updateUserInFirebase, 
  toggleSlotInFirebase, 
  addActivityToFirebase, 
  updateActivityInFirebase,
  deleteActivityFromFirebase, 
  deleteReservationFromFirebase, 
  saveMandatoryBlock, 
  removeMandatoryBlock,
  deleteUserFromFirebase
} from './firebase'

const loadStorage = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d } catch { return d } }

const { currentWeek, weeks: availableWeeks } = getSchoolWeeksList()

const currentUser = ref(loadStorage('slm_currentUser', null))
const activeTab = ref('planner')
const authView = ref('home')
const authError = ref('')
const authSuccess = ref('')
const selectedWeek = ref(loadStorage('slm_selectedWeek', currentWeek))

const allDatabaseReservations = ref([])
const activities = ref([])
const registeredUsers = ref([])
const mandatoryBlocks = ref([])

const isLoading = ref(true)
const toastMessage = ref('')

const showToast = (msg) => {
  toastMessage.value = msg
  setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = ''
  }, 3000)
}

const handleNavigate = (view) => {
  authError.value = ''
  authSuccess.value = ''
  authView.value = view
}

const handleLogout = (reason = '') => {
  currentUser.value = null
  activeTab.value = 'planner'
  handleNavigate('home')
  if (reason) authError.value = reason
}

useAutoLogout(currentUser, handleLogout, 15)

onMounted(() => {
  const db = getDb()
  const { collection, onSnapshot } = getTools()
  if (!db || !collection || !onSnapshot) {
    isLoading.value = false
    return
  }

  let loadedCount = 0
  const checkAllLoaded = () => {
    loadedCount++
    if (loadedCount >= 4) {
      isLoading.value = false
    }
  }

  onSnapshot(collection(db, 'reservations'), s => {
    allDatabaseReservations.value = s.docs.map(d => ({ id: d.id, ...d.data() }))
    checkAllLoaded()
  })
  onSnapshot(collection(db, 'activities'), s => {
    if (!s.empty) activities.value = s.docs.map(d => ({ id: d.id, ...d.data() }))
    checkAllLoaded()
  })
  onSnapshot(collection(db, 'users'), s => {
    if (!s.empty) {
      registeredUsers.value = s.docs.map(d => ({ ...d.data() }))
      if (currentUser.value && !currentUser.value.isAdmin) {
        const latestMe = registeredUsers.value.find(u => u.email?.toLowerCase().trim() === currentUser.value.email?.toLowerCase().trim())
        if (latestMe) {
          currentUser.value = latestMe
        }
      }
    }
    checkAllLoaded()
  })
  onSnapshot(collection(db, 'mandatory'), s => {
    mandatoryBlocks.value = s.docs.map(d => ({ id: d.id, ...d.data() }))
    checkAllLoaded()
  })
})

const handleLogin = async (data) => {
  authError.value = ''; authSuccess.value = ''
  const email = (data?.email || '').trim().toLowerCase()
  const password = (data?.password || '').trim()

  if (!email || !password) return authError.value = 'Vul a.u.b. zowel je e-mailadres als je wachtwoord in.'

  if (email === 'wuj@slm.be' && password === 'slmAdmin2026!') {
    currentUser.value = {
      email: 'wuj@slm.be', password, isAdmin: true, name: 'Wuj',
      levelGroups: { mechanica: 'Nog niet ingedeeld', elektriciteit: 'Nog niet ingedeeld', tekenen: 'Nog niet ingedeeld' }
    }
    showToast('Welkom terug, beheerder Wuj!')
    return activeTab.value = authView.value = 'planner'
  }

  let user = registeredUsers.value.find(u => u.email === email) || await fetchUserByEmail(email)
  if (!user) return authError.value = 'Geen account gevonden met dit e-mailadres.'
  if (user.password !== password) return authError.value = 'Ongeldig wachtwoord.'

  currentUser.value = user
  
  if (user.mustChangePassword) {
    authView.value = 'change-password'
    showToast('Gelieve je tijdelijke wachtwoord te wijzigen voor je verder gaat.')
  } else {
    showToast(`Succesvol ingelogd als ${user.name || user.email}`)
    activeTab.value = authView.value = 'planner'
  }
}

const handleRegister = async (data) => {
  authError.value = ''; authSuccess.value = ''
  const email = (data?.email || '').trim().toLowerCase()
  const password = (data?.password || '').trim()
  const confirmPassword = (data?.confirmPassword || '').trim()

  if (!email || !password || !confirmPassword) return authError.value = 'Vul a.u.b. alle velden in.'
  if (password !== confirmPassword) return authError.value = 'De ingevoerde wachtwoorden komen niet overeen.'
  if (password.length < 6) return authError.value = 'Het wachtwoord moet minimaal 6 tekens lang zijn.'
  if (registeredUsers.value.some(u => u.email === email)) return authError.value = 'Er bestaat al een account met dit e-mailadres.'

  const newUser = {
    email, password, isAdmin: email.endsWith('@slm.be'), name: email, firstName: '', lastName: '',
    levelGroups: { mechanica: 'Nog niet ingedeeld', elektriciteit: 'Nog niet ingedeeld', tekenen: 'Nog niet ingedeeld' },
    completedActivities: [],
    mustChangePassword: false
  }

  try {
    const created = await registerUserInFirebase(newUser)
    if (created) registeredUsers.value.push(created)
    authSuccess.value = 'Account succesvol aangemaakt! Je kunt nu inloggen.'
    authView.value = 'login'
    showToast('Account succesvol geregistreerd!')
  } catch (e) {
    authError.value = 'Fout bij opslaan: ' + e.message
  }
}

const handleRegisterUserFromCSV = async (newUser) => {
  try {
    const created = await registerUserInFirebase(newUser)
    if (created && !registeredUsers.value.some(u => u.email === created.email)) {
      registeredUsers.value.push(created)
    }
  } catch (e) {
    console.error('Fout bij importeren gebruiker uit CSV:', e)
  }
}

const handleToggleSlot = async ({ day, slotObj, selectedActivity }) => {
  const existing = allDatabaseReservations.value.find(r => r.userEmail === currentUser.value.email && r.day === day && r.slot === slotObj.label && r.week === selectedWeek.value)
  await toggleSlotInFirebase({
    userEmail: currentUser.value.email, userName: currentUser.value.name, week: selectedWeek.value,
    day, slotLabel: slotObj.label, activityId: selectedActivity, isExisting: !!existing
  })
  showToast(existing ? 'Boeking geannuleerd' : 'Boeking succesvol opgeslagen!')
}

const handleDeleteUser = async (email) => {
  if (confirm(`Weet je zeker dat je het account van ${email} definitief wilt verwijderen?`)) {
    await deleteUserFromFirebase(email)
    registeredUsers.value = registeredUsers.value.filter(u => u.email !== email)
    showToast(`Account van ${email} verwijderd.`)
  }
}

const handleUpdateUserAndSync = async (updatedUser) => {
  await updateUserInFirebase(updatedUser)
  
  const index = registeredUsers.value.findIndex(u => u.email?.toLowerCase().trim() === updatedUser.email?.toLowerCase().trim())
  if (index !== -1) {
    registeredUsers.value[index] = updatedUser
  }

  if (currentUser.value && currentUser.value.email?.toLowerCase().trim() === updatedUser.email?.toLowerCase().trim()) {
    currentUser.value = { ...updatedUser }
  }

  showToast('Voortgang en gebruikersgegevens bijgewerkt!')
}

const handleUpdateUserProfile = async (updatedUser) => {
  currentUser.value = updatedUser
  if (updatedUser.mustChangePassword) {
    updatedUser.mustChangePassword = false
  }
  await updateUserInFirebase(updatedUser)
  showToast('Profiel succesvol bijgewerkt!')
}

watch(currentUser, val => val ? localStorage.setItem('slm_currentUser', JSON.stringify(val)) : localStorage.removeItem('slm_currentUser'))
watch(selectedWeek, val => localStorage.setItem('slm_selectedWeek', JSON.stringify(val)))
</script>

<template>
  <div class="app-container">
    <!-- LAADSCHERM -->
    <div v-if="isLoading" class="loading-overlay-screen">
      <div class="spinner"></div>
      <p>Gegevens ophalen van de database...</p>
    </div>

    <Header :current-user="currentUser" v-model:active-tab="activeTab" @change-password="handleNavigate('change-password')" @logout="handleLogout" />

    <AuthView v-if="!currentUser || authView === 'change-password'" :auth-view="authView" :current-user="currentUser" :auth-error="authError" :auth-success="authSuccess" @login="handleLogin" @register="handleRegister" @navigate="handleNavigate" />

    <template v-else>
      <AdminManage v-if="currentUser.isAdmin && activeTab === 'activities_manage'" :activities="activities" :available-weeks="availableWeeks" v-model:selected-week="selectedWeek" @add-activity="(a) => { addActivityToFirebase(a); showToast('Onderdeel toegevoegd!'); }" @update-activity="(a) => { updateActivityInFirebase(a); showToast('Onderdeel bijgewerkt!'); }" @delete-activity="(id) => { deleteActivityFromFirebase(id); showToast('Onderdeel verwijderd!'); }" />
      <AdminOverview v-else-if="currentUser.isAdmin && activeTab === 'admin'" :reservations="allDatabaseReservations" :unique-students="registeredUsers.filter(u => !u.isAdmin)" :selected-week="selectedWeek" :available-weeks="availableWeeks" :activities="activities" @update:selected-week="selectedWeek = $event" @delete-reservation="(id) => { deleteReservationFromFirebase(id); showToast('Boeking verwijderd.'); }" />
      
      <AdminHistory 
        v-else-if="currentUser.isAdmin && activeTab === 'history'" 
        :registered-users="registeredUsers" 
        :reservations="allDatabaseReservations" 
        :activities="activities" 
        :available-weeks="availableWeeks" 
        :current-week="currentWeek" 
        @update-user="handleUpdateUserAndSync" 
      />

      <AdminUsers 
        v-else-if="currentUser.isAdmin && activeTab === 'users'" 
        :registered-users="registeredUsers" 
        :activities="activities"
        @update-user="handleUpdateUserAndSync" 
        @register-user="handleRegisterUserFromCSV"
        @delete-user="handleDeleteUser" 
      />

      <!-- NIEUW: Voortgang per leerling overzicht -->
      <StudentProgress 
        v-else-if="currentUser.isAdmin && activeTab === 'student_progress'" 
        :registered-users="registeredUsers" 
        :activities="activities" 
        @update-user="handleUpdateUserAndSync" 
      />

      <SchedulePlanner v-else :current-user="currentUser" :activities="activities" :all-database-reservations="allDatabaseReservations" :mandatory-blocks="mandatoryBlocks" :available-weeks="availableWeeks" v-model:selected-week="selectedWeek" @toggle-slot="handleToggleSlot" @save-mandatory="(b) => { saveMandatoryBlock(b); showToast('Lesuur instelling opgeslagen!'); }" @remove-mandatory="(b) => { removeMandatoryBlock(b); showToast('Instelling gewist.'); }" @update-user-profile="handleUpdateUserProfile" />
    </template>

    <!-- TOAST NOTIFICATIE POPUP -->
    <transition name="toast-fade">
      <div v-if="toastMessage" class="global-toast-notification">
        ✨ {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.loading-overlay-screen {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  gap: 1rem;
  color: #0f172a;
  font-weight: 700;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.global-toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #0f172a;
  color: #ffffff;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  border-left: 4px solid #10b981;
}

.toast-fade-enter-active, .toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-fade-enter-from, .toast-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
```[cite: 4]