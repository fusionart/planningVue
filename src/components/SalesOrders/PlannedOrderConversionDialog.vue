<!-- PlannedOrderConversionDialog.vue -->
<template>
  <div 
    v-if="visible" 
    class="dialog-overlay"
    @click.self="handleOverlayClick"
  >
    <div class="dialog-container">
      <div class="dialog-header">
        <h3 class="dialog-title">
          <span class="dialog-icon">🔄</span>
          Конвертиране на планирана поръчка
        </h3>
        <button 
          class="dialog-close-btn"
          @click="handleCancel"
          :disabled="isConverting"
          :title="'Затвори'"
        >
          ✕
        </button>
      </div>

      <div class="dialog-body">
        <div class="order-info">
          <div class="info-item">
            <span class="info-label">Планирана поръчка:</span>
            <span class="info-value planned-order">{{ plannedOrder }}</span>
          </div>
          <div class="info-item" v-if="material">
            <span class="info-label">Материал:</span>
            <span class="info-value">{{ material }}</span>
          </div>
        </div>

        <div class="input-section">
          <label class="input-label" for="manufacturingOrderType">
            Тип производствена поръчка <span class="required-asterisk">*</span>
          </label>
          <input
            id="manufacturingOrderType"
            v-model="manufacturingOrderType"
            type="text"
            class="input-field"
            :class="{ 'input-error': !manufacturingOrderType.trim() && showValidation }"
            placeholder="Въведете тип производствена поръчка"
            :disabled="isConverting"
            @keyup.enter="handleConvert"
            @input="showValidation = false"
          />
          <div 
            v-if="!manufacturingOrderType.trim() && showValidation" 
            class="error-message"
          >
            Типът производствена поръчка е задължителен
          </div>
        </div>

        <div v-if="errorMessage" class="error-section">
          <div class="error-alert">
            <span class="error-icon">⚠️</span>
            <div class="error-content">
              <div class="error-title">Грешка при конвертиране</div>
              <div class="error-details">{{ errorMessage }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button 
          class="btn btn-cancel"
          @click="handleCancel"
          :disabled="isConverting"
        >
          Отказ
        </button>
        <button 
          class="btn btn-convert"
          @click="handleConvert"
          :disabled="isConverting || !manufacturingOrderType.trim()"
          :class="{ 'btn-loading': isConverting }"
        >
          <span v-if="isConverting" class="loading-spinner"></span>
          <span v-if="isConverting">Конвертиране...</span>
          <span v-else>Конвертирай</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'

// Props
interface Props {
  visible: boolean
  plannedOrder: string
  material?: string
}

const props = withDefaults(defineProps<Props>(), {
  material: ''
})

// Events
interface Emits {
  'update:visible': [visible: boolean]
  'convert': [plannedOrder: string, manufacturingOrderType: string]
  'cancel': []
}

const emit = defineEmits<Emits>()

// State
const manufacturingOrderType = ref('')
const isConverting = ref(false)
const showValidation = ref(false)
const errorMessage = ref('')

// Methods
const handleConvert = async () => {
  if (!manufacturingOrderType.value.trim()) {
    showValidation.value = true
    return
  }

  try {
    isConverting.value = true
    errorMessage.value = ''
    
    emit('convert', props.plannedOrder, manufacturingOrderType.value.trim())
  } catch (error) {
    console.error('Error in handleConvert:', error)
    errorMessage.value = 'Възникна неочаквана грешка'
    isConverting.value = false
  }
}

const handleCancel = () => {
  if (isConverting.value) return
  
  emit('cancel')
  resetDialog()
}

const handleOverlayClick = () => {
  if (!isConverting.value) {
    handleCancel()
  }
}

const resetDialog = () => {
  manufacturingOrderType.value = ''
  isConverting.value = false
  showValidation.value = false
  errorMessage.value = ''
}

const setConvertingState = (state: boolean) => {
  isConverting.value = state
}

const setErrorMessage = (message: string) => {
  errorMessage.value = message
  isConverting.value = false
}

// Watch for dialog visibility changes
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    resetDialog()
    // Focus the input field after the dialog is shown
    nextTick(() => {
      const input = document.getElementById('manufacturingOrderType')
      input?.focus()
    })
  }
})

// Expose methods for parent component
defineExpose({
  setConvertingState,
  setErrorMessage,
  resetDialog
})
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dialog-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: scale(0.95) translateY(-20px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  position: relative;
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.dialog-icon {
  font-size: 1.5rem;
  opacity: 0.9;
}

.dialog-close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 6px;
  color: white;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.2rem;
  font-weight: bold;
}

.dialog-close-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.dialog-close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dialog-body {
  padding: 2rem;
}

.order-info {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 600;
  color: #475569;
  min-width: 140px;
}

.info-value {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-weight: 700;
  color: #1e293b;
  background: white;
  padding: 0.375rem 0.75rem;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
}

.planned-order {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
  border-color: #93c5fd;
}

.input-section {
  margin-bottom: 1.5rem;
}

.input-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.required-asterisk {
  color: #dc2626;
  margin-left: 0.25rem;
}

.input-field {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  color: #1f2937 !important; /* Force black text color */
}

.input-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  color: #1f2937 !important; /* Force black text color */
}

.input-field:disabled {
  background: #f3f4f6;
  color: #6b7280 !important; /* Gray text for disabled state */
  cursor: not-allowed;
}

.input-error {
  border-color: #dc2626 !important;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1) !important;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.error-message::before {
  content: '⚠️';
  font-size: 1rem;
}

.error-section {
  margin-bottom: 1.5rem;
}

.error-alert {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  border: 1px solid #fca5a5;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.error-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.error-content {
  flex: 1;
}

.error-title {
  font-weight: 600;
  color: #991b1b;
  margin-bottom: 0.25rem;
}

.error-details {
  color: #7f1d1d;
  font-size: 0.9rem;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 0.875rem 1.75rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 120px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.btn-convert {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.btn-convert:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.btn-convert:disabled {
  background: #9ca3af;
  box-shadow: none;
  transform: none;
}

.btn-loading {
  pointer-events: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive design */
@media (max-width: 640px) {
  .dialog-container {
    width: 95%;
    margin: 1rem;
  }

  .dialog-header,
  .dialog-body,
  .dialog-footer {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .dialog-title {
    font-size: 1.1rem;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .info-label {
    min-width: auto;
    font-size: 0.9rem;
  }

  .info-value {
    width: 100%;
    text-align: center;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn {
    width: 100%;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .dialog-header {
    background: #000;
    color: #fff;
  }

  .input-field {
    border-color: #000;
  }

  .btn-convert {
    background: #000;
  }

  .btn-cancel {
    background: #fff;
    color: #000;
    border-color: #000;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .dialog-overlay,
  .dialog-container,
  .btn,
  .input-field {
    animation: none;
    transition: none;
  }

  .btn-convert:hover:not(:disabled) {
    transform: none;
  }

  .loading-spinner {
    animation: none;
  }
}

/* Focus styles for accessibility */
.btn:focus-visible,
.input-field:focus-visible,
.dialog-close-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
</style>