<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  registeredUsers: { type: Array, default: () => [] },
  activities: { type: Array, default: () => [] }
})

const emit = defineEmits(['update-user', 'delete-user', 'register-user'])

const searchQuery = ref('')

const levelOptions = {
  mechanica: ['Nog niet ingedeeld', 'Hefbomen', 'Tandwielen', 'Motor'],
  elektriciteit: ['Nog niet ingedeeld', 'Hefbomen', 'Tandwielen', 'Motor'],
  tekenen: ['Nog niet ingedeeld', 'Hefbomen', 'Tandwielen', 'Motor']
}

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return props.registeredUsers
  const q = searchQuery.value.toLowerCase().trim()
  return props.registeredUsers.filter(u => 
    (u.name && u.name.toLowerCase().includes(q)) || 
    (u.email && u.email.toLowerCase().includes(q))
  )
})

const handleLevelChange = (user, subject, event) => {
  emit('update-user', {
    ...user,
    levelGroups: {
      ...(user.levelGroups || {}),
      [subject]: event.target.value
    }
  })
}

const handleNoteChange = (user, event) => {
  emit('update-user', {
    ...user,
    adminNote: event.target.value
  })
}

const handleResetPassword = (user) => {
  const newPass = prompt(`Voer het nieuwe wachtwoord in voor ${user.name || user.email}:`)
  if (!newPass || !newPass.trim()) return
  if (newPass.trim().length < 6) return alert('Wachtwoord moet minimaal 6 tekens bevatten.')

  emit('update-user', {
    ...user,
    password: newPass.trim(),
    mustChangePassword: false
  })
  alert(`Wachtwoord voor ${user.name || user.email} is gewijzigd!`)
}

// ROBUUSTE CSV IMPORT FUNCTIE (Inclusief harde dubbel-check op e-mail)
const handleCSVImport = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    const text = e.target.result
    const lines = text.replace(/\r\n/g, '\n').split('\n')
    let count = 0

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const delimiter = line.includes(';') ? ';' : ','
      const parts = line.split(delimiter).map(item => item?.replace(/^["']|["']$/g, '').trim() || '')

      if (parts.length < 2) continue

      const [email, name, firstName, lastName] = parts
      if (!email || !email.includes('@')) continue

      const cleanEmail = email.toLowerCase().trim()
      
      const exists = props.registeredUsers.some(u => u.email?.toLowerCase().trim() === cleanEmail)
      if (exists) continue

      const defaultPassword = 'Welkom2026!'

      const newUser = {
        email: cleanEmail,
        password: defaultPassword,
        isAdmin: cleanEmail.endsWith('@slm.be'),
        name: name || cleanEmail,
        firstName: firstName || '',
        lastName: lastName || '',
        levelGroups: { mechanica: 'Nog niet ingedeeld', elektriciteit: 'Nog niet ingedeeld', tekenen: 'Nog niet ingedeeld' },
        completedActivities: [],
        mustChangePassword: true
      }

      emit('register-user', newUser)
      count++
    }

    if (count > 0) {
      alert(`✅ Succesvol ${count} nieuwe accounts ingeladen via CSV! Bestaande accounts werden overgeslagen.`)
    } else {
      alert(`⚠️ Geen nieuwe accounts toegevoegd. Mogelijk bestonden alle e-mailadressen al in de lijst.`)
    }
    event.target.value = ''
  }
  reader.readAsText(file)
}
</script>

<template>
  <main class="dashboard-wrapper">
    <div class="admin-header-card no-print">
      <div class="header-flex-top">
        <div>
          <h2 class="page-title">👥 Leerlingen & Niveaus</h2>
          <p class="page-subtitle">Wijs niveaus toe, beheer notities of importeert klassen via CSV.</p>
        </div>
        
        <!-- CSV IMPORT KNOP -->
        <div class="csv-upload-wrapper">
          <label class="btn-primary csv-upload-label" title="Upload een CSV bestand met kolommen: email,name,firstName,lastName">
            📂 Importeer Klassenlijst (CSV)
            <input type="file" accept=".csv" @change="handleCSVImport" style="display: none;" />
          </label>
        </div>
      </div>
    </div>

    <section class="admin-table-card">
      <div class="header-flex" style="margin-bottom: 1rem;">
        <h3>Geregistreerde Gebruikers ({{ filteredUsers.length }})</h3>
        <div class="search-box">
          <input v-model="searchQuery" type="text" placeholder="🔍 Zoek op naam of e-mail..." class="search-input" />
        </div>
      </div>

      <div class="table-responsive">
        <table class="clean-table">
          <thead>
            <tr>
              <th class="col-action text-center">Actie</th>
              <th class="col-name">Naam</th>
              <th class="col-email">School E-mailadres</th>
              <th class="col-pass">Wachtwoord</th>
              <th class="col-role">Rol</th>
              <th class="col-subject">🔧 Vak Mechanica</th>
              <th class="col-subject">⚡ Vak Elektriciteit</th>
              <th class="col-subject">📐 Tech. Tekenen</th>
              <th class="col-note">📝 Interne Notitie</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.email" class="user-row">
              <!-- ACTIE (WIS) KNOP NU VOORAAN -->
              <td class="col-action text-center">
                <button class="btn-delete-small" title="Verwijder account" @click="emit('delete-user', user.email)">
                  🗑️ Wis
                </button>
              </td>

              <td class="col-name"><strong class="user-name">{{ user.name || 'Onbekend' }}</strong></td>
              <td class="col-email"><span class="code-badge">{{ user.email }}</span></td>
              <td class="col-pass">
                <span class="code-badge password-badge" title="Klik om wachtwoord te wijzigen" @click="handleResetPassword(user)">
                  {{ user.password || '••••••' }} ✏️
                </span>
                <span v-if="user.mustChangePassword" class="temp-pw-tag">Tijdelijk</span>
              </td>
              <td class="col-role">
                <span class="role-badge" :class="user.isAdmin ? 'role-admin' : 'role-student'">
                  {{ user.isAdmin ? '👑 Admin' : '🎓 Leerling' }}
                </span>
              </td>

              <template v-if="!user.isAdmin">
                <td v-for="subject in ['mechanica', 'elektriciteit', 'tekenen']" :key="subject" class="col-subject">
                  <select 
                    :value="user.levelGroups?.[subject] || 'Nog niet ingedeeld'" 
                    @change="handleLevelChange(user, subject, $event)"
                    class="table-select"
                  >
                    <option v-for="opt in levelOptions[subject]" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </td>

                <td class="col-note">
                  <input 
                    type="text" 
                    :value="user.adminNote || ''" 
                    @change="handleNoteChange(user, $event)" 
                    placeholder="Notitie toevoegen..." 
                    class="table-input" 
                  />
                </td>
              </template>

              <template v-else>
                <td colspan="4" class="text-muted-center">- Not applicable -</td>
              </template>
            </tr>

            <tr v-if="filteredUsers.length === 0">
              <td colspan="9" class="empty-state">Geen gebruikers gevonden.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<style scoped>
.header-flex-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
.csv-upload-label { display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem; padding: 0.6rem 1rem; }
.temp-pw-tag { display: block; font-size: 0.65rem; background: #fef3c7; color: #b45309; font-weight: 700; padding: 0.1rem 0.3rem; border-radius: 4px; margin-top: 0.2rem; text-align: center; }
.search-input { padding: 0.5rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; width: 250px; }
.password-badge { cursor: pointer; transition: opacity 0.2s; display: inline-block; }
.password-badge:hover { opacity: 0.8; }
.header-flex h3 { margin: 0; font-size: 1.1rem; color: #0f172a; }

.admin-table-card {
  width: 100%;
  max-width: 100%;
}

.table-responsive { 
  width: 100%; 
  max-width: 100%;
  max-height: 75vh;
  overflow-x: scroll !important; 
  overflow-y: auto !important;
  border-radius: 8px; 
  border: 1px solid #e2e8f0; 
  margin-bottom: 1rem;
  -webkit-overflow-scrolling: touch;
}

.table-responsive::-webkit-scrollbar {
  height: 14px !important;
  width: 10px !important;
  display: block !important;
}
.table-responsive::-webkit-scrollbar-track {
  background: #e2e8f0;
  border-radius: 0 0 8px 8px;
}
.table-responsive::-webkit-scrollbar-thumb {
  background: #2563eb;
  border-radius: 7px;
  border: 3px solid #e2e8f0;
}
.table-responsive::-webkit-scrollbar-thumb:hover {
  background: #1d4ed8;
}

.clean-table { width: 100%; border-collapse: collapse; min-width: 1100px; }
.clean-table th { background: #f8fafc; padding: 0.85rem 1rem; text-align: left; font-size: 0.85rem; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; position: sticky; top: 0; z-index: 2; }
.clean-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; font-size: 0.88rem; }
.user-row:hover { background-color: #f8fafc; }
.col-action { width: 80px; min-width: 80px; }
.col-name { min-width: 140px; }
.col-email { min-width: 190px; }
.col-pass { min-width: 110px; }
.col-role { width: 100px; }
.col-subject { width: 170px; min-width: 160px; }
.col-note { width: 180px; min-width: 150px; }
.user-name { color: #0f172a; font-size: 0.9rem; }
.code-badge { background: #f1f5f9; color: #334155; padding: 0.3rem 0.6rem; border-radius: 6px; font-family: monospace; font-size: 0.82rem; border: 1px solid #cbd5e1; }
.password-badge { background: #faf5ff; color: #6b21a8; border-color: #e9d5ff; }
.role-badge { font-size: 0.78rem; font-weight: 700; padding: 0.3rem 0.6rem; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.25rem; }
.role-student { background: #eff6ff; color: #1d4ed8; }
.role-admin { background: #fef3c7; color: #b45309; }
.table-select, .table-input { width: 100%; padding: 0.45rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: #0f172a; background-color: #ffffff; }
.table-select:focus, .table-input:focus { outline: none; border-color: #2563eb; }
.text-center { text-align: center; }
.btn-delete-small { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
.btn-delete-small:hover { background: #ef4444; color: #ffffff; }
.text-muted-center { color: #94a3b8; font-style: italic; text-align: center; }
.empty-state { text-align: center; padding: 2rem !important; color: #94a3b8; font-weight: 600; }
.btn-primary { background: #2563eb; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 700; display: inline-block; cursor: pointer; }
.btn-primary:hover { background: #1d4ed8; }
</style>