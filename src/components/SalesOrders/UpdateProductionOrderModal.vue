<template>
  <div v-if="show" class="modal-overlay" @click.self="handleClose">
    <div class="modal-container">
      <div class="modal-header">
        <h3 class="modal-title">🔄 Актуализация на производствена поръчка</h3>
        <button 
          class="modal-close-btn"
          @click="handleClose"
          :disabled="updating"
        >
          ✕
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="productionOrderInput" class="form-label">
            Производствена поръчка:
          </label>
          <input
            id="productionOrderInput"
            v-model="productionOrderInput"
            type="text"
            class="form-input"
            placeholder="Въведете номер на производствена поръчка"
            :disabled="updating"
            @keyup.enter="handleUpdate"
          />
        </div>

        <div v-if="error" class="error-message">
          <span class="error-icon">⚠️</span>
          <span>{{ error }}</span>
        </div>

        <div v-if="successMessage" class="success-message">
          <span class="success-icon">✅</span>
          <span>{{ successMessage }}</span>
        </div>
      </div>

      <div class="modal-footer">
        <button
          class="btn btn-secondary"
          @click="handleClose"
          :disabled="updating"
        >
          Отказ
        </button>
        <button
          class="btn btn-primary"
          @click="handleUpdate"
          :disabled="!productionOrderInput.trim() || updating"
        >
          {{ updating ? '⏳ Актуализиране...' : '🔄 Актуализирай' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { productionOrderService } from '@/services/productionOrderService'

// Props
const props = defineProps<{
  show: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
  success: [productionOrder: string]
}>()

// State
const productionOrderInput = ref('')
const updating = ref(false)
const error = ref('')
const successMessage = ref('')

// Methods
const handleClose = () => {
  if (!updating.value) {
    emit('close')
  }
}

const handleUpdate = async () => {
  const prodOrder = productionOrderInput.value.trim()
  
  if (!prodOrder) {
    error.value = 'Моля, въведете номер на производствена поръчка'
    return
  }

  updating.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const result = await productionOrderService.updateProductionOrder(prodOrder)
    
    if (result.success) {
      successMessage.value = result.message || 'Производствената поръчка беше успешно актуализирана'
      
      // Emit success event
      emit('success', prodOrder)
      
      // Close modal after short delay
      setTimeout(() => {
        handleClose()
      }, 1500)
    } else {
      error.value = result.message || 'Възникна грешка при актуализацията'
    }
  } catch (err) {
    console.error('Update error:', err)
    error.value = err instanceof Error ? err.message : 'Възникна неочаквана грешка'
  } finally {
    updating.value = false
  }
}

// Watch for modal visibility to reset state
watch(() => props.show, (isVisible) => {
  if (isVisible) {
    // Reset state when modal opens
    productionOrderInput.value = ''
    error.value = ''
    successMessage.value = ''
    updating.value = false
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  transition: color 0.2s ease;
}

.modal-close-btn:hover:not(:disabled) {
  color: #1f2937;
}

.modal-close-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.error-message,
.success-message {
  padding: 0.75rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.success-message {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
}

.error-icon,
.success-icon {
  font-size: 1.1rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 0.95rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

@media (max-width: 640px) {
  .modal-container {
    max-width: 100%;
    margin: 0.5rem;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }

  .btn {
    flex: 1;
  }
}
</style>