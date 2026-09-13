<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  currentUser: Object,
  activities: Array,
  allDatabaseReservations: Array,
  mandatoryBlocks: Array,
  selectedWeek: String,
  availableWeeks: { type: Array, default: () => [] }
})

const emit = defineEmits(['toggle-slot', 'save-mandatory', 'remove-mandatory', 'update:selectedWeek', 'update-user-profile'])

const selectedActivity = ref(props.activities[0]?.id || '')

const showMandatoryModal = ref(false)
const modalDay = ref('')
const modalSlot = ref('')
const modalActivityId = ref('')
const modalTargetGroup = ref('ALL')

const showFirstLoginModal = ref(false)
const firstNameInput = ref('')
const lastNameInput = ref('')

onMounted(() => {
  if (props.currentUser && !props.currentUser.isAdmin) {
    const hasFirst = props.currentUser.firstName?.trim()
    const hasLast = props.currentUser.lastName?.trim()
    if (!hasFirst || !hasLast) showFirstLoginModal.value = true
  }
})

const handleSaveProfile = () => {
  if (!firstNameInput.value.trim() || !lastNameInput.value.trim()) return alert('Vul a.u.b. zowel je voornaam als je achternaam in.')
  emit('update-user-profile', {
    ...props.currentUser,
    firstName: firstNameInput.value.trim(),
    lastName: lastNameInput.value.trim(),
    name: `${firstNameInput.value.trim()} ${lastNameInput.value.trim()}`
  })
  showFirstLoginModal.value = false
}

const days = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag']
const timeSlots = [
  { id: 1, label: 'Lesuur 1 (08:25 - 09:15)' }, { id: 2, label: 'Lesuur 2 (09:15 - 10:05)' },
  { id: 'p1', label: '☕ Pauze (10:05 - 10:20)', isBreak: true },
  { id: 3, label: 'Lesuur 3 (10:20 - 11:10)' }, { id: 4, label: 'Lesuur 4 (11:10 - 12:00)' },
  { id: 6, label: 'Lesuur 6 (13:00 - 13:50)' }, { id: 7, label: 'Lesuur 7 (13:50 - 14:40)' },
  { id: 'p2', label: '☕ Pauze (14:40 - 14:55)', isBreak: true },
  { id: 8, label: 'Lesuur 8 (14:55 - 15:45)' }, { id: 9, label: 'Lesuur 9 (15:45 - 16:35)' }
]

const getActivityById = (id) => props.activities.find(a => String(a.id) === String(id)) || { id, name: 'Onbekend', color: '#64748b' }
const getReservationForSlot = (day, slotLabel) => props.allDatabaseReservations.find(r => r.userEmail?.toLowerCase().trim() === props.currentUser.email?.toLowerCase().trim() && r.day === day && r.slot === slotLabel && String(r.week).trim() === String(props.selectedWeek).trim())
const getMandatoryForSlot = (day, slotLabel) => props.mandatoryBlocks.find(m => m.day === day && m.slot === slotLabel && String(m.week).trim() === String(props.selectedWeek).trim())

// 1. BEZETTINGSMETER HELPER
const getSlotOccupancy = (day, slotLabel, activityId) => {
  return props.allDatabaseReservations.filter(r => 
    String(r.week).trim() === String(props.selectedWeek).trim() && 
    r.day === day && 
    r.slot === slotLabel && 
    String(r.activityId).trim() === String(activityId).trim()
  ).length
}

// 2. KOPIEER VORIGE WEEK FUNCTIE
const handleCopyPreviousWeek = () => {
  const currentIndex = props.availableWeeks.findIndex(w => String(w.id || w) === String(props.selectedWeek))
  if (currentIndex <= 0) return alert('Geen vorige week beschikbaar om van te kopiëren.')
  
  const prevWeek = props.availableWeeks[currentIndex - 1].id || props.availableWeeks[currentIndex - 1]
  const userEmail = props.currentUser.email.toLowerCase().trim()
  
  const prevReservations = props.allDatabaseReservations.filter(r => 
    r.userEmail?.toLowerCase().trim() === userEmail && String(r.week).trim() === String(prevWeek).trim()
  )

  if (prevReservations.length === 0) return alert(`Geen boekingen gevonden in ${prevWeek} om over te nemen.`)

  if (!confirm(`Wil je alle boekingen van ${prevWeek} overzetten naar ${props.selectedWeek}?`)) return

  prevReservations.forEach(res => {
    emit('toggle-slot', { 
      day: res.day, 
      slotObj: { label: res.slot }, 
      selectedActivity: res.activityId 
    })
  })
}

const openMandatoryModal = (day, slotLabel) => {
  modalDay.value = day
  modalSlot.value = slotLabel
  const existing = getMandatoryForSlot(day, slotLabel)
  modalActivityId.value = existing?.activityId || selectedActivity.value || props.activities[0]?.id || ''
  modalTargetGroup.value = existing?.targetLevelGroup || 'ALL'
  showMandatoryModal.value = true
}

const handleSaveMandatoryFromModal = () => {
  emit('save-mandatory', { week: props.selectedWeek, day: modalDay.value, slot: modalSlot.value, activityId: modalActivityId.value, targetLevelGroup: modalTargetGroup.value })
  showMandatoryModal.value = false
}

const handleRemoveMandatoryFromModal = () => {
  emit('remove-mandatory', { week: props.selectedWeek, day: modalDay.value, slot: modalSlot.value })
  showMandatoryModal.value = false
}

const validateBooking = (day, slotLabel) => {
  const act = props.activities.find(a => String(a.id) === String(selectedActivity.value))
  if (!act) return true

  const userEmail = props.currentUser.email.toLowerCase().trim()
  const weekReservations = props.allDatabaseReservations.filter(r => r.userEmail?.toLowerCase().trim() === userEmail && String(r.week).trim() === String(props.selectedWeek).trim())

  if (act.prerequisiteId && String(act.prerequisiteId).trim() !== '') {
    const prereqId = String(act.prerequisiteId).trim()
    const completedList = props.currentUser.completedActivities || []
    const hasCompletedPrereq = completedList.includes(String(prereqId))
    
    if (!hasCompletedPrereq) {
      const prereqObj = props.activities.find(a => String(a.id) === prereqId)
      alert(`🔒 Toegang geweigerd:\n\nJe kunt "${act.name}" pas inplannen nadat de beheerder "${prereqObj ? prereqObj.name : 'het verplichte voorgaande onderdeel'}" heeft afgewerkt en goedgekeurd.`)
      return false
    }
  }

  if (weekReservations.length >= 8) {
    alert('⚠️ Je hebt het maximale aantal van 8 uur per week in totaal bereikt.')
    return false
  }

  if (act.maxHours) {
    const actWeekCount = weekReservations.filter(r => String(r.activityId).trim() === String(selectedActivity.value).trim()).length
    if (actWeekCount >= Number(act.maxHours)) {
      alert(`⚠️ Je hebt het maximale aantal van ${act.maxHours} uur per week voor "${act.name}" bereikt.`)
      return false
    }
  }

  if (act.maxSlots) {
    const slotCount = props.allDatabaseReservations.filter(r => String(r.week).trim() === String(props.selectedWeek).trim() && r.day === day && r.slot === slotLabel && String(r.activityId).trim() === String(selectedActivity.value).trim()).length
    if (slotCount >= Number(act.maxSlots)) {
      alert(`⚠️ Dit lesuur is volgeboekt voor "${act.name}" (Max. ${act.maxSlots} leerlingen).`)
      return false
    }
  }

  return true
}

const handleSlotClick = (day, slotObj) => {
  if (slotObj.isBreak) return
  if (props.currentUser.isAdmin) return openMandatoryModal(day, slotObj.label)
  if (getMandatoryForSlot(day, slotObj.label)) return

  const existing = getReservationForSlot(day, slotObj.label)
  if (!existing && !validateBooking(day, slotObj.label)) return

  emit('toggle-slot', { day, slotObj, selectedActivity: selectedActivity.value })
}

// EXPORT EIGEN ROOSTER NAAR PDF
const exportStudentPDF = () => {
  const userReservations = props.allDatabaseReservations.filter(r => 
    r.userEmail?.toLowerCase().trim() === props.currentUser.email?.toLowerCase().trim() && 
    String(r.week).trim() === String(props.selectedWeek).trim()
  )

  if (userReservations.length === 0) return alert('Je hebt nog geen uren geboekt in deze week om te exporteren.')

  const newTab = window.open('about:blank', '_blank')
  if (!newTab) return alert('Popup geblokkeerd. Sta popups toe voor deze website.')

  const tableRowsHtml = timeSlots.map(slot => {
    if (slot.isBreak) return `<tr style="background:#e2e8f0;"><td style="font-size:0.8rem;padding:0.5rem;font-weight:bold;">${slot.label}</td><td colspan="5" style="text-align:center;font-weight:bold;color:#475569;">☕ PAUZE</td></tr>`
    const cells = days.map(day => {
      const res = userReservations.find(r => r.day === day && r.slot === slot.label)
      if (!res) return `<td style="padding:0.5rem;text-align:center;color:#cbd5e1;">-</td>`
      const act = getActivityById(res.activityId)
      return `<td style="padding:0.5rem;text-align:center;"><div style="background:${act.color};color:white;padding:0.4rem;border-radius:6px;font-size:0.85rem;"><strong>${act.name}</strong></div></td>`
    }).join('')
    return `<tr><td style="font-size:0.8rem;font-weight:bold;background:#f8fafc;padding:0.5rem;">${slot.label}</td>${cells}</tr>`
  }).join('')

  newTab.document.write(`
    <!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8">
    <title>Mijn Rooster - ${props.currentUser.name} - ${props.selectedWeek}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 2rem; background: #f8fafc; color: #0f172a; }
      .box { background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #cbd5e1; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
      table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #cbd5e1; }
      th, td { border: 1px solid #cbd5e1; padding: 0.6rem; text-align: center; }
      th { background: #f1f5f9; }
      @media print { .no-print { display: none; } body { padding: 0; background: white; } }
    </style></head><body>
      <div class="box">
        <div>
          <h1 style="margin:0;color:#051B35;">🎓 Mijn Weekrooster: ${props.currentUser.name}</h1>
          <p style="margin:0.3rem 0 0 0;color:#64748b;">E-mail: <strong>${props.currentUser.email}</strong> | Week: <strong>${props.selectedWeek}</strong></p>
        </div>
        <button class="no-print" onclick="window.print()" style="background:#2563eb;color:white;border:none;padding:0.6rem 1.2rem;border-radius:8px;font-weight:bold;cursor:pointer;">🖨️ Afdrukken / PDF</button>
      </div>
      <table><thead><tr><th>Tijdstip</th>${days.map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody>${tableRowsHtml}</tbody></table>
    </body></html>
  `)
  newTab.document.close()
}
</script>

<template>
  <main class="dashboard-wrapper">
    <div v-if="!currentUser.isAdmin && currentUser.levelGroups" class="student-levels-banner">
      <h3>Jouw Niveaugroepen</h3>
      <div class="student-levels-grid">
        <div v-for="(subj, icon) in { mechanica: '⚙️', elektriciteit: '⚡', 'technisch tekenen': '📐' }" :key="subj" class="level-card-item">
          <span class="vak-icon">{{ icon }}</span>
          <div>
            <span class="vak-name">{{ subj.charAt(0).toUpperCase() + subj.slice(1) }}</span>
            <div class="vak-level">{{ currentUser.levelGroups[subj] || currentUser.levelGroups['tekenen'] || 'Nog niet ingedeeld' }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-layout">
      <aside class="sidebar no-print">
        <h3 class="sidebar-title">Kies Onderdeel</h3>
        <div class="activity-list">
          <div 
            v-for="act in activities" 
            :key="act.id" 
            class="activity-card"
            :class="{ selected: String(selectedActivity) === String(act.id) }"
            @click="selectedActivity = act.id"
          >
            <div class="activity-header">
              <span class="badge" :style="{ backgroundColor: act.color }"></span>
              <span class="activity-title">{{ act.name }}</span>
            </div>
            <div class="activity-details">
              <p>Max. uren/wk: <strong>{{ act.maxHours || 'Geen' }}</strong></p>
              <p>Locatie: <strong>{{ act.location || 'Klassikaal' }}</strong></p>
            </div>
          </div>
        </div>
      </aside>

      <section class="schedule-container">
        <div class="header-flex-clean">
          <div>
            <h2 class="page-title">Weekrooster Inplannen</h2>
            <p v-if="currentUser.isAdmin" class="admin-hint-text">
              💡 <em>Klik op een lesuur om het te verplichten of te blokkeren voor praktijk.</em>
            </p>
          </div>

          <div class="header-right-actions">
            <button v-if="!currentUser.isAdmin" class="btn-secondary btn-copy-week" @click="handleCopyPreviousWeek" title="Neem rooster van vorige week over">
              📋 Kopieer Vorige Week
            </button>
            <button v-if="!currentUser.isAdmin" class="btn-secondary btn-copy-week" @click="exportStudentPDF" title="Exporteer jouw rooster naar PDF">
              📑 Print / PDF
            </button>
            <div class="week-picker-wrapper">
              <label>Schoolweek:</label>
              <select :value="selectedWeek" @change="emit('update:selectedWeek', $event.target.value)" class="week-select-dropdown">
                <option v-for="w in availableWeeks" :key="w.id" :value="w.id">{{ w.label }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="schedule-table">
            <thead>
              <tr>
                <th class="time-header">Tijdstip</th>
                <th v-for="day in days" :key="day">{{ day }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="slotObj in timeSlots" :key="slotObj.label" :class="{ 'break-row': slotObj.isBreak }">
                <td class="time-col">{{ slotObj.label }}</td>
                <template v-if="slotObj.isBreak">
                  <td colspan="5" class="break-cell">☕ PAUZE</td>
                </template>
                <template v-else>
                  <td 
                    v-for="day in days" 
                    :key="day" 
                    class="slot-cell slot-open"
                    @click="handleSlotClick(day, slotObj)"
                  >
                    <template v-if="getMandatoryForSlot(day, slotObj.label)?.targetLevelGroup === 'BLOCKED_PRACTICE'">
                      <div class="blocked-practice-block">🔒 Praktijk<br><small>(Niet beschikbaar)</small></div>
                    </template>
                    <template v-else-if="getMandatoryForSlot(day, slotObj.label)">
                      <div class="selected-block mandatory-block" :style="{ backgroundColor: getActivityById(getMandatoryForSlot(day, slotObj.label).activityId).color }">
                        <span class="block-title">📌 {{ getActivityById(getMandatoryForSlot(day, slotObj.label).activityId).name }}</span>
                        <span class="target-group-badge">{{ getMandatoryForSlot(day, slotObj.label).targetLevelGroup === 'ALL' ? 'Voor Iedereen' : getMandatoryForSlot(day, slotObj.label).targetLevelGroup }}</span>
                      </div>
                    </template>
                    <template v-else-if="getReservationForSlot(day, slotObj.label)">
                      <div class="selected-block" :style="{ backgroundColor: getActivityById(getReservationForSlot(day, slotObj.label).activityId).color }">
                        <span class="block-title">{{ getActivityById(getReservationForSlot(day, slotObj.label).activityId).name }}</span>
                      </div>
                    </template>
                    <template v-else>
                      <span class="text-muted-empty">
                        + Inplannen <br>
                        <small class="capacity-indicator">({{ getSlotOccupancy(day, slotObj.label, selectedActivity) }}/{{ getActivityById(selectedActivity).maxSlots || 1 }})</small>
                      </span>
                    </template>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- ONBOARDING POP-UP -->
    <div v-if="showFirstLoginModal" class="modal-overlay">
      <div class="modal-card">
        <h3>👋 Welkom op de SLM Weekplanner!</h3>
        <p class="modal-sub">Vul eenmalig je voornaam en achternaam in om verder te gaan.</p>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label>Voornaam:</label>
          <input v-model="firstNameInput" type="text" placeholder="bv. Jan" class="modal-select" required />
        </div>
        <div class="form-group" style="margin-bottom: 1.5rem;">
          <label>Achternaam:</label>
          <input v-model="lastNameInput" type="text" placeholder="bv. Peeters" class="modal-select" required />
        </div>
        <button class="btn-primary full-width" @click="handleSaveProfile">💾 Opslaan & Naar Planner</button>
      </div>
    </div>

    <!-- MODAL BEHEERDERS -->
    <div v-if="showMandatoryModal" class="modal-overlay" @click.self="showMandatoryModal = false">
      <div class="modal-card">
        <div class="modal-header-flex">
          <h3>⚙️ Lesuur Instellen / Blokkeren</h3>
          <button class="btn-close-modal" @click="showMandatoryModal = false">✕</button>
        </div>
        <p class="modal-sub"><strong>{{ modalDay }}</strong> - {{ modalSlot }}</p>

        <div class="form-group">
          <label>Type Instelling of Niveaugroep:</label>
          <select v-model="modalTargetGroup" class="modal-select">
            <option value="BLOCKED_PRACTICE">🔒 Praktijk (Blokkeer lesuur voor leerlingen)</option>
            <option value="ALL">👥 Verplicht - Voor Iedereen (Alle leerlingen)</option>
            <option value="Hefbomen">⚙️ Verplicht - Hefbomen</option>
            <option value="Tandwielen">⚙️ Verplicht - Tandwielen</option>
            <option value="Motor">⚙️ Verplicht - Motor</option>
          </select>
        </div>

        <div v-if="modalTargetGroup !== 'BLOCKED_PRACTICE'" class="form-group">
          <label>Kies Onderdeel / Vak:</label>
          <select v-model="modalActivityId" class="modal-select">
            <option v-for="act in activities" :key="act.id" :value="act.id">{{ act.name }}</option>
          </select>
        </div>

        <div class="modal-actions-flex">
          <button v-if="getMandatoryForSlot(modalDay, modalSlot)" class="btn-delete" @click="handleRemoveMandatoryFromModal">🗑️ Wis Instelling</button>
          <div class="right-actions">
            <button class="btn-secondary" @click="showMandatoryModal = false">Annuleren</button>
            <button class="btn-primary" @click="handleSaveMandatoryFromModal">💾 Opslaan</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.header-right-actions { display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap; }
.btn-copy-week { padding: 0.35rem 0.8rem; font-size: 0.85rem; font-weight: 700; cursor: pointer; }
.capacity-indicator { font-size: 0.7rem; color: #64748b; font-weight: 500; }
.grid-layout { display: flex; flex-direction: row; gap: 1.5rem; align-items: flex-start; width: 100%; }
.sidebar { width: 260px; min-width: 260px; max-width: 260px; flex-shrink: 0; background: #ffffff; border-radius: 12px; padding: 1.25rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
.sidebar-title { margin: 0 0 1rem 0; font-size: 1.1rem; color: #0f172a; font-weight: 700; width: 100%; display: block; }
.activity-list { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; }
.activity-card { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; cursor: pointer; transition: all 0.2s ease; width: 100%; display: block; }
.activity-card:hover { border-color: #cbd5e1; background: #ffffff; }
.activity-card.selected { border-color: #2563eb; background: #eff6ff; }
.activity-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
.badge { width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
.activity-title { font-weight: 700; font-size: 0.88rem; color: #1e293b; overflow-wrap: break-word; }
.activity-details p { margin: 0; font-size: 0.78rem; color: #64748b; }
.schedule-container { flex: 1; background: #ffffff; border-radius: 12px; padding: 1.5rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); min-width: 0; }
.header-flex-clean { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
.admin-hint-text { margin: 0.3rem 0 0 0; font-size: 0.82rem; color: #d97706; }
.week-picker-wrapper { display: flex; align-items: center; gap: 0.6rem; background: #f8fafc; padding: 0.4rem 0.8rem; border-radius: 8px; border: 1px solid #e2e8f0; }
.week-picker-wrapper label { font-size: 0.85rem; font-weight: 700; color: #475569; }
.week-select-dropdown { padding: 0.35rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #ffffff; font-size: 0.85rem; font-weight: 700; color: #0f172a; cursor: pointer; }
.table-responsive { width: 100%; overflow-x: auto; }
.schedule-table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; }
.schedule-table th, .schedule-table td { border: 1px solid #e2e8f0; text-align: center; vertical-align: middle; }
.schedule-table th { background-color: #f8fafc; padding: 0.75rem 0.5rem; font-size: 0.88rem; font-weight: 700; color: #1e293b; }
.time-header { width: 150px; }
.time-col { font-size: 0.78rem; font-weight: 700; color: #475569; background-color: #f8fafc; padding: 0.5rem; white-space: nowrap; }
.slot-cell { height: 62px; padding: 0.3rem; transition: background-color 0.15s ease; }
.slot-open:hover { background-color: #f1f5f9; cursor: pointer; }
.text-muted-empty { color: #94a3b8; font-size: 0.8rem; font-weight: 600; line-height: 1.3; }
.blocked-practice-block { color: #475569; font-size: 0.75rem; font-weight: 700; background: #f1f5f9; padding: 0.35rem; border-radius: 6px; border: 1px dashed #cbd5e1; line-height: 1.2; }
.selected-block { color: white; padding: 0.4rem; border-radius: 6px; font-size: 0.8rem; font-weight: 700; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; }
.mandatory-block { border: 2px solid rgba(0,0,0,0.15); }
.target-group-badge { font-size: 0.65rem; background: rgba(0, 0, 0, 0.25); padding: 0.1rem 0.35rem; border-radius: 4px; margin-top: 0.15rem; }
.break-row { background-color: #f1f5f9; }
.break-cell { font-weight: 700; color: #64748b; font-size: 0.8rem; letter-spacing: 1px; }

@media (max-width: 900px) {
  .grid-layout { flex-direction: column; }
  .sidebar { width: 100%; min-width: 100%; max-width: 100%; }
  .activity-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
}

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.modal-card { background: white; padding: 1.8rem; border-radius: 12px; width: 90%; max-width: 480px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); }
.modal-header-flex { display: flex; justify-content: space-between; align-items: center; }
.btn-close-modal { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b; }
.modal-sub { color: #475569; font-size: 0.9rem; margin-bottom: 1.2rem; padding-bottom: 0.6rem; border-bottom: 1px solid #e2e8f0; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-size: 0.85rem; font-weight: 700; color: #475569; }
.modal-select { width: 100%; padding: 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; background-color: #ffffff; }
.btn-primary { background: #2563eb; color: white; border: none; padding: 0.75rem; border-radius: 8px; font-size: 0.95rem; font-weight: 700; cursor: pointer; }
.btn-primary:hover { background: #1d4ed8; }
.btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 0.75rem; border-radius: 8px; font-size: 0.95rem; font-weight: 700; cursor: pointer; }
.btn-delete { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; padding: 0.75rem; border-radius: 8px; font-size: 0.95rem; font-weight: 700; cursor: pointer; }
.full-width { width: 100%; }
.modal-actions-flex { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }
.right-actions { display: flex; gap: 0.6rem; }
</style>