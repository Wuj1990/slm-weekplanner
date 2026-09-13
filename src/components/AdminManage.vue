<script setup>
import { ref } from 'vue'

const props = defineProps({
  activities: { type: Array, default: () => [] },
  selectedWeek: { type: String, default: '' },
  availableWeeks: { type: Array, default: () => [] }
})

const emit = defineEmits(['add-activity', 'update-activity', 'delete-activity', 'update:selectedWeek'])

// Nieuw onderdeel formulier (inclusief week selectie)
const newName = ref('')
const newColor = ref('#2563eb')
const newCategory = ref('Praktijk')
const newMaxSlots = ref(1)
const newMaxHours = ref(2)
const newPrerequisiteId = ref('')
const newDescription = ref('')
const newWeek = ref(props.selectedWeek || 'Alle weken')

const handleAdd = () => {
  if (!newName.value.trim()) return

  emit('add-activity', {
    name: newName.value.trim(),
    color: newColor.value,
    category: newCategory.value,
    maxSlots: Number(newMaxSlots.value) || 1,
    maxHours: Number(newMaxHours.value) || 2,
    prerequisiteId: newPrerequisiteId.value || '',
    description: newDescription.value.trim() || 'Geen beschrijving',
    week: newWeek.value
  })

  newName.value = ''
  newPrerequisiteId.value = ''
  newDescription.value = ''
}

const handleUpdate = (act) => {
  emit('update-activity', act)
}
</script>

<template>
  <main class="dashboard-wrapper">
    <div class="admin-header-card no-print">
      <h2 class="page-title">⚙️ Vakken & Onderdelen Beheren</h2>
      <p class="page-subtitle">Voeg nieuwe vakken/onderdelen toe of pas bestaande instellingen direct aan.</p>
    </div>

    <!-- NIEUW ONDERDEEL TOEVOEGEN -->
    <section class="admin-card">
      <h3>➕ Nieuw Onderdeel Toevoegen</h3>
      <form @submit.prevent="handleAdd" class="form-grid">
        <div class="form-group">
          <label>Week:</label>
          <select v-model="newWeek" class="input-field">
            <option value="Alle weken">📅 Alle weken (Algemeen)</option>
            <option v-for="wk in availableWeeks" :key="wk.id || wk" :value="wk.id || wk">
              {{ wk.label || wk }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Naam Onderdeel:</label>
          <input v-model="newName" type="text" placeholder="bv. Instructieles" required class="input-field" />
        </div>

        <div class="form-group">
          <label>Kleur Code:</label>
          <input v-model="newColor" type="color" class="color-picker" />
        </div>

        <div class="form-group">
          <label>Categorie:</label>
          <select v-model="newCategory" class="input-field">
            <option value="Praktijk">Praktijk</option>
            <option value="Theorie">Theorie</option>
            <option value="Evaluatie">Evaluatie</option>
          </select>
        </div>

        <div class="form-group">
          <label>Max. Leerlingen / Slot:</label>
          <input v-model="newMaxSlots" type="number" min="1" class="input-field" />
        </div>

        <div class="form-group">
          <label>Max. Uren / Week:</label>
          <input v-model="newMaxHours" type="number" min="1" class="input-field" />
        </div>

        <div class="form-group">
          <label>🔗 Vereiste Voorgaande Opdracht:</label>
          <select v-model="newPrerequisiteId" class="input-field">
            <option value="">-- Geen voorwaarde --</option>
            <option v-for="act in activities" :key="act.id" :value="act.id">{{ act.name }}</option>
          </select>
        </div>

        <div class="form-group full-width">
          <label>Beschrijving / Opmerking:</label>
          <input v-model="newDescription" type="text" placeholder="Korte toelichting voor leerlingen" class="input-field" />
        </div>

        <div class="form-actions full-width">
          <button type="submit" class="btn-primary">
            <span class="btn-icon">+</span> Onderdeel Toevoegen
          </button>
        </div>
      </form>
    </section>

    <!-- BESTAANDE ONDERDELEN BEHEREN -->
    <section class="admin-card">
      <h3>📋 Bestaande Onderdelen Aanpassen</h3>

      <div class="table-responsive">
        <table class="manage-table">
          <thead>
            <tr>
              <th style="width: 70px;">Kleur</th>
              <th style="width: 160px;">Week</th>
              <th style="width: 160px;">Naam Onderdeel</th>
              <th style="width: 120px;">Categorie</th>
              <th style="width: 70px;">Max/Slot</th>
              <th style="width: 70px;">Max/Wk</th>
              <th style="width: 160px;">🔗 Vereiste Voorwaarde</th>
              <th>Beschrijving</th>
              <th style="width: 90px;" class="text-center">Acties</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="act in activities" :key="act.id">
              <td>
                <input v-model="act.color" type="color" class="color-picker-small" @change="handleUpdate(act)" />
              </td>
              <td>
                <select v-model="act.week" class="table-select" @change="handleUpdate(act)">
                  <option value="Alle weken">Alle weken</option>
                  <option v-for="wk in availableWeeks" :key="wk.id || wk" :value="wk.id || wk">
                    {{ wk.label || wk }}
                  </option>
                </select>
              </td>
              <td>
                <input v-model="act.name" type="text" class="table-input" @change="handleUpdate(act)" />
              </td>
              <td>
                <select v-model="act.category" class="table-select" @change="handleUpdate(act)">
                  <option value="Praktijk">Praktijk</option>
                  <option value="Theorie">Theorie</option>
                  <option value="Evaluatie">Evaluatie</option>
                </select>
              </td>
              <td>
                <input v-model.number="act.maxSlots" type="number" min="1" class="table-input number-input" @change="handleUpdate(act)" />
              </td>
              <td>
                <input v-model.number="act.maxHours" type="number" min="1" class="table-input number-input" @change="handleUpdate(act)" />
              </td>
              <td>
                <select v-model="act.prerequisiteId" class="table-select" @change="handleUpdate(act)">
                  <option value="">-- Geen voorwaarde --</option>
                  <option v-for="other in activities.filter(a => String(a.id) !== String(act.id))" :key="other.id" :value="other.id">
                    {{ other.name }}
                  </option>
                </select>
              </td>
              <td>
                <input v-model="act.description" type="text" class="table-input" @change="handleUpdate(act)" />
              </td>
              <td class="text-center">
                <button class="btn-delete-icon" title="Verwijder dit onderdeel" @click="emit('delete-activity', act.id)">
                  🗑️ Wis
                </button>
              </td>
            </tr>

            <tr v-if="activities.length === 0">
              <td colspan="9" class="empty-state">Geen onderdelen aangemaakt.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<style scoped>
.admin-card h3 {
  margin: 0 0 1.25rem 0;
  font-size: 1.1rem;
  color: #0f172a;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
.full-width {
  grid-column: 1 / -1;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.form-group label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
}
.input-field {
  padding: 0.6rem 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  background-color: #ffffff;
  color: #0f172a;
}
.input-field:focus {
  outline: none;
  border-color: #2563eb;
}
.color-picker {
  height: 42px;
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  padding: 2px;
  background: white;
}
.form-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 0.5rem;
}
.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-primary:hover {
  background-color: #1d4ed8;
}
.btn-icon {
  font-size: 1.2rem;
  font-weight: 800;
}
.table-responsive {
  width: 100%;
  overflow-x: auto;
}
.manage-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.manage-table th {
  background: #f8fafc;
  padding: 0.85rem 0.75rem;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}
.manage-table td {
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.table-input, .table-select {
  width: 100%;
  padding: 0.45rem 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.88rem;
  color: #0f172a;
  background: #ffffff;
}
.table-input:focus, .table-select:focus {
  outline: none;
  border-color: #2563eb;
}
.number-input {
  text-align: center;
}
.color-picker-small {
  width: 38px;
  height: 34px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  padding: 1px;
  background: white;
  display: block;
  margin: 0 auto;
}
.text-center { text-align: center; }
.btn-delete-icon {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fca5a5;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-delete-icon:hover {
  background: #ef4444;
  color: white;
}
.empty-state {
  text-align: center;
  padding: 2rem !important;
  color: #94a3b8;
  font-weight: 600;
}
</style>