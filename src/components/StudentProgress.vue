<!-- src/components/StudentProgress.vue -->
<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  registeredUsers: { type: Array, default: () => [] },
  activities: { type: Array, default: () => [] }
})

const emit = defineEmits(['update-user'])

const searchQuery = ref('')
const selectedStudentEmail = ref('')

// Filter enkel niet-admin gebruikers (leerlingen) en zorg dat elk e-mailadres uniek is
const students = computed(() => {
  const map = new Map()
  props.registeredUsers.forEach(u => {
    if (!u.isAdmin && u.email) {
      const cleanEmail = u.email.toLowerCase().trim()
      if (!map.has(cleanEmail)) {
        map.set(cleanEmail, u)
      }
    }
  })
  return Array.from(map.values())
})

const filteredStudents = computed(() => {
  if (!searchQuery.value.trim()) return students.value
  const q = searchQuery.value.toLowerCase().trim()
  return students.value.filter(u => 
    (u.name && u.name.toLowerCase().includes(q)) || 
    (u.email && u.email.toLowerCase().includes(q))
  )
})

// Als er nog geen leerling is geselecteerd, kies automatisch de eerste indien beschikbaar
const currentStudent = computed(() => {
  if (filteredStudents.value.length === 0) return null
  const found = filteredStudents.value.find(s => s.email?.toLowerCase().trim() === selectedStudentEmail.value?.toLowerCase().trim())
  return found || filteredStudents.value[0]
})

const handleCompletionToggle = (user, activityId, event) => {
  const isChecked = event.target.checked
  const currentCompleted = user.completedActivities || []
  
  const updatedCompleted = isChecked 
    ? [...new Set([...currentCompleted, String(activityId)])]
    : currentCompleted.filter(id => String(id) !== String(activityId))

  emit('update-user', {
    ...user,
    completedActivities: updatedCompleted
  })
}
</script>

<template>
  <main class="dashboard-wrapper">
    <div class="admin-header-card">
      <h2 class="page-title">📈 Voortgang per leerling</h2>
      <p class="page-subtitle">Beheer afzonderlijk per leerling welke onderdelen met succes zijn voltooid.</p>
    </div>

    <div class="progress-layout">
      <!-- LINKER KANT: LEERLINGEN LIJST -->
      <div class="student-sidebar">
        <div class="search-box">
          <input v-model="searchQuery" type="text" placeholder="🔍 Zoek leerling..." class="search-input" />
        </div>
        <div class="student-list">
          <div 
            v-for="student in filteredStudents" 
            :key="student.email" 
            class="student-item"
            :class="{ 'active': currentStudent?.email?.toLowerCase().trim() === student.email?.toLowerCase().trim() }"
            @click="selectedStudentEmail = student.email"
          >
            <div class="student-avatar">{{ student.name ? student.name.charAt(0).toUpperCase() : 'L' }}</div>
            <div class="student-info">
              <strong>{{ student.name || 'Onbekend' }}</strong>
              <small>{{ student.email }}</small>
            </div>
            <span class="progress-badge">
              {{ student.completedActivities?.length || 0 }}/{{ activities.length }}
            </span>
          </div>
          <div v-if="filteredStudents.length === 0" class="text-muted text-center" style="padding: 1.5rem;">
            Geen leerlingen gevonden.
          </div>
        </div>
      </div>

      <!-- RECHTER KANT: DETAILS & ONDERDELEN VAN DE GESELECTEERDE LEERLING -->
      <div class="progress-main-card">
        <template v-if="currentStudent">
          <div class="selected-student-header">
            <div>
              <h3>{{ currentStudent.name || 'Onbekend' }}</h3>
              <span class="code-badge">{{ currentStudent.email }}</span>
            </div>
            <div class="total-progress-pill">
              Totaal voltooid: <strong>{{ currentStudent.completedActivities?.length || 0 }} van de {{ activities.length }}</strong> onderdelen
            </div>
          </div>

          <div class="activities-grid">
            <label 
              v-for="act in activities" 
              :key="act.id" 
              class="activity-checkbox-card"
              :class="{ 'checked': currentStudent.completedActivities?.includes(String(act.id)) }"
            >
              <input 
                type="checkbox" 
                :checked="currentStudent.completedActivities?.includes(String(act.id))"
                @change="handleCompletionToggle(currentStudent, act.id, $event)"
              />
              <span class="activity-color-dot" :style="{ backgroundColor: act.color }"></span>
              <div class="activity-card-info">
                <span class="activity-title">{{ act.name }}</span>
                <span class="activity-desc" v-if="act.description">{{ act.description }}</span>
              </div>
            </label>
            <div v-if="activities.length === 0" class="empty-activities">
              Geen onderdelen geconfigureerd in het systeem. Ga naar 'Onderdelen Beheren' om er toe te voegen.
            </div>
          </div>
        </template>
        <template v-else>
          <div class="empty-state">Selecteer een leerling aan de linkerkant om de voortgang te beheren.</div>
        </template>
      </div>
    </div>
  </main>
</template>

<style scoped>
.dashboard-wrapper { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
.admin-header-card { margin-bottom: 1.5rem; }
.page-title { margin: 0 0 0.25rem 0; font-size: 1.5rem; font-weight: 800; color: #0f172a; }
.page-subtitle { margin: 0; color: #64748b; font-size: 0.9rem; }

.progress-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
}
@media (max-width: 900px) {
  .progress-layout { grid-template-columns: 1fr; }
}

.student-sidebar {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  height: fit-content;
}

.search-box { padding: 1rem; border-bottom: 1px solid #f1f5f9; background: #f8fafc; }
.search-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; }

.student-list { max-height: 65vh; overflow-y: auto; }
.student-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
}
.student-item:hover { background: #f8fafc; }
.student-item.active { background: #eff6ff; border-left: 4px solid #2563eb; }

.student-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}
.student-item.active .student-avatar { background: #2563eb; color: white; }

.student-info { display: flex; flex-direction: column; overflow: hidden; flex-grow: 1; }
.student-info strong { font-size: 0.88rem; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.student-info small { font-size: 0.75rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.progress-badge {
  font-size: 0.75rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #475569;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  flex-shrink: 0;
}
.student-item.active .progress-badge { background: #dbeafe; color: #1d4ed8; }

.progress-main-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.selected-student-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 1.25rem;
}
.selected-student-header h3 { margin: 0 0 0.3rem 0; font-size: 1.2rem; color: #0f172a; }

.code-badge { background: #f1f5f9; color: #334155; padding: 0.25rem 0.5rem; border-radius: 6px; font-family: monospace; font-size: 0.8rem; border: 1px solid #cbd5e1; }

.total-progress-pill {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #334155;
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

.activity-checkbox-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.activity-checkbox-card:hover { background: #f1f5f9; border-color: #cbd5e1; }
.activity-checkbox-card.checked { background: #f0fdf4; border-color: #bbf7d0; }

.activity-checkbox-card input[type="checkbox"] {
  margin-top: 0.15rem;
  width: 1.1rem;
  height: 1.1rem;
  cursor: pointer;
}

.activity-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 0.3rem;
  flex-shrink: 0;
}

.activity-card-info { display: flex; flex-direction: column; gap: 0.15rem; }
.activity-title { font-weight: 600; font-size: 0.9rem; color: #0f172a; }
.activity-desc { font-size: 0.78rem; color: #64748b; }

.empty-activities { grid-column: 1 / -1; text-align: center; padding: 3rem; color: #94a3b8; font-style: italic; }
.empty-state { text-align: center; padding: 4rem; color: #94a3b8; font-weight: 600; }
.text-muted { color: #94a3b8; font-size: 0.85rem; font-style: italic; }
.text-center { text-align: center; }
</style>