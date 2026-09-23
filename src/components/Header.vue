<!-- src/components/Header.vue -->
<script setup>
import { ref, onMounted } from 'vue'

defineProps({
  currentUser: { type: Object, default: null },
  activeTab: { type: String, default: 'planner' }
})

const emit = defineEmits(['update:activeTab', 'change-password', 'logout'])
const isUserMenuOpen = ref(false)
const isDarkMode = ref(false)

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark-mode')
    localStorage.setItem('slm_theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark-mode')
    localStorage.setItem('slm_theme', 'light')
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('slm_theme')
  if (savedTheme === 'dark') {
    isDarkMode.value = true
    document.documentElement.classList.add('dark-mode')
  }
})

const handleLogout = () => {
  isUserMenuOpen.value = false
  emit('update:activeTab', 'planner')
  emit('logout')
}
</script>

<template>
  <header class="navbar-white no-print">
    <div class="brand-container">
      <h1>SLM Weekplanner</h1>
      <span v-if="currentUser?.isAdmin" class="badge-admin">Beheerder</span>
    </div>

    <!-- BEHEERDER DROPDOWN NAVIGATIE -->
    <div v-if="currentUser?.isAdmin" class="nav-dropdown-wrapper">
      <label class="dropdown-label">Navigatie:</label>
      <select 
        :value="activeTab" 
        @change="emit('update:activeTab', $event.target.value)"
        class="nav-dropdown-select"
      >
        <option value="planner">📅 Rooster Inplannen</option>
        <option value="activities_manage">🛠️ Onderdelen Beheren</option>
        <option value="admin">📊 Boekingen Overzicht</option>
        <option value="history">📜 Weken Historie (Admin)</option>
        <option value="users">👥 Leerlingen & Niveaus</option>
        <option value="student_progress">📈 Voortgang per leerling</option>
        <option value="print_credentials">🔑 Inloggegevens Printen</option>
      </select>
    </div>

    <!-- RECHTERACTIES (DARK MODE & GEBRUIKER) -->
    <div class="header-right-group">
      <button class="btn-dark-toggle" @click="toggleDarkMode" :title="isDarkMode ? 'Schakel naar lichte modus' : 'Schakel naar donkere modus'">
        {{ isDarkMode ? '☀️' : '🌙' }}
      </button>

      <div v-if="currentUser" class="user-menu-container">
        <div class="user-pill" @click="isUserMenuOpen = !isUserMenuOpen">
          <div class="avatar" :class="{ 'avatar-admin': currentUser.isAdmin }">
            {{ currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U' }}
          </div>
          <div class="user-details-compact">
            <span class="user-name">{{ currentUser.name || currentUser.email }}</span>
            <span class="dropdown-arrow">▼</span>
          </div>
        </div>

        <div v-if="isUserMenuOpen" class="user-dropdown-menu">
          <div class="dropdown-header">
            <strong>{{ currentUser.name }}</strong>
            <small>{{ currentUser.email }}</small>
          </div>
          <hr />
          <button class="dropdown-item" @click="isUserMenuOpen = false; emit('change-password')">
            🔒 Wachtwoord Wijzigen
          </button>
          <button class="dropdown-item logout-item" @click="handleLogout">
            🚪 Afmelden
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
*, *::before, *::after {
  box-sizing: border-box;
}

.navbar-white {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 0.85rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  width: 100%;
  position: relative;
  z-index: 1000;
}

.brand-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-container h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.badge-admin {
  background: #fef3c7;
  color: #b45309;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  border: 1px solid #fde68a;
}

.nav-dropdown-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dropdown-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
}

.nav-dropdown-select {
  padding: 0.45rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #0f172a;
  background-color: #f8fafc;
  cursor: pointer;
}

.header-right-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-dark-toggle {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

.user-menu-container {
  position: relative;
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 20px;
  background: #f8fafc;
  cursor: pointer;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.82rem;
}

.avatar-admin {
  background: #d97706;
}

.user-details-compact {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.user-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: #0f172a;
}

.dropdown-arrow {
  font-size: 0.65rem;
  color: #64748b;
}

.user-dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.5rem;
  width: 220px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 0.5rem 0;
  z-index: 1100;
}

.dropdown-header {
  padding: 0.5rem 1rem;
  display: flex;
  flex-direction: column;
}

.dropdown-header strong {
  font-size: 0.88rem;
  color: #0f172a;
}

.dropdown-header small {
  font-size: 0.78rem;
  color: #64748b;
}

hr {
  margin: 0.4rem 0;
  border: none;
  border-top: 1px solid #f1f5f9;
}

.dropdown-item {
  width: 100%;
  padding: 0.5rem 1rem;
  text-align: left;
  background: none;
  border: none;
  font-size: 0.85rem;
  color: #334155;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #f8fafc;
}

.logout-item {
  color: #dc2626;
  font-weight: 600;
}

.logout-item:hover {
  background: #fee2e2;
}
</style>