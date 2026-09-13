<!-- src/components/AdminOverview.vue -->
<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  reservations: { type: Array, default: () => [] },
  uniqueStudents: { type: Array, default: () => [] },
  selectedWeek: { type: String, default: '' },
  availableWeeks: { type: Array, default: () => [] },
  activities: { type: Array, default: () => [] }
})

const emit = defineEmits(['delete-reservation', 'update:selectedWeek'])

const activeWeekFilter = ref(props.selectedWeek || props.availableWeeks[0]?.id || 'Week 1')
const expandedStudentEmail = ref(null)

watch(() => props.selectedWeek, (newVal) => {
  if (newVal) activeWeekFilter.value = newVal
})

const getActivityById = (id) => props.activities.find(a => String(a.id) === String(id)) || { name: 'Onbekend', color: '#64748b' }

const handleWeekChange = (event) => {
  const val = event.target.value
  activeWeekFilter.value = val
  expandedStudentEmail.value = null
  emit('update:selectedWeek', val)
}

const currentWeekReservations = computed(() => {
  return props.reservations.filter(r => String(r.week) === String(activeWeekFilter.value))
})

const activeStudentsThisWeek = computed(() => {
  const map = new Map()
  currentWeekReservations.value.forEach(res => {
    const email = res.userEmail?.toLowerCase()
    if (!email) return
    if (!map.has(email)) {
      map.set(email, { email, name: res.userName || email, reservations: [] })
    }
    map.get(email).reservations.push(res)
  })
  return Array.from(map.values())
})

const toggleExpandStudent = (email) => {
  expandedStudentEmail.value = expandedStudentEmail.value === email ? null : email
}

const exportToPDF = () => {
  if (currentWeekReservations.value.length === 0) return alert('Geen boekingen om te exporteren.')

  const newTab = window.open('about:blank', '_blank')
  if (!newTab) return alert('Popup geblokkeerd. Sta popups toe voor deze website.')

  const studentRowsHtml = activeStudentsThisWeek.value.map(s => {
    const resList = s.reservations.map(r => {
      const act = getActivityById(r.activityId)
      return `<span style="background:${act.color};color:white;padding:3px 8px;border-radius:4px;font-size:12px;margin-right:4px;display:inline-block;margin-bottom:4px;">${r.day} ${r.slot}: <strong>${act.name}</strong></span>`
    }).join('')

    return `<tr>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;"><strong>${s.name}</strong><br><small style="color:#64748b;">${s.email}</small></td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;"><strong>${s.reservations.length} uren</strong></td>
      <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${resList}</td>
    </tr>`
  }).join('')

  newTab.document.write(`
    <!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8">
    <title>SLM Boekingen Overzicht - ${activeWeekFilter.value}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 20px; background: #fff; color: #0f172a; }
      .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
      h1 { margin: 0; font-size: 20px; }
      p { margin: 4px 0 0 0; color: #64748b; font-size: 14px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th { background: #f8fafc; padding: 8px; text-align: left; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; color: #475569; }
      .btn-print { background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; }
      @media print { .no-print { display: none; } body { padding: 0; } }
    </style></head><body>
      <div class="header">
        <div>
          <h1>📊 Boekingen Overzicht - ${activeWeekFilter.value}</h1>
          <p>Totaal actieve leerlingen: ${activeStudentsThisWeek.value.length} | Totaal lesuren: ${currentWeekReservations.value.length}</p>
        </div>
        <button class="btn-print no-print" onclick="window.print()">🖨️ Opslaan als PDF / Afdrukken</button>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:250px;">Leerling</th>
            <th style="width:100px;text-align:center;">Aantal</th>
            <th>Geboekte Lesuren & Vakken</th>
          </tr>
        </thead>
        <tbody>${studentRowsHtml}</tbody>
      </table>
    </body></html>
  `)
  newTab.document.close()
}
</script>

<template>
  <main class="dashboard-wrapper">
    <div class="admin-header-card no-print">
      <div class="title-flex">
        <h2 class="page-title">📊 Boekingen Overzicht</h2>
        <div class="header-actions">
          <button class="btn-export" @click="exportToPDF">📑 Exporteer PDF</button>
          <div class="week-picker-inline">
            <label>Schoolweek:</label>
            <select :value="activeWeekFilter" @change="handleWeekChange" class="select-dropdown">
              <option v-for="w in availableWeeks" :key="w.id || w" :value="w.id || w">
                {{ w.label || w }}
              </option>
            </select>
          </div>
        </div>
      </div>
      <p class="page-subtitle">Overzicht van leerlingen met actieve boekingen in <strong>{{ activeWeekFilter }}</strong>.</p>
    </div>

    <section class="admin-table-card">
      <div class="header-flex">
        <h3>Actieve Leerlingen ({{ activeStudentsThisWeek.length }})</h3>
        <span class="count-badge">Totaal boekingen deze week: <strong>{{ currentWeekReservations.length }}</strong></span>
      </div>

      <div class="table-responsive" style="margin-top: 1rem;">
        <table class="clean-table">
          <thead>
            <tr>
              <th>Naam Leerling</th>
              <th>E-mailadres</th>
              <th class="text-center">Aantal Boekingen</th>
              <th class="text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="student in activeStudentsThisWeek" :key="student.email">
              <tr class="student-row" :class="{ 'row-expanded': expandedStudentEmail === student.email }">
                <td><strong class="student-name">👤 {{ student.name }}</strong></td>
                <td class="text-muted">{{ student.email }}</td>
                <td class="text-center">
                  <span class="badge-count">{{ student.reservations.length }} lesuren</span>
                </td>
                <td class="text-right">
                  <button class="btn-toggle-details" @click="toggleExpandStudent(student.email)">
                    {{ expandedStudentEmail === student.email ? '▲ Verberg details' : '▼ Bekijk lesuren' }}
                  </button>
                </td>
              </tr>

              <tr v-if="expandedStudentEmail === student.email" :key="student.email + '_details'" class="details-row">
                <td colspan="4">
                  <div class="details-container">
                    <h4>Ingeplande uren voor {{ student.name }}:</h4>
                    <div class="details-grid">
                      <div v-for="res in student.reservations" :key="res.id" class="detail-card">
                        <div class="detail-info">
                          <span class="detail-day">{{ res.day }}</span>
                          <span class="detail-slot">{{ res.slot }}</span>
                          <span class="activity-badge" :style="{ backgroundColor: getActivityById(res.activityId).color }">
                            {{ getActivityById(res.activityId).name }}
                          </span>
                        </div>
                        <button class="btn-delete-small" title="Wis boeking" @click="emit('delete-reservation', res.id)">
                          🗑️ Wis
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <tr v-if="activeStudentsThisWeek.length === 0">
              <td colspan="4" class="empty-state">Geen boekingen gevonden voor {{ activeWeekFilter }}.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<style scoped>
.header-actions { display: flex; align-items: center; gap: 0.8rem; }
.btn-export { background: #dc2626; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.85rem; font-weight: 700; cursor: pointer; }
.btn-export:hover { background: #b91c1c; }
.week-picker-inline { display: flex; align-items: center; gap: 0.6rem; background: #f8fafc; padding: 0.4rem 0.8rem; border-radius: 8px; border: 1px solid #cbd5e1; }
.select-dropdown { padding: 0.35rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #ffffff; font-size: 0.85rem; font-weight: 700; color: #0f172a; cursor: pointer; }
.count-badge { font-size: 0.88rem; color: #64748b; }
.table-responsive { width: 100%; overflow-x: auto; }
.clean-table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
.clean-table th { background: #f8fafc; padding: 0.85rem 1rem; text-align: left; font-size: 0.85rem; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; }
.clean-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; font-size: 0.9rem; }
.student-row:hover { background-color: #f8fafc; }
.row-expanded { background-color: #eff6ff !important; }
.student-name { color: #1e293b; }
.text-muted { color: #64748b; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.badge-count { background: #e2e8f0; color: #334155; padding: 0.25rem 0.65rem; border-radius: 12px; font-weight: 700; font-size: 0.8rem; }
.btn-toggle-details { background: #2563eb; color: white; border: none; padding: 0.4rem 0.85rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
.btn-toggle-details:hover { background: #1d4ed8; }
.details-row td { background: #f8fafc; padding: 1rem 1.5rem; border-bottom: 2px solid #cbd5e1; }
.details-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; }
.detail-card { background: white; border: 1px solid #cbd5e1; padding: 0.6rem 0.8rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
.activity-badge { color: white; font-size: 0.72rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 4px; }
.btn-delete-small { background: #ef4444; color: white; border: none; padding: 0.35rem 0.6rem; border-radius: 6px; cursor: pointer; }
.empty-state { text-align: center; padding: 2rem !important; color: #94a3b8; font-weight: 600; }
</style>