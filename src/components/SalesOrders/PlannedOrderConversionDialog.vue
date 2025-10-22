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
          Конвертиране на планова поръчка
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
            <span class="info-label">Планова поръчка:</span>
            <span class="info-value planned-order">{{ plannedOrder }}</span>
          </div>
          <div class="info-item" v-if="material">
            <span class="info-label">Материал:</span>
            <span class="info-value">{{ material }}</span>
          </div>
          <div class="info-item" v-if="plant">
            <span class="info-label">Завод:</span>
            <span class="info-value">{{ plant }} ({{ convertedPlantNumber }})</span>
          </div>
        </div>

        <!-- Production Version Combobox -->
        <div class="input-section">
          <label class="input-label" for="productionVersion">
            Производствена версия
            <span v-if="isLoadingVersions" class="loading-text">(зареждане...)</span>
            <span v-else-if="productionVersions.length > 0" class="success-text">({{ productionVersions.length }} намерени)</span>
            <span v-else-if="material && convertedPlantNumber" class="info-text">(завод: {{ convertedPlantNumber }})</span>
          </label>
          <select
            id="productionVersion"
            v-model="selectedProductionVersion"
            class="input-field select-field"
            :disabled="isConverting || isLoadingVersions || productionVersions.length === 0"
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
            v-if="productionVersions.length === 0 && !isLoadingVersions && material && convertedPlantNumber" 
            class="info-message"
          >
            Няма намерени производствени версии за материал {{ material }} в завод {{ convertedPlantNumber }}
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
            :class="{ 'input-field-readonly': true }"
            placeholder="ZP02"
            readonly
            :disabled="isConverting"
          />
          <div class="info-message">
            Типът производствена поръчка е фиксиран на ZP02
          </div>
        </div>

        <div class="datetime-section">
          <div class="datetime-row">
            <div class="input-section flex-1">
              <label class="input-label" for="scheduledStartDate">
                Планирана начална дата <span class="required-asterisk">*</span>
              </label>
              <input
                id="scheduledStartDate"
                v-model="displayDate"
                type="text"
                class="input-field"
                :class="{ 'input-error': !displayDate && showValidation }"
                placeholder="дд.мм.гггг"
                :disabled="isConverting"
                @input="handleDateInput"
                @blur="validateDateFormat"
                maxlength="10"
              />
              <div 
                v-if="!displayDate && showValidation" 
                class="error-message"
              >
                Датата е задължителна
              </div>
              <div 
                v-if="dateFormatError" 
                class="error-message"
              >
                {{ dateFormatError }}
              </div>
            </div>

            <div class="input-section flex-1">
              <label class="input-label" for="scheduledStartTime">
                Планиран начален час <span class="required-asterisk">*</span>
              </label>
              <input
                id="scheduledStartTime"
                v-model="displayTime"
                type="text"
                class="input-field"
                :class="{ 'input-error': !displayTime && showValidation }"
                placeholder="чч:мм"
                :disabled="isConverting"
                @input="handleTimeInput"
                @blur="validateTimeFormat"
                maxlength="5"
              />
              <div 
                v-if="!displayTime && showValidation" 
                class="error-message"
              >
                Часът е задължителен
              </div>
              <div 
                v-if="timeFormatError" 
                class="error-message"
              >
                {{ timeFormatError }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="conversionStatus" class="status-section">
          <div class="status-step" :class="{ 'status-active': conversionStatus === 'converting' }">
            <span class="status-icon">
              <span v-if="conversionStatus === 'converting'" class="loading-spinner-small"></span>
              <span v-else-if="['converted', 'updating', 'updatingVersion', 'completed'].includes(conversionStatus)">✓</span>
              <span v-else>1</span>
            </span>
            <span class="status-text">Конвертиране на поръчка</span>
          </div>
          <div class="status-divider"></div>
          <div class="status-step" :class="{ 'status-active': conversionStatus === 'updating' }">
            <span class="status-icon">
              <span v-if="conversionStatus === 'updating'" class="loading-spinner-small"></span>
              <span v-else-if="['updatingVersion', 'completed'].includes(conversionStatus)">✓</span>
              <span v-else>2</span>
            </span>
            <span class="status-text">Актуализиране на датата</span>
          </div>
          <div v-if="needsVersionUpdate" class="status-divider"></div>
          <div v-if="needsVersionUpdate" class="status-step" :class="{ 'status-active': conversionStatus === 'updatingVersion' }">
            <span class="status-icon">
              <span v-if="conversionStatus === 'updatingVersion'" class="loading-spinner-small"></span>
              <span v-else-if="conversionStatus === 'completed'">✓</span>
              <span v-else>3</span>
            </span>
            <span class="status-text">Актуализиране на версия</span>
          </div>
        </div>

        <div v-if="successMessage" class="success-section">
          <div class="success-alert">
            <div class="success-icon-wrapper">
              <span class="success-icon">✓</span>
            </div>
            <div class="success-content">
              <div class="success-title">{{ successMessage.title }}</div>
              <div class="success-details">{{ successMessage.details }}</div>
            </div>
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
          :disabled="isConverting || !isFormValid"
          :class="{ 'btn-loading': isConverting }"
        >
          <span v-if="isConverting" class="loading-spinner"></span>
          <span v-if="isConverting">{{ conversionStatusText }}</span>
          <span v-else>Конвертирай</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { productionOrderService, type ProductionVersionDto } from '@/services/productionOrderService'

// Props
interface Props {
  visible: boolean
  plannedOrder: string
  material?: string
  plant?: string
}

const props = withDefaults(defineProps<Props>(), {
  material: '',
  plant: ''
})

// Events
interface Emits {
  'update:visible': [visible: boolean]
  'success': []
  'cancel': []
}

const emit = defineEmits<Emits>()

// State
const manufacturingOrderType = ref('ZP02') // Pre-filled with ZP02
const scheduledStartDate = ref('')
const scheduledStartTime = ref('')
const displayDate = ref('')
const displayTime = ref('')
const dateFormatError = ref('')
const timeFormatError = ref('')
const isConverting = ref(false)
const showValidation = ref(false)
const errorMessage = ref('')
const successMessage = ref<{ title: string; details: string } | null>(null)
const conversionStatus = ref<'' | 'converting' | 'converted' | 'updating' | 'updatingVersion' | 'completed'>('')
const convertedProductionOrder = ref('')

// Production Version state
const productionVersions = ref<ProductionVersionDto[]>([])
const selectedProductionVersion = ref<string>('')
const isLoadingVersions = ref(false)
const productionVersionsKey = ref(0)

// Computed
const convertedPlantNumber = computed(() => {
  // Convert plant name to plant number: "Start" -> 1100, anything else -> 1000
  return props.plant?.toLowerCase() === 'start' ? '1100' : '1000'
})

const needsVersionUpdate = computed(() => {
  return selectedProductionVersion.value && selectedProductionVersion.value !== '1000'
})

const isFormValid = computed(() => {
  return manufacturingOrderType.value.trim() !== '' &&
         scheduledStartDate.value !== '' &&
         scheduledStartTime.value !== '' &&
         !dateFormatError.value &&
         !timeFormatError.value
})

const conversionStatusText = computed(() => {
  switch (conversionStatus.value) {
    case 'converting':
      return 'Конвертиране...'
    case 'converted':
      return 'Конвертирано ✓'
    case 'updating':
      return 'Актуализиране на дата...'
    case 'updatingVersion':
      return 'Актуализиране на версия...'
    case 'completed':
      return 'Завършено ✓'
    default:
      return 'Конвертиране...'
  }
})

// Methods
const fetchProductionVersions = async () => {
  // Only fetch if both material and plant are provided
  if (!props.material || !convertedPlantNumber.value) {
    console.log('Cannot fetch production versions - missing data:', {
      material: props.material,
      plant: props.plant,
      convertedPlantNumber: convertedPlantNumber.value
    })
    productionVersions.value = []
    selectedProductionVersion.value = ''
    productionVersionsKey.value++
    return
  }

  try {
    console.log('Fetching production versions for:', {
      material: props.material,
      originalPlant: props.plant,
      convertedPlantNumber: convertedPlantNumber.value
    })
    
    isLoadingVersions.value = true
    productionVersions.value = []
    selectedProductionVersion.value = ''

    const versions = await productionOrderService.getProductionVersionsByMaterial(
      props.material,
      convertedPlantNumber.value
    )

    console.log('Production versions fetched:', versions)
    
    productionVersions.value = versions
    productionVersionsKey.value++

    // Auto-select if only one version exists
    if (versions.length === 1) {
      selectedProductionVersion.value = versions[0].productionVersionNumber.toString()
    }

  } catch (error) {
    console.error('Failed to fetch production versions:', error)
    productionVersions.value = []
    selectedProductionVersion.value = ''
    productionVersionsKey.value++
  } finally {
    isLoadingVersions.value = false
  }
}

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
  
  displayDate.value = value
  dateFormatError.value = ''
}

const validateDateFormat = () => {
  if (!displayDate.value) {
    dateFormatError.value = ''
    scheduledStartDate.value = ''
    return
  }

  const datePattern = /^(\d{2})\.(\d{2})\.(\d{4})$/
  const match = displayDate.value.match(datePattern)
  
  if (!match) {
    dateFormatError.value = 'Формат: дд.мм.гггг'
    scheduledStartDate.value = ''
    return
  }
  
  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const year = parseInt(match[3], 10)
  
  // Validate date values
  if (month < 1 || month > 12) {
    dateFormatError.value = 'Невалиден месец'
    scheduledStartDate.value = ''
    return
  }
  
  if (day < 1 || day > 31) {
    dateFormatError.value = 'Невалиден ден'
    scheduledStartDate.value = ''
    return
  }
  
  // Check if date is valid
  const testDate = new Date(year, month - 1, day)
  if (testDate.getDate() !== day || testDate.getMonth() !== month - 1 || testDate.getFullYear() !== year) {
    dateFormatError.value = 'Невалидна дата'
    scheduledStartDate.value = ''
    return
  }
  
  // Convert to YYYY-MM-DD format for backend
  scheduledStartDate.value = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  dateFormatError.value = ''
}

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
  
  displayTime.value = value
  timeFormatError.value = ''
}

const validateTimeFormat = () => {
  if (!displayTime.value) {
    timeFormatError.value = ''
    scheduledStartTime.value = ''
    return
  }

  const timePattern = /^(\d{2}):(\d{2})$/
  const match = displayTime.value.match(timePattern)
  
  if (!match) {
    timeFormatError.value = 'Формат: чч:мм (24ч)'
    scheduledStartTime.value = ''
    return
  }
  
  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  
  if (hours < 0 || hours > 23) {
    timeFormatError.value = 'Часовете трябва да са 00-23'
    scheduledStartTime.value = ''
    return
  }
  
  if (minutes < 0 || minutes > 59) {
    timeFormatError.value = 'Минутите трябва да са 00-59'
    scheduledStartTime.value = ''
    return
  }
  
  scheduledStartTime.value = displayTime.value
  timeFormatError.value = ''
}

const handleConvert = async () => {
  if (!isFormValid.value) {
    showValidation.value = true
    return
  }

  try {
    isConverting.value = true
    errorMessage.value = ''
    successMessage.value = null
    conversionStatus.value = 'converting'
    
    // Step 1: Convert planned order
    const conversionResult = await productionOrderService.convertPlannedOrder(
      props.plannedOrder,
      manufacturingOrderType.value.trim() // This will always be "ZP02"
    )

    if (!conversionResult.success) {
      throw new Error(conversionResult.message || 'Неуспешно конвертиране')
    }

    // Store the converted production order number
    convertedProductionOrder.value = conversionResult.productionOrder || props.plannedOrder
    conversionStatus.value = 'converted'

    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))

    // Step 2: Update production order with scheduled date/time
    conversionStatus.value = 'updating'
    
    const updateResult = await productionOrderService.updateProductionOrder(
      convertedProductionOrder.value,
      scheduledStartDate.value,
      scheduledStartTime.value
    )

    if (!updateResult.success) {
      throw new Error(updateResult.message || 'Неуспешна актуализация')
    }

    // Step 3: Update production version if needed (not 1000)
    if (needsVersionUpdate.value) {
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      conversionStatus.value = 'updatingVersion'
      
      const updateVersionResult = await productionOrderService.updateProductionVersion(
        convertedProductionOrder.value,
        selectedProductionVersion.value
      )

      if (!updateVersionResult.success) {
        throw new Error(updateVersionResult.message || 'Неуспешна актуализация на версия')
      }
    }

    conversionStatus.value = 'completed'

    // Show success message
    let details = `Плановата поръчка ${props.plannedOrder} беше успешно конвертирана в производствена поръчка ${convertedProductionOrder.value} и планирана за ${displayDate.value} в ${displayTime.value} часа.`
    
    if (needsVersionUpdate.value) {
      details += ` Производствената версия беше актуализирана на ${selectedProductionVersion.value}.`
    }

    successMessage.value = {
      title: '🎉 Успешно конвертиране и планиране!',
      details
    }

    // Wait to show success message
    await new Promise(resolve => setTimeout(resolve, 2500))

    // Success - notify parent and close
    emit('success')
    emit('update:visible', false)
    resetDialog()

  } catch (error) {
    console.error('Error in handleConvert:', error)
    errorMessage.value = error instanceof Error ? error.message : 'Възникна неочаквана грешка'
    isConverting.value = false
    conversionStatus.value = ''
  }
}

const handleCancel = () => {
  if (isConverting.value) return
  
  emit('cancel')
  emit('update:visible', false)
  resetDialog()
}

const handleOverlayClick = () => {
  if (!isConverting.value) {
    handleCancel()
  }
}

const resetDialog = () => {
  // Keep ZP02 as the default value when resetting
  manufacturingOrderType.value = 'ZP02'
  scheduledStartDate.value = ''
  scheduledStartTime.value = ''
  displayDate.value = ''
  displayTime.value = ''
  dateFormatError.value = ''
  timeFormatError.value = ''
  isConverting.value = false
  showValidation.value = false
  errorMessage.value = ''
  successMessage.value = null
  conversionStatus.value = ''
  convertedProductionOrder.value = ''
  productionVersions.value = []
  selectedProductionVersion.value = ''
  isLoadingVersions.value = false
  productionVersionsKey.value = 0
}

const setConvertingState = (state: boolean) => {
  isConverting.value = state
}

const setErrorMessage = (message: string) => {
  errorMessage.value = message
  isConverting.value = false
  conversionStatus.value = ''
}

// Initialize with current date/time
const initializeDateTime = () => {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  
  // Set display values in dd.mm.yyyy and HH:mm format
  displayDate.value = `${day}.${month}.${year}`
  displayTime.value = `${hours}:${minutes}`
  
  // Set internal values in YYYY-MM-DD and HH:mm format
  scheduledStartDate.value = `${year}-${month}-${day}`
  scheduledStartTime.value = `${hours}:${minutes}`
}

// Watch for dialog visibility changes
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    resetDialog()
    initializeDateTime()
    
    // Automatically fetch production versions when dialog opens
    if (props.material && convertedPlantNumber.value) {
      fetchProductionVersions()
    }
    
    // Focus the input field after the dialog is shown
    nextTick(() => {
      const input = document.getElementById('manufacturingOrderType')
      input?.focus()
    })
  }
})

// Watch for plant changes to refetch production versions
watch(() => props.plant, (newPlant) => {
  if (props.visible && props.material && newPlant) {
    console.log('Plant changed, refetching production versions:', {
      originalPlant: newPlant,
      convertedPlantNumber: convertedPlantNumber.value
    })
    fetchProductionVersions()
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
  max-width: 600px;
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
  max-height: calc(90vh - 180px);
  overflow-y: auto;
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
  font-size: 0.85rem;
  font-weight: 400;
  color: #6b7280;
  font-style: italic;
}

.success-text {
  font-size: 0.85rem;
  font-weight: 400;
  color: #10b981;
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
  font-size: 1rem;
}

.info-message {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.info-message::before {
  content: 'ℹ️';
  font-size: 0.75rem;
}

.status-section {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.status-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
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
  background: #e0f2fe;
  border: 2px solid #bae6fd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #0369a1;
  font-size: 1.1rem;
}

.status-active .status-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-color: #1d4ed8;
  color: white;
}

.status-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  text-align: center;
}

.status-divider {
  width: 40px;
  height: 2px;
  background: #bae6fd;
  margin: 0 0.5rem;
  margin-bottom: 1.5rem;
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.success-section {
  margin-bottom: 1.5rem;
}

.success-alert {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 2px solid #86efac;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  box-shadow: 0 4px 6px rgba(34, 197, 94, 0.1);
  animation: successSlideIn 0.4s ease-out;
}

@keyframes successSlideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.success-icon-wrapper {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  animation: successPulse 2s ease-in-out infinite;
}

@keyframes successPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
  }
}

.success-icon {
  color: white;
  font-size: 28px;
  font-weight: bold;
  animation: successCheck 0.6s ease-out;
}

@keyframes successCheck {
  0% {
    transform: scale(0) rotate(-45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(0deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.success-content {
  flex: 1;
}

.success-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: #166534;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.success-details {
  color: #15803d;
  font-size: 0.95rem;
  line-height: 1.5;
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

  .datetime-row {
    flex-direction: column;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 0.75rem;
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

  .loading-spinner,
  .loading-spinner-small {
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

.info-text {
  font-size: 0.85rem;
  font-weight: 400;
  color: #6b7280;
  font-style: italic;
}
</style>