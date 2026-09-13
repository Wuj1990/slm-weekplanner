<!-- src/components/AdminHistory.vue -->
<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  registeredUsers: { type: Array, default: () => [] },
  reservations: { type: Array, default: () => [] },
  activities: { type: Array, default: () => [] },
  availableWeeks: { type: Array, default: () => [] },
  currentWeek: { type: String, default: '' }
})

const emit = defineEmits(['update-user'])

const selectedEmail = ref('')
const selectedWeek = ref(props.currentWeek || props.availableWeeks[0]?.id || '')
const batchActivityId = ref('')

const days = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag']
const timeSlots = [
  { label: 'Lesuur 1 (08:25 - 09:15)' }, { label: 'Lesuur 2 (09:15 - 10:05)' },
  { label: '☕ Pauze (10:05 - 10:20)', isBreak: true },
  { label: 'Lesuur 3 (10:20 - 11:10)' }, { label: 'Lesuur 4 (11:10 - 12:00)' },
  { label: 'Lesuur 6 (13:00 - 13:50)' }, { label: 'Lesuur 7 (13:50 - 14:40)' },
  { label: '☕ Pauze (14:40 - 14:55)', isBreak: true },
  { label: 'Lesuur 8 (14:55 - 15:45)' }, { label: 'Lesuur 9 (15:45 - 16:35)' }
]

const students = computed(() => props.registeredUsers.filter(u => !u.isAdmin))
const selectedStudent = computed(() => students.value.find(s => s.email.toLowerCase() === selectedEmail.value.toLowerCase()))

const studentReservations = computed(() => {
  if (!selectedEmail.value) return []
  const email = selectedEmail.value.toLowerCase()
  return props.reservations.filter(r => r.userEmail?.toLowerCase() === email && String(r.week) === String(selectedWeek.value))
})

const getActivity = (id) => props.activities.find(a => String(a.id) === String(id)) || { name: 'Onbekend', color: '#64748b' }
const getRes = (day, slot) => studentReservations.value.find(r => r.day === day && r.slot === slot)

const handleCompletionToggle = (activityId, event) => {
  if (!selectedStudent.value) return
  const isChecked = event.target.checked
  const currentCompleted = selectedStudent.value.completedActivities || []
  
  const updatedCompleted = isChecked 
    ? [...new Set([...currentCompleted, String(activityId)])]
    : currentCompleted.filter(id => String(id) !== String(activityId))

  emit('update-user', {
    ...selectedStudent.value,
    completedActivities: updatedCompleted
  })
}

const handleBatchComplete = () => {
  if (!batchActivityId.value) return alert('Kies eerst een onderdeel om in bulk af te werken.')
  
  const weekRes = props.reservations.filter(r => 
    String(r.week).trim() === String(selectedWeek.value).trim() && 
    String(r.activityId).trim() === String(batchActivityId.value).trim()
  )

  if (weekRes.length === 0) {
    return alert(`Geen leerlingen gevonden die "${getActivity(batchActivityId.value).name}" hebben ingepland in ${selectedWeek.value}.`)
  }

  const uniqueEmails = [...new Set(weekRes.map(r => r.userEmail?.toLowerCase().trim()))]
  const actName = getActivity(batchActivityId.value).name

  if (!confirm(`Wil je "${actName}" in één keer markeren als AFGEWERKT voor alle ${uniqueEmails.length} leerlingen die dit in ${selectedWeek.value} hebben ingepland?`)) return

  uniqueEmails.forEach(email => {
    const student = props.registeredUsers.find(u => u.email?.toLowerCase().trim() === email)
    if (student && !student.isAdmin) {
      const currentCompleted = student.completedActivities || []
      if (!currentCompleted.includes(String(batchActivityId.value))) {
        const updatedCompleted = [...currentCompleted, String(batchActivityId.value)]
        emit('update-user', {
          ...student,
          completedActivities: updatedCompleted
        })
      }
    }
  })

  alert(`✅ Succes! "${actName}" is afgewerkt voor ${uniqueEmails.length} leerlingen in ${selectedWeek.value}.`)
  batchActivityId.value = ''
}

const openStudentInNewTab = () => {
  if (!selectedStudent.value) return alert('Selecteer eerst een leerling.')

  const newTab = window.open('about:blank', '_blank')
  if (!newTab) return alert('Popup geblokkeerd. Sta popups toe voor deze website.')

  const tableRowsHtml = timeSlots.map(slot => {
    if (slot.isBreak) return `<tr style="background:#e2e8f0;"><td style="font-size:0.8rem;padding:0.5rem;font-weight:bold;">${slot.label}</td><td colspan="5" style="text-align:center;font-weight:bold;color:#475569;">☕ PAUZE</td></tr>`
    const cells = days.map(day => {
      const res = getRes(day, slot.label)
      if (!res) return `<td style="padding:0.5rem;text-align:center;color:#cbd5e1;">-</td>`
      const act = getActivity(res.activityId)
      return `<td style="padding:0.5rem;text-align:center;"><div style="background:${act.color};color:white;padding:0.4rem;border-radius:6px;font-size:0.85rem;"><strong>${act.name}</strong></div></td>`
    }).join('')
    return `<tr><td style="font-size:0.8rem;font-weight:bold;background:#f8fafc;padding:0.5rem;">${slot.label}</td>${cells}</tr>`
  }).join('')

  newTab.document.write(`
    <!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8">
    <title>${selectedStudent.value.name} - Week ${selectedWeek.value}</title>
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
          <h1 style="margin:0;color:#051B35;">🎓 Historie Weekrooster: ${selectedStudent.value.name}</h1>
          <p style="margin:0.3rem 0 0 0;color:#64748b;">E-mail: <strong>${selectedStudent.value.email}</strong> | Week: <strong>${selectedWeek.value}</strong></p>
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
    <div class="admin-header-card no-print">
      <h2 class="page-title">📜 Administratie - Weken Historie & Voortgang</h2>
      <p class="page-subtitle">Beheer individuele voortgang per leerling of voer een groepsactie uit per schoolweek.</p>
    </div>

    <section class="batch-action-card no-print">
      <div class="batch-flex">
        <div>
          <h3>⚡ Snelle Groepsactie (Batch Afwerken)</h3>
          <p>Selecteer een week en een onderdeel om alle leerlingen die dit hebben ingepland in één keer op 'Afgewerkt' te zetten.</p>
        </div>
        <div class="batch-controls">
          <select v-model="batchActivityId" class="modal-select">
            <option value="">-- Kies onderdeel om in bulk af te werken --</option>
            <option v-for="act in activities" :key="act.id" :value="act.id">{{ act.name }}</option>
          </select>
          <button type="button" class="btn-primary btn-batch" @click="handleBatchComplete">
            🚀 Werk Alle Boekingen in Geselecteerde Week Af
          </button>
        </div>
      </div>
    </section>

    <section class="admin-controls no-print">
      <div class="control-group">
        <label>1. Kies Schoolweek (voor rooster & batch):</label>
        <select v-model="selectedWeek" class="modal-select">
          <option v-for="w in availableWeeks" :key="w.id || w" :value="w.id || w">
            {{ w.label || w }}
          </option>
        </select>
      </div>

      <div class="control-group">
        <label>2. Kies Leerling (voor detailspecifieke weergave):</label>
        <select v-model="selectedEmail" class="modal-select">
          <option value="">-- Selecteer een leerling --</option>
          <option v-for="s in students" :key="s.email" :value="s.email">{{ s.name }} ({{ s.email }})</option>
        </select>
      </div>

      <div class="control-group">
        <label class="label-invisible">Actie:</label>
        <button type="button" class="btn-secondary btn-full-width" @click="openStudentInNewTab" :disabled="!selectedStudent">
          🔗 Open Geselecteerde Leerling Rooster ↗
        </button>
      </div>
    </section>

    <div v-if="selectedStudent" class="history-grid-layout">
      <section class="admin-table-card progress-sidebar no-print">
        <h3>✅ Voortgang: {{ selectedStudent.name }}</h3>
        <p class="section-sub">Individueel aan te passen vinkjes:</p>
        
        <div class="completion-checklist">
          <label v-for="act in activities" :key="act.id" class="checklist-item">
            <input 
              type="checkbox" 
              :checked="selectedStudent.completedActivities?.includes(String(act.id))"
              @change="handleCompletionToggle(act.id, $event)"
            />
            <span class="activity-badge-mini" :style="{ backgroundColor: act.color }"></span>
            <span class="checklist-text">{{ act.name }}</span>
          </label>
          <div v-if="activities.length === 0" class="text-muted">Geen onderdelen beschikbaar.</div>
        </div>
      </section>

      <section class="admin-table-card schedule-main-card">
        <div class="header-flex">
          <h3>Weekrooster van {{ selectedStudent.name }} ({{ selectedWeek }})</h3>
          <span>Totaal boekingen: <strong>{{ studentReservations.length }}</strong></span>
        </div>

        <div v-if="studentReservations.length === 0" class="empty-state-banner">
          📭 Geen roostergegevens of actieve boekingen gevonden voor <strong>{{ selectedStudent.name }}</strong> in <strong>{{ selectedWeek }}</strong>.
        </div>

        <div class="table-responsive" style="margin-top: 1rem;">
          <table class="schedule-table">
            <thead>
              <tr><th>Tijdstip</th><th v-for="day in days" :key="day">{{ day }}</th></tr>
            </thead>
            <tbody>
              <tr v-for="slot in timeSlots" :key="slot.label" :class="{ 'break-row': slot.isBreak }">
                <td class="time-col">{{ slot.label }}</td>
                <template v-if="slot.isBreak"><td colspan="5" class="break-cell">☕ PAUZE</td></template>
                <template v-else>
                  <td v-for="day in days" :key="day" class="slot-cell">
                    <div v-if="getRes(day, slot.label)" class="selected-block" :style="{ backgroundColor: getActivity(getRes(day, slot.label).activityId).color }">
                      <strong>{{ getActivity(getRes(day, slot.label).activityId).name }}</strong>
                    </div>
                    <span v-else class="text-muted-empty">-</span>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.batch-action-card {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}
.batch-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.batch-flex h3 {
  margin: 0 0 0.3rem 0;
  font-size: 1rem;
  color: #0f172a;
}
.batch-flex p {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}
.batch-controls {
  display: flex;
  gap: 0.8rem;
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
  max-width: 600px;
  justify-content: flex-end;
}
.batch-controls .modal-select {
  flex: 1;
  min-width: 240px;
}
.btn-batch {
  white-space: nowrap;
  padding: 0.65rem 1rem;
}
.history-grid-layout {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  margin-top: 1.5rem;
}
.progress-sidebar {
  width: 300px;
  min-width: 300px;
  flex-shrink: 0;
}
.schedule-main-card {
  flex: 1;
  min-width: 0;
}
.section-sub {
  font-size: 0.82rem;
  color: #64748b;
  margin-bottom: 1rem;
}
.completion-checklist {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.checklist-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.7rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1e293b;
  transition: background 0.15s;
}
.checklist-item:hover {
  background: #f1f5f9;
}
.activity-badge-mini {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.modal-select {
  width: 100%;
  padding: 0.65rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  background-color: #ffffff;
  box-sizing: border-box;
}
.label-invisible {
  visibility: hidden;
}
.btn-full-width {
  width: 100%;
  padding: 0.65rem 1rem;
  font-size: 0.9rem;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.empty-state-banner {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #475569;
  font-size: 0.9rem;
  text-align: center;
}

@media (max-width: 900px) {
  .history-grid-layout {
    flex-direction: column;
  }
  .progress-sidebar {
    width: 100%;
    min-width: 100%;
  }
  .batch-flex {
    flex-direction: column;
    align-items: flex-start;
  }
  .batch-controls {
    width: 100%;
    justify-content: stretch;
  }
  .batch-controls .modal-select, .btn-batch {
    width: 100%;
  }
}
</style>