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

          <div v-if="error" class="credentials-error">
            {{ error }}
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
              {{ saving ? 'Запазване...' : 'Запази' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// Props
interface Props {
  show: boolean
  saving: boolean
  error: string
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  saving: false,
  error: ''
})

// Events
interface Emits {
  save: [credentials: { username: string, password: string }]
  close: []
}

const emit = defineEmits<Emits>()

// Local state
const form = ref({
  username: '',
  password: ''
})

// Computed
const canSubmit = computed(() => {
  return form.value.username.trim() !== '' && form.value.password.trim() !== ''
})

// Methods
const handleSubmit = () => {
  if (!canSubmit.value || props.saving) return
  
  emit('save', {
    username: form.value.username.trim(),
    password: form.value.password.trim()
  })
}

const handleClose = () => {
  if (props.saving) return
  emit('close')
}

// Reset form when modal closes
watch(() => props.show, (newShow) => {
  if (!newShow) {
    form.value = { username: '', password: '' }
  }
})
</script>

<style scoped>
@import '@/styles/components/SalesOrders/CredentialsModal.css';
</style>