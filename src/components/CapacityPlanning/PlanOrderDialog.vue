<!-- PlanOrderDialog.vue -->
<template>
  <div 
    v-if="visible" 
    class="dialog-overlay"
    @click.self="handleOverlayClick"
  >
    <div class="dialog-container">
      <div class="dialog-header">
        <h3 class="dialog-title">
          <span class="dialog-icon">📅</span>
          Планиране на поръчка
        </h3>
        <button 
          class="dialog-close-btn"
          @click="handleCancel"
          :disabled="isProcessing"
          :title="'Затвори'"
        >
          ✕
        </button>
      </div>

      <div class="dialog-body">
        <!-- Order Information (Read-only except quantity) -->
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Поръчка:</span>
            <span class="info-value">{{ order?.orderNo || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Материал:</span>
            <span class="info-value">{{ order?.material || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Описание:</span>
            <span class="info-value">{{ order?.materialDescription || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Работен център:</span>
            <span class="info-value">{{ order?.workCenter || '-' }}</span>
          </div>
          <div class="info-row" v-if="plant">
            <span class="info-label">Завод:</span>
            <span class="info-value">{{ plant }} ({{ convertedPlantNumber }})</span>
          </div>
        </div>

        <!-- Production Version Dropdown -->
        <div class="input-section">
          <label class="input-label" for="productionVersion">
            Производствена версия <span class="required-asterisk">*</span>
            <span v-if="isLoadingVersions" class="loading-text">(зареждане...)</span>
            <span v-else-if="productionVersions.length > 0" class="success-text">({{ productionVersions.length }} намерени)</span>
            <span v-else-if="order?.material && convertedPlantNumber" class="info-text">(завод: {{ convertedPlantNumber }})</span>
          </label>
          <select
            id="productionVersion"
            v-model="selectedProductionVersion"
            class="input-field select-field"
            :class="{ 'input-error': !selectedProductionVersion && showValidation }"
            :disabled="isProcessing || isLoadingVersions || productionVersions.length === 0"
            :key="productionVersionsKey"
            @change="showValidation = false"
          >
            <option value="" disabled>{{ productionVersions.length === 0 ? 'Няма налични версии' : 'Изберете производствена версия' }}</option>
            <option 
              v-for="version in productionVersions" 
              :key="version.id"
              :value="version.productionVersionNumber.toString()"
            >
              {{ version.productionVersionNumber }} - {{ version.description }}
            </option>
          </select>
          <div 
            v-if="!selectedProductionVersion && showValidation" 
            class="error-message"
          >
            Производствената версия е задължителна
          </div>
          <div 
            v-if="productionVersions.length === 0 && !isLoadingVersions && order?.material && convertedPlantNumber" 
            class="info-message"
          >
            Няма намерени производствени версии за материал {{ order.material }} в завод {{ convertedPlantNumber }}
          </div>
        </div>

        <!-- Editable Quantity -->
        <div class="input-section">
          <label class="input-label" for="quantity">
            Количество <span class="required-asterisk">*</span>
          </label>
          <input
            id="quantity"
            v-model="quantity"
            type="text"
            class="input-field"
            :class="{ 'input-error': !quantity && showValidation }"
            placeholder="Въведете количество"
            :disabled="isProcessing"
          />
          <div 
            v-if="!quantity && showValidation" 
            class="error-message"
          >
            Количеството е задължително
          </div>
        </div>

        <!-- Processing Start Date/Time -->
        <div class="section-header">Начало на обработка</div>
        <div class="datetime-section">
          <div class="datetime-row">
            <div class="input-section flex-1">
              <label class="input-label" for="procgStartDate">
                Дата <span class="required-asterisk">*</span>
              </label>
              <input
                id="procgStartDate"
                v-model="displayProcgStartDate"
                type="text"
                class="input-field"
                :class="{ 'input-error': !displayProcgStartDate && showValidation }"
                placeholder="дд.мм.гггг"
                :disabled="isProcessing"
                @input="handleDateInput($event)"
                @blur="validateDateFormat()"
                maxlength="10"
              />
              <div 
                v-if="!displayProcgStartDate && showValidation" 
                class="error-message"
              >
                Датата е задължителна
              </div>
              <div 
                v-if="procgDateFormatError" 
                class="error-message"
              >
                {{ procgDateFormatError }}
              </div>
            </div>

            <div class="input-section flex-1">
              <label class="input-label" for="procgStartTime">
                Час <span class="required-asterisk">*</span>
              </label>
              <input
                id="procgStartTime"
                v-model="displayProcgStartTime"
                type="text"
                class="input-field"
                :class="{ 'input-error': !displayProcgStartTime && showValidation }"
                placeholder="чч:мм"
                :disabled="isProcessing"
                @input="handleTimeInput($event)"
                @blur="validateTimeFormat()"
                maxlength="5"
              />
              <div 
                v-if="!displayProcgStartTime && showValidation" 
                class="error-message"
              >
                Часът е задължителен
              </div>
              <div 
                v-if="procgTimeFormatError" 
                class="error-message"
              >
                {{ procgTimeFormatError }}
              </div>
            </div>
          </div>
        </div>

        <!-- Status Section -->
        <div v-if="planStatus" class="status-section">
          <div class="status-step" :class="{ 'status-active': planStatus === 'updating' }">
            <span class="status-icon">
              <span v-if="planStatus === 'updating'" class="loading-spinner-small"></span>
              <span v-else-if="['updated', 'dispatching', 'completed'].includes(planStatus)">✓</span>
              <span v-else>1</span>
            </span>
            <span class="status-text">Актуализиране на детайли</span>
          </div>
          <div class="status-divider"></div>
          <div class="status-step" :class="{ 'status-active': planStatus === 'dispatching' }">
            <span class="status-icon">
              <span v-if="planStatus === 'dispatching'" class="loading-spinner-small"></span>
              <span v-else-if="planStatus === 'completed'">✓</span>
              <span v-else>2</span>
            </span>
            <span class="status-text">Диспечиране на поръчка</span>
          </div>
        </div>

        <div v-if="successMessage" class="success-section">
          <div class="success-alert">
            <div class="success-icon-wrapper">
              <span class="success-icon">✓</span>
            </div>
            <div class="success-content">
              <div class="success-title">{{ successMessage }}</div>
            </div>
          </div>
        </div>

        <div v-if="errorMessage" class="error-section">
          <div class="error-alert">
            <span class="error-icon">⚠️</span>
            <div class="error-content">
              <div class="error-title">Грешка при планирането</div>
              <div class="error-details">{{ errorMessage }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button 
          class="btn btn-cancel"
          @click="handleCancel"
          :disabled="isProcessing"
        >
          Отказ
        </button>
        <button 
          class="btn btn-plan"
          @click="handlePlan"
          :disabled="isProcessing || !isFormValid"
          :class="{ 'btn-loading': isProcessing }"
        >
          <span v-if="isProcessing" class="loading-spinner"></span>
          <span v-if="isProcessing">{{ planStatusText }}</span>
          <span v-else>Планирай</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { plannedOrderService } from '@/services/plannedOrderService'
import { productionOrderService, type ProductionVersionDto } from '@/services/productionOrderService'

interface Props {
  visible: boolean
  order: any | null
  plant?: string // Plant name from Production Supervisor (e.g., "Start", "Plovdiv")
}

const props = withDefaults(defineProps<Props>(), {
  plant: ''
})

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  'success': []
  'cancel': []
}>()

// State
// Processing date/time
const opLtstSchedldProcgStrtDte = ref('')
const opLtstSchedldProcgStrtTme = ref('')
const displayProcgStartDate = ref('')
const displayProcgStartTime = ref('')
const procgDateFormatError = ref('')
const procgTimeFormatError = ref('')

// Production version state
const productionVersions = ref<ProductionVersionDto[]>([])
const selectedProductionVersion = ref<string>('')
const isLoadingVersions = ref(false)
const productionVersionsKey = ref(0)

// Quantity
const quantity = ref('')

const isProcessing = ref(false)
const showValidation = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const planStatus = ref<'' | 'updating' | 'updated' | 'dispatching' | 'completed'>('')

// Computed - Convert plant name to plant number (same logic as PlannedOrderConversionDialog)
const convertedPlantNumber = computed(() => {
  // Convert plant name to plant number: "Start" -> 1100, anything else -> 1000
  return props.plant?.toLowerCase() === 'start' ? '1100' : '1000'
})

// Computed
const isFormValid = computed(() => {
  return opLtstSchedldProcgStrtDte.value !== '' &&
         opLtstSchedldProcgStrtTme.value !== '' &&
         selectedProductionVersion.value !== '' &&
         quantity.value.trim() !== '' &&
         !procgDateFormatError.value &&
         !procgTimeFormatError.value
})

const planStatusText = computed(() => {
  switch (planStatus.value) {
    case 'updating':
      return 'Актуализиране...'
    case 'updated':
      return 'Актуализирането завърши ✓'
    case 'dispatching':
      return 'Диспечиране...'
    case 'completed':
      return 'Завършено ✓'
    default:
      return 'Планиране...'
  }
})

// Fetch production versions (same pattern as PlannedOrderConversionDialog)
const fetchProductionVersions = async () => {
  if (!props.order?.material || !convertedPlantNumber.value) {
    productionVersions.value = []
    selectedProductionVersion.value = ''
    return
  }

  try {
    isLoadingVersions.value = true
    productionVersions.value = []
    selectedProductionVersion.value = ''

    console.log('🔍 Fetching production versions for:', {
      material: props.order.material,
      plant: convertedPlantNumber.value
    })

    const versions = await productionOrderService.getProductionVersionsByMaterial(
      props.order.material,
      convertedPlantNumber.value
    )

    productionVersions.value = versions
    productionVersionsKey.value++

    console.log('✅ Production versions loaded:', versions)

    // Auto-select if only one version exists
    if (versions.length === 1) {
      selectedProductionVersion.value = versions[0].productionVersionNumber.toString()
      console.log('✅ Auto-selected version:', selectedProductionVersion.value)
    }

  } catch (error) {
    console.error('❌ Failed to fetch production versions:', error)
    productionVersions.value = []
    selectedProductionVersion.value = ''
  } finally {
    isLoadingVersions.value = false
  }
}

// Date input handling
const handleDateInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/[^\d.]/g, '')
  
  // Auto-format as user types
  if (value.length >= 2 && value[2] !== '.') {
    value = value.slice(0, 2) + '.' + value.slice(2)
  }
  if (value.length >= 5 && value[5] !== '.') {
    value = value.slice(0, 5) + '.' + value.slice(5)
  }
  if (value.length > 10) {
    value = value.slice(0, 10)
  }
  
  displayProcgStartDate.value = value
  procgDateFormatError.value = ''
  
  // If complete date, validate
  if (value.length === 10) {
    validateDateFormat()
  }
}

// Time input handling
const handleTimeInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/[^\d:]/g, '')
  
  // Auto-format as user types
  if (value.length >= 2 && value[2] !== ':') {
    value = value.slice(0, 2) + ':' + value.slice(2)
  }
  if (value.length > 5) {
    value = value.slice(0, 5)
  }
  
  displayProcgStartTime.value = value
  procgTimeFormatError.value = ''
  
  // If complete time, validate
  if (value.length === 5) {
    validateTimeFormat()
  }
}

// Date validation
const validateDateFormat = () => {
  const dateStr = displayProcgStartDate.value
  
  if (!dateStr) {
    return
  }
  
  const parts = dateStr.split('.')
  if (parts.length !== 3) {
    procgDateFormatError.value = 'Невалиден формат. Използвайте дд.мм.гггг'
    opLtstSchedldProcgStrtDte.value = ''
    return
  }
  
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const year = parseInt(parts[2], 10)
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    procgDateFormatError.value = 'Невалидна дата'
    opLtstSchedldProcgStrtDte.value = ''
    return
  }
  
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2100) {
    procgDateFormatError.value = 'Невалидна дата'
    opLtstSchedldProcgStrtDte.value = ''
    return
  }
  
  // Convert to YYYY-MM-DD format
  const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  opLtstSchedldProcgStrtDte.value = formattedDate
  procgDateFormatError.value = ''
}

// Time validation
const validateTimeFormat = () => {
  const timeStr = displayProcgStartTime.value
  
  if (!timeStr) {
    return
  }
  
  const parts = timeStr.split(':')
  if (parts.length !== 2) {
    procgTimeFormatError.value = 'Невалиден формат. Използвайте чч:мм'
    opLtstSchedldProcgStrtTme.value = ''
    return
  }
  
  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  
  if (isNaN(hours) || isNaN(minutes)) {
    procgTimeFormatError.value = 'Невалиден час'
    opLtstSchedldProcgStrtTme.value = ''
    return
  }
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    procgTimeFormatError.value = 'Невалиден час'
    opLtstSchedldProcgStrtTme.value = ''
    return
  }
  
  // Store in HH:mm format
  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  opLtstSchedldProcgStrtTme.value = formattedTime
  procgTimeFormatError.value = ''
}

const handleOverlayClick = () => {
  if (!isProcessing.value) {
    handleCancel()
  }
}

const handleCancel = () => {
  if (!isProcessing.value) {
    resetForm()
    emit('update:visible', false)
    emit('cancel')
  }
}

const handlePlan = async () => {
  showValidation.value = true
  errorMessage.value = ''
  successMessage.value = ''
  planStatus.value = ''
  
  if (!isFormValid.value) {
    errorMessage.value = 'Моля, попълнете всички задължителни полета'
    return
  }
  
  isProcessing.value = true
  
  try {
    // Call the combined planOrder method that handles both steps in new order (update first, then dispatch)
    planStatus.value = 'updating'
    
    const result = await plannedOrderService.planOrder(
      props.order.orderNo,
      opLtstSchedldProcgStrtDte.value,
      opLtstSchedldProcgStrtTme.value,
      selectedProductionVersion.value,
      quantity.value
    )
    
    if (result.success) {
      planStatus.value = 'completed'
      successMessage.value = result.message || 'Успешно планиране'
      
      await nextTick()
      setTimeout(() => {
        resetForm()
        emit('success')
        emit('update:visible', false)
      }, 1500)
    } else {
      planStatus.value = ''
      errorMessage.value = result.message || 'Възникна грешка при планирането'
    }
  } catch (error) {
    console.error('Error planning order:', error)
    planStatus.value = ''
    errorMessage.value = error instanceof Error 
      ? error.message 
      : 'Възникна неочаквана грешка'
  } finally {
    isProcessing.value = false
  }
}

const resetForm = () => {
  opLtstSchedldProcgStrtDte.value = ''
  opLtstSchedldProcgStrtTme.value = ''
  displayProcgStartDate.value = ''
  displayProcgStartTime.value = ''
  procgDateFormatError.value = ''
  procgTimeFormatError.value = ''
  selectedProductionVersion.value = ''
  productionVersions.value = []
  quantity.value = ''
  showValidation.value = false
  errorMessage.value = ''
  successMessage.value = ''
  planStatus.value = ''
}

// Watch for dialog visibility changes (same pattern as PlannedOrderConversionDialog)
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    resetForm()
    // Set quantity from order
    if (props.order?.quantity) {
      quantity.value = props.order.quantity.toString()
    }
    // Fetch production versions when dialog opens
    await nextTick()
    fetchProductionVersions()
  }
})

// Watch for material or plant changes and refetch versions (same pattern as PlannedOrderConversionDialog)
watch([() => props.order?.material, () => props.plant], () => {
  if (props.visible) {
    fetchProductionVersions()
  }
})
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.dialog-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 650px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dialog-icon {
  font-size: 1.5rem;
}

.dialog-close-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  line-height: 1;
  transition: all 0.2s ease;
  padding: 0;
}

.dialog-close-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.dialog-close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.info-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-row:first-child {
  padding-top: 0;
}

.info-label {
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 500;
}

.info-value {
  color: #1e293b;
  font-size: 0.95rem;
  font-weight: 600;
  text-align: right;
}

.section-header {
  font-weight: 600;
  color: #1e293b;
  font-size: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #3b82f6;
}

.input-section {
  margin-bottom: 1.5rem;
}

.datetime-section {
  margin-bottom: 1.5rem;
}

.datetime-row {
  display: flex;
  gap: 1rem;
}

.flex-1 {
  flex: 1;
}

.input-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.loading-text {
  color: #3b82f6;
  font-size: 0.875rem;
  font-weight: 400;
  margin-left: 0.5rem;
}

.success-text {
  color: #10b981;
  font-size: 0.875rem;
  font-weight: 400;
  margin-left: 0.5rem;
}

.info-text {
  font-size: 0.85rem;
  font-weight: 400;
  color: #6b7280;
  font-style: italic;
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
  color: #1f2937 !important;
}

.select-field {
  cursor: pointer;
}

.input-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  color: #1f2937 !important;
}

.input-field:disabled {
  background: #f3f4f6;
  color: #6b7280 !important;
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
  font-size: 0.75rem;
}

.info-message {
  color: #64748b;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  font-style: italic;
}

/* Status Section */
.status-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  gap: 0.5rem;
}

.status-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.status-step.status-active {
  opacity: 1;
}

.status-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.status-active .status-icon {
  background: #3b82f6;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.status-text {
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
  max-width: 100px;
}

.status-active .status-text {
  color: #1e293b;
  font-weight: 600;
}

.status-divider {
  width: 40px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 0.5rem;
  margin-bottom: 1.5rem;
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.success-section {
  margin: 1.5rem 0;
}

.success-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
}

.success-icon-wrapper {
  width: 24px;
  height: 24px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.success-icon {
  color: white;
  font-size: 0.875rem;
  font-weight: bold;
}

.success-content {
  flex: 1;
}

.success-title {
  font-weight: 600;
  color: #065f46;
  line-height: 1.4;
}

.error-section {
  margin: 1.5rem 0;
}

.error-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

.error-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
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
  color: #dc2626;
  font-size: 0.9rem;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem 2rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 100px;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: white;
  color: #374151;
  border: 2px solid #d1d5db;
}

.btn-cancel:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-plan {
  background: #3b82f6;
  color: white;
  border: 2px solid #3b82f6;
}

.btn-plan:hover:not(:disabled) {
  background: #2563eb;
  border-color: #2563eb;
}

.btn-plan:disabled {
  background: #d1d5db;
  border-color: #d1d5db;
}

.btn-loading {
  position: relative;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .dialog-container {
    width: 95%;
    margin: 1rem;
  }
  
  .dialog-header {
    padding: 1.25rem 1.5rem;
  }
  
  .dialog-body {
    padding: 1.5rem;
  }
  
  .datetime-row {
    flex-direction: column;
    gap: 0;
  }
  
  .dialog-footer {
    flex-direction: column-reverse;
  }
  
  .btn {
    width: 100%;
  }

  .status-section {
    flex-direction: column;
    gap: 0.75rem;
  }

  .status-divider {
    width: 2px;
    height: 30px;
    margin: 0;
  }
}
</style>