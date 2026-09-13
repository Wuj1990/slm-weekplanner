<script setup>
import { ref } from 'vue'

defineProps({
  authView: { type: String, default: 'login' },
  authError: { type: String, default: '' },
  authSuccess: { type: String, default: '' }
})

const emit = defineEmits(['login', 'register', 'navigate'])

const loginEmail = ref('')
const loginPassword = ref('')

const regFirstName = ref('')
const regLastName = ref('')
const regEmail = ref('')
const regPassword = ref('')
const regConfirmPassword = ref('')

const handleLoginSubmit = () => {
  emit('login', { email: loginEmail.value, password: loginPassword.value })
}

const handleRegisterSubmit = () => {
  emit('register', {
    firstName: regFirstName.value,
    lastName: regLastName.value,
    email: regEmail.value,
    password: regPassword.value,
    confirmPassword: regConfirmPassword.value
  })
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div v-if="authError" class="alert alert-danger">{{ authError }}</div>
      <div v-if="authSuccess" class="alert alert-success">{{ authSuccess }}</div>

      <!-- INLOGGEN -->
      <template v-if="authView === 'login' || authView === 'home'">
        <h2>🔐 Inloggen</h2>
        <p class="sub-text">Meld je aan om je weekrooster te bekijken of te beheren.</p>

        <form @submit.prevent="handleLoginSubmit" class="auth-form">
          <div class="form-group">
            <label>School E-mailadres:</label>
            <input v-model="loginEmail" type="email" placeholder="naam@leerling.be" required class="input-field" />
          </div>

          <div class="form-group">
            <label>Wachtwoord:</label>
            <input v-model="loginPassword" type="password" placeholder="••••••••" required class="input-field" />
          </div>

          <button type="submit" class="btn-primary full-width">Inloggen</button>
        </form>

        <div class="auth-footer">
          Nog geen account? 
          <button class="btn-link" @click="emit('navigate', 'register')">Registreer hier</button>
        </div>
      </template>

      <!-- REGISTREREN -->
      <template v-else-if="authView === 'register'">
        <h2>📝 Account Aanmaken</h2>
        <p class="sub-text">Vul je gegevens in om een nieuw account te maken.</p>

        <form @submit.prevent="handleRegisterSubmit" class="auth-form">
          <div class="name-grid">
            <div class="form-group">
              <label>Voornaam:</label>
              <input v-model="regFirstName" type="text" placeholder="Jan" required class="input-field" />
            </div>

            <div class="form-group">
              <label>Achternaam:</label>
              <input v-model="regLastName" type="text" placeholder="Peeters" required class="input-field" />
            </div>
          </div>

          <div class="form-group">
            <label>School E-mailadres:</label>
            <input v-model="regEmail" type="email" placeholder="jan.peeters@slm.be" required class="input-field" />
          </div>

          <div class="form-group">
            <label>Wachtwoord (min. 6 tekens):</label>
            <input v-model="regPassword" type="password" placeholder="••••••••" required class="input-field" />
          </div>

          <div class="form-group">
            <label>Bevestig Wachtwoord:</label>
            <input v-model="regConfirmPassword" type="password" placeholder="••••••••" required class="input-field" />
          </div>

          <button type="submit" class="btn-primary full-width">Registreer Account</button>
        </form>

        <div class="auth-footer">
          Al een account? 
          <button class="btn-link" @click="emit('navigate', 'login')">Inloggen</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
*, *::before, *::after {
  box-sizing: border-box;
}

.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  padding: 1.5rem;
}

.auth-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 480px;
}

h2 {
  margin: 0 0 0.25rem 0;
  color: #0f172a;
}

.sub-text {
  color: #64748b;
  font-size: 0.88rem;
  margin-bottom: 1.5rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.name-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
}

.input-field {
  padding: 0.65rem 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  width: 100%;
}

.input-field:focus {
  outline: none;
  border-color: #2563eb;
}

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 0.5rem;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.full-width {
  width: 100%;
}

.alert {
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.alert-danger {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

.alert-success {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}

.auth-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.88rem;
  color: #64748b;
}

.btn-link {
  background: none;
  border: none;
  color: #2563eb;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  margin-left: 0.25rem;
}

.btn-link:hover {
  text-decoration: underline;
}
</style>