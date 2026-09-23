<!-- src/components/AdminPrintCredentials.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  registeredUsers: { type: Array, default: () => [] }
})

// Filter enkel de leerlingen (geen beheerders zoals wuj@slm.be)
const students = computed(() => {
  return props.registeredUsers.filter(u => !u.isAdmin)
})

const handlePrint = () => {
  window.print()
}
</script>

<template>
  <main class="dashboard-wrapper">
    <!-- Header die op het scherm zichtbaar is, maar verborgen wordt bij printen -->
    <div class="admin-header-card no-print">
      <div class="title-flex">
        <div>
          <h2 class="page-title">🖨️ Inloggegevens Printen</h2>
          <p class="page-subtitle">Druk de inloggegevens van alle leerlingen netjes af op A4 (4 leerlingen per pagina).</p>
        </div>
        <button class="btn-primary" @click="handlePrint">
          🖨️ Alles Afdrukken / PDF
        </button>
      </div>
    </div>

    <!-- A4 Afdruk Container -->
    <div class="print-page-container">
      <div v-if="students.length === 0" class="empty-state no-print">
        Geen leerlingen gevonden om af te drukken.
      </div>

      <!-- Grid van leerling kaartjes (4 per A4 pagina) -->
      <div class="credentials-grid">
        <div v-for="student in students" :key="student.email" class="credential-card">
          <div class="card-header">
            <span class="school-label">SLM Weekplanner</span>
            <span class="badge-role">Leerling</span>
          </div>
          
          <div class="card-body">
            <h3 class="student-name">{{ student.name || 'Naamloos' }}</h3>
            <div class="credential-row">
              <span class="label">E-mailadres:</span>
              <span class="value code-font">{{ student.email }}</span>
            </div>
            <div class="credential-row">
              <span class="label">Wachtwoord:</span>
              <span class="value code-font password-box">{{ student.password || 'Niet ingesteld' }}</span>
            </div>
          </div>

          <div class="card-footer">
            <small>Knip deze strook uit en geef deze aan de leerling.</small>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.title-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
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
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

/* Print Container & Grid Layout (2x2 per A4) */
.print-page-container {
  background: #f1f5f9;
  padding: 2rem;
  border-radius: 12px;
  min-height: 600px;
}

.credentials-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;
}

/* Individueel Kaartje */
.credential-card {
  background: #ffffff;
  border: 2px dashed #94a3b8;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  page-break-inside: avoid;
  break-inside: avoid;
  height: 200px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

.school-label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.05em;
}

.badge-role {
  font-size: 0.7rem;
  background: #eff6ff;
  color: #2563eb;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-weight: 700;
}

.card-body {
  margin: 0.5rem 0;
}

.student-name {
  margin: 0 0 0.75rem 0;
  font-size: 1.15rem;
  color: #0f172a;
  font-weight: 700;
}

.credential-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
}

.credential-row .label {
  color: #475569;
  font-weight: 600;
}

.code-font {
  font-family: monospace, system-ui;
  font-weight: 700;
  color: #1e293b;
}

.password-box {
  background: #f8fafc;
  padding: 0.1rem 0.4rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
}

.card-footer {
  border-top: 1px solid #f1f5f9;
  padding-top: 0.4rem;
  text-align: center;
}

.card-footer small {
  font-size: 0.68rem;
  color: #94a3b8;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
  font-weight: 600;
}

/* SPECIALE PRINT / A4 STIJLEN */
@media print {
  .no-print {
    display: none !important;
  }
  
  body {
    background: #ffffff !important;
    padding: 0 !important;
  }

  .print-page-container {
    background: #ffffff !important;
    padding: 0 !important;
  }

  .credentials-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr) !important;
    grid-template-rows: repeat(2, auto) !important;
    gap: 1cm !important;
    width: 100% !important;
  }

  .credential-card {
    border: 2px dashed #475569 !important;
    box-shadow: none !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    height: 11cm !important; /* Perfect passend voor ca. 4 per A4 */
  }
}
</style>