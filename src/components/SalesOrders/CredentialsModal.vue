<!-- CredentialsModal.vue -->
<template>
  <div v-if="show" class="modal-overlay" @click="handleClose">
    <div class="modal credentials-modal" @click.stop>
      <div class="modal-header">
        <h3>SAP API идентификационни данни</h3>
        <button class="modal-close" @click="handleClose">×</button>
      </div>
      
      <div class="modal-body">
        <div class="credentials-info">
          <p>Моля въведете вашите потребителско име и парола за SAP</p>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="username">Потребителско име:</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              placeholder="Въведете SAP потребител"
              class="form-input"
              :disabled="saving"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="password">Парола:</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="Въведете SAP парола"
              class="form-input"
              :disabled="saving"
              required
            />
          </div>

          <!-- Error message -->
          <div v-if="error" class="credentials-error">
            {{ error }}
          </div>

          <!-- Success message -->
          <div v-if="successMessage" class="credentials-success">
            {{ successMessage }}
          </div>
          
          <div class="form-actions">
            <button 
              type="button"
              class="btn btn-secondary" 
              @click="handleClose"
              :disabled="saving"
            >
              Отказ
            </button>
            <button 
              type="submit"
              class="btn btn-primary" 
              :disabled="!canSubmit || saving"
            >
              {{ saving ? 'Влизане...' : 'Влез' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { authService } from '@/services/authService'

// Props
interface Props {
  show: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: false
})

// Events
interface Emits {
  loginSuccess: [credentials: { username: string, password: string }]
  close: []
}

const emit = defineEmits<Emits>()

// Local state
const form = ref({
  username: '',
  password: ''
})

const saving = ref(false)
const error = ref('')
const successMessage = ref('')

// Computed
const canSubmit = computed(() => {
  return form.value.username.trim() !== '' && form.value.password.trim() !== ''
})

// Methods
const handleSubmit = async () => {
  if (!canSubmit.value || saving.value) return
  
  // Clear previous messages
  error.value = ''
  successMessage.value = ''
  saving.value = true
  
  try {
    const username = form.value.username.trim()
    const password = form.value.password.trim()
    
    // Call the login API
    const response = await authService.login(username, password)
    
    if (response.success) {
      // Show success message
      successMessage.value = response.message || 'Успешно влизане в системата!'
      
      // Emit success event with credentials
      emit('loginSuccess', { username, password })
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        handleClose()
      }, 1500)
    } else {
      // Show error message from API
      error.value = response.message || 'Неуспешно влизане. Моля, проверете данните си.'
    }
  } catch (err) {
    // Show generic error message
    error.value = 'Възникна грешка при свързване със сървъра. Моля, опитайте отново.'
    console.error('Login error:', err)
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  if (saving.value) return
  
  // Clear messages
  error.value = ''
  successMessage.value = ''
  
  emit('close')
}

// Reset form when modal closes
watch(() => props.show, (newShow) => {
  if (!newShow) {
    form.value = { username: '', password: '' }
    error.value = ''
    successMessage.value = ''
    saving.value = false
  }
})
</script>

<style scoped>
@import '@/styles/components/SalesOrders/CredentialsModal.css';

/* Additional styles for success message */
.credentials-success {
  margin: 1rem 0;
  padding: 0.75rem;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  color: #155724;
  font-size: 0.9rem;
}

.credentials-error {
  margin: 1rem 0;
  padding: 0.75rem;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  color: #721c24;
  font-size: 0.9rem;
}
</style>