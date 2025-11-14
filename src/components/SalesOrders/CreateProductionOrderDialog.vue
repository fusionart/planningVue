<!-- CreateProductionOrderDialog.vue -->
<template>
  <div 
    v-if="visible" 
    class="dialog-overlay"
    @click.self="handleOverlayClick"
  >
    <div class="dialog-container">
      <div class="dialog-header">
        <h3 class="dialog-title">
          <span class="dialog-icon">➕</span>
          Създаване на производствена поръчка
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
        <div class="input-section">
          <label class="input-label" for="material">
            Материал <span class="required-asterisk">*</span>
          </label>
          <input
            id="material"
            v-model="material"
            type="text"
            class="input-field"
            :class="{ 'input-error': !material.trim() && showValidation }"
            placeholder="Въведете код на материал"
            :disabled="isProcessing"
            @keyup.enter="handleCreate"
            @blur="handleMaterialBlur"
            @input="showValidation = false"
          />
          <div 
            v-if="!material.trim() && showValidation" 
            class="error-message"
          >
            Материалът е задължителен
          </div>
        </div>

        <div class="input-section">
          <label class="input-label" for="productionPlant">
            Производствен завод <span class="required-asterisk">*</span>
          </label>
          <input
            id="productionPlant"
            v-model="productionPlant"
            type="text"
            class="input-field"
            :class="{ 'input-error': !productionPlant.trim() && showValidation }"
            placeholder="Въведете код на производствен завод"
            :disabled="isProcessing"
            @keyup.enter="handleCreate"
            @blur="handlePlantBlur"
            @input="showValidation = false"
          />
          <div 
            v-if="!productionPlant.trim() && showValidation" 
            class="error-message"
          >
            Производствения завод е задължителен
          </div>
        </div>

        <!-- Production Version Combobox -->
        <div class="input-section">
          <label class="input-label" for="productionVersion">
            Производствена версия
            <span v-if="isLoadingVersions" class="loading-text">(зареждане...)</span>
            <span v-else-if="productionVersions.length > 0" class="success-text">({{ productionVersions.length }} намерени)</span>
          </label>
          <select
            id="productionVersion"
            v-model="selectedProductionVersion"
            class="input-field select-field"
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
            v-if="productionVersions.length === 0 && !isLoadingVersions && material.trim() && productionPlant.trim()" 
            class="info-message"
          >
            Няма намерени производствени версии
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
            :disabled="isProcessing"
            @keyup.enter="handleCreate"
            @input="showValidation = false"
          />
          <div 
            v-if="!manufacturingOrderType.trim() && showValidation" 
            class="error-message"
          >
            Типът производствена поръчка е задължителен
          </div>
        </div>

        <div class="input-section">
          <label class="input-label" for="totalQuantity">
            Обща количество <span class="required-asterisk">*</span>
          </label>
          <input
            id="totalQuantity"
            v-model="totalQuantity"
            type="text"
            class="input-field"
            :class="{ 'input-error': !totalQuantity.trim() && showValidation }"
            placeholder="Въведете количество"
            :disabled="isProcessing"
            @keyup.enter="handleCreate"
            @input="showValidation = false"
          />
          <div 
            v-if="!totalQuantity.trim() && showValidation" 
            class="error-message"
          >
            Количеството е задължително
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
                :disabled="isProcessing"
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
                :disabled="isProcessing"
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

        <!-- ZP98 Checkbox Section -->
        <div class="zp98-section">
          <div class="checkbox-wrapper">
            <label class="checkbox-label" :class="{ 'checkbox-disabled': !isZP98Eligible }">
              <input
                v-model="createZP98"
                type="checkbox"
                class="checkbox-input"
                :disabled="isProcessing || !isZP98Eligible"
                @change="handleZP98Toggle"
              />
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">
                Създай ZP98
                <span v-if="!isZP98Eligible" class="eligibility-hint">
                  (достъпно само за материали, започващи с 11)
                </span>
              </span>
            </label>
          </div>

          <div v-if="createZP98" class="zp98-quantity-section">
            <label class="input-label" for="zp98Quantity">
              Количество за ZP98 <span class="required-asterisk">*</span>
            </label>
            <input
              id="zp98Quantity"
              v-model="zp98Quantity"
              type="text"
              class="input-field"
              :class="{ 'input-error': createZP98 && !zp98Quantity.trim() && showValidation }"
              placeholder="Въведете количество за ZP98"
              :disabled="isProcessing"
              @keyup.enter="handleCreate"
              @input="showValidation = false"
            />
            <div 
              v-if="createZP98 && !zp98Quantity.trim() && showValidation" 
              class="error-message"
            >
              Количеството за ZP98 е задължително
            </div>
          </div>
        </div>

        <div v-if="processStatus" class="status-section">
          <div class="status-step" :class="{ 'status-active': processStatus === 'creating' }">
            <span class="status-icon">
              <span v-if="processStatus === 'creating'" class="loading-spinner-small"></span>
              <span v-else-if="['created', 'updating', 'updatingStorage', 'creatingZP98', 'updatingZP98', 'completed'].includes(processStatus)">✓</span>
              <span v-else>1</span>
            </span>
            <span class="status-text">Създаване на основна поръчка</span>
          </div>
          <div class="status-divider"></div>
          <div class="status-step" :class="{ 'status-active': processStatus === 'updating' }">
            <span class="status-icon">
              <span v-if="processStatus === 'updating'" class="loading-spinner-small"></span>
              <span v-else-if="['updatingStorage', 'creatingZP98', 'updatingZP98', 'completed'].includes(processStatus)">✓</span>
              <span v-else>2</span>
            </span>
            <span class="status-text">Актуализиране на датата</span>
          </div>
          <div v-if="createZP98" class="status-divider"></div>
          <div v-if="createZP98" class="status-step" :class="{ 'status-active': processStatus === 'creatingZP98' }">
            <span class="status-icon">
              <span v-if="processStatus === 'creatingZP98'" class="loading-spinner-small"></span>
              <span v-else-if="['updatingZP98', 'completed'].includes(processStatus)">✓</span>
              <span v-else>3</span>
            </span>
            <span class="status-text">Създаване на ZP98</span>
          </div>
          <div v-if="createZP98" class="status-divider"></div>
          <div v-if="createZP98" class="status-step" :class="{ 'status-active': processStatus === 'updatingZP98' }">
            <span class="status-icon">
              <span v-if="processStatus === 'updatingZP98'" class="loading-spinner-small"></span>
              <span v-else-if="processStatus === 'completed'">✓</span>
              <span v-else>4</span>
            </span>
            <span class="status-text">Актуализиране на дата на ZP98</span>
          </div>
          <div v-if="createZP98" class="status-divider"></div>
          <div v-if="createZP98" class="status-step" :class="{ 'status-active': processStatus === 'updatingStorage' }">
            <span class="status-icon">
              <span v-if="processStatus === 'updatingStorage'" class="loading-spinner-small"></span>
              <span v-else-if="['creatingZP98', 'updatingZP98', 'completed'].includes(processStatus)">✓</span>
              <span v-else>5</span>
            </span>
            <span class="status-text">Актуализиране на склад на ZP98</span>
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
              <div class="error-title">Грешка при създаването</div>
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
          class="btn btn-create"
          @click="handleCreate"
          :disabled="isProcessing || !isFormValid"
          :class="{ 'btn-loading': isProcessing }"
        >
          <span v-if="isProcessing" class="loading-spinner"></span>
          <span v-if="isProcessing">{{ processStatusText }}</span>
          <span v-else>Създай</span>
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
}

const props = defineProps<Props>()

// Events
interface Emits {
  'update:visible': [visible: boolean]
  'success': [productionOrder: string]
  'cancel': []
}

const emit = defineEmits<Emits>()

// State
const material = ref('')
const productionPlant = ref('')
const manufacturingOrderType = ref('')
const totalQuantity = ref('')
const scheduledStartDate = ref('')
const scheduledStartTime = ref('')
const displayDate = ref('')
const displayTime = ref('')
const dateFormatError = ref('')
const timeFormatError = ref('')
const isProcessing = ref(false)
const showValidation = ref(false)
const errorMessage = ref('')
const successMessage = ref<{ title: string; details: string } | null>(null)
const processStatus = ref<'' | 'creating' | 'created' | 'updating' | 'updatingStorage' | 'creatingZP98' | 'updatingZP98' | 'completed'>('')
const createdProductionOrder = ref('')
const createdZP98Order = ref('')

// Production Version state
const productionVersions = ref<ProductionVersionDto[]>([])
const selectedProductionVersion = ref<string>('')
const isLoadingVersions = ref(false)

// ZP98 related state
const createZP98 = ref(false)
const zp98Quantity = ref('')

// Computed
const isFormValid = computed(() => {
  const baseFormValid = material.value.trim() !== '' &&
         productionPlant.value.trim() !== '' &&
         manufacturingOrderType.value.trim() !== '' &&
         totalQuantity.value.trim() !== '' &&
         scheduledStartDate.value !== '' &&
         scheduledStartTime.value !== '' &&
         !dateFormatError.value &&
         !timeFormatError.value

  // If ZP98 is checked, also validate ZP98 quantity
  if (createZP98.value) {
    return baseFormValid && zp98Quantity.value.trim() !== ''
  }

  return baseFormValid
})

// Computed property to check if material is eligible for ZP98
const isZP98Eligible = computed(() => {
  return material.value.trim().startsWith('11')
})

const processStatusText = computed(() => {
  switch (processStatus.value) {
    case 'creating':
      return 'Създаване на поръчка...'
    case 'created':
      return 'Поръчката е създадена ✓'
    case 'updating':
      return 'Актуализиране...'
    case 'updatingStorage':
      return 'Актуализиране на склад...'
    case 'creatingZP98':
      return 'Създаване на ZP98...'
    case 'updatingZP98':
      return 'Актуализиране на ZP98...'
    case 'completed':
      return 'Завършено ✓'
    default:
      return 'Създаване...'
  }
})

// Methods
const handleZP98Toggle = () => {
  if (!createZP98.value) {
    // Clear ZP98 quantity when unchecked
    zp98Quantity.value = ''
  }
}

const fetchProductionVersions = async () => {
  // Only fetch if both material and plant are filled
  if (!material.value.trim() || !productionPlant.value.trim()) {
    productionVersions.value = []
    selectedProductionVersion.value = ''
    return
  }

  try {
    isLoadingVersions.value = true
    productionVersions.value = []
    selectedProductionVersion.value = ''

    const versions = await productionOrderService.getProductionVersionsByMaterial(
      material.value.trim(),
      productionPlant.value.trim()
    )

    productionVersions.value = versions

    // Auto-select if only one version exists
    if (versions.length === 1) {
      selectedProductionVersion.value = versions[0].productionVersionNumber.toString()
    }

  } catch (error) {
    console.error('Failed to fetch production versions:', error)
    productionVersions.value = []
    selectedProductionVersion.value = ''
  } finally {
    isLoadingVersions.value = false
  }
}

const handleMaterialBlur = () => {
  if (material.value.trim() && productionPlant.value.trim()) {
    fetchProductionVersions()
  }
}

const handlePlantBlur = () => {
  if (material.value.trim() && productionPlant.value.trim()) {
    fetchProductionVersions()
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
    dateFormatError.value = 'Невалиденден'
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

const handleCreate = async () => {
  if (!isFormValid.value) {
    showValidation.value = true
    return
  }

  try {
    isProcessing.value = true
    errorMessage.value = ''
    successMessage.value = null
    processStatus.value = 'creating'
    
    // Step 1: Create production order with production version
    const createResult = await productionOrderService.createProductionOrder(
      material.value.trim(),
      productionPlant.value.trim(),
      manufacturingOrderType.value.trim(),
      totalQuantity.value.trim(),
      selectedProductionVersion.value || undefined
    )

    if (!createResult.success) {
      throw new Error(createResult.message || 'Неуспешно създаване')
    }

    // Store the created production order number
    createdProductionOrder.value = createResult.productionOrder || ''
    processStatus.value = 'created'

    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))

    // Step 2: Update production order with scheduled date/time
    processStatus.value = 'updating'
    
    const updateResult = await productionOrderService.updateProductionOrder(
      createdProductionOrder.value,
      `${scheduledStartDate.value}T${scheduledStartTime.value}:00`,
      true
    )

    if (!updateResult.success) {
      throw new Error(updateResult.message || 'Неуспешна актуализация')
    }

    // If ZP98 checkbox is checked, create ZP98 order and update its storage location
    if (createZP98.value) {
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Step 3: Create ZP98 production order
      processStatus.value = 'creatingZP98'
      
      const createZP98Result = await productionOrderService.createProductionOrder(
        material.value.trim(),
        productionPlant.value.trim(),
        'ZP98', // Fixed order type for ZP98
        zp98Quantity.value.trim(),
        selectedProductionVersion.value || undefined
      )

      if (!createZP98Result.success) {
        throw new Error(createZP98Result.message || 'Неуспешно създаване на ZP98')
      }

      // Store the created ZP98 order number
      createdZP98Order.value = createZP98Result.productionOrder || ''
      
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 4: Update ZP98 order with the same scheduled date/time
      processStatus.value = 'updatingZP98'
      
      const updateZP98Result = await productionOrderService.updateProductionOrder(
        createdZP98Order.value,
        `${scheduledStartDate.value}T${scheduledStartTime.value}:00`,
        true
      )

      if (!updateZP98Result.success) {
        throw new Error(updateZP98Result.message || 'Неуспешна актуализация на ZP98')
      }

      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Step 5: Update storage location to 2000 for the ZP98 order
      processStatus.value = 'updatingStorage'
      
      const updateStorageResult = await productionOrderService.updateStorageLocation(
        createdZP98Order.value,
        '2000'
      )

      if (!updateStorageResult.success) {
        throw new Error(updateStorageResult.message || 'Неуспешно актуализиране на склад')
      }
    }

    processStatus.value = 'completed'

    // Show success message
    let successDetails = `Производствената поръчка ${createdProductionOrder.value} беше успешно създадена за материал ${material.value} и планирана за ${displayDate.value} в ${displayTime.value} часа.`
    
    if (createZP98.value && createdZP98Order.value) {
      successDetails += ` Склад 2000 беше зададен. Допълнително беше създадена ZP98 поръчка ${createdZP98Order.value} с количество ${zp98Quantity.value}.`
    }

    successMessage.value = {
      title: '🎉 Успешно създаване и планиране!',
      details: successDetails
    }

    // Wait to show success message
    await new Promise(resolve => setTimeout(resolve, 2500))

    // Success - notify parent and close
    emit('success', createdProductionOrder.value)
    emit('update:visible', false)
    resetDialog()

  } catch (error) {
    console.error('Error in handleCreate:', error)
    errorMessage.value = error instanceof Error ? error.message : 'Възникна неочаквана грешка'
    isProcessing.value = false
    processStatus.value = ''
  }
}

const handleCancel = () => {
  if (isProcessing.value) return
  
  emit('cancel')
  emit('update:visible', false)
  resetDialog()
}

const handleOverlayClick = () => {
  if (!isProcessing.value) {
    handleCancel()
  }
}

const resetDialog = () => {
  material.value = ''
  productionPlant.value = ''
  manufacturingOrderType.value = ''
  totalQuantity.value = ''
  scheduledStartDate.value = ''
  scheduledStartTime.value = ''
  displayDate.value = ''
  displayTime.value = ''
  dateFormatError.value = ''
  timeFormatError.value = ''
  isProcessing.value = false
  showValidation.value = false
  errorMessage.value = ''
  successMessage.value = null
  processStatus.value = ''
  createdProductionOrder.value = ''
  createdZP98Order.value = ''
  createZP98.value = false
  zp98Quantity.value = ''
  productionVersions.value = []
  selectedProductionVersion.value = ''
  isLoadingVersions.value = false
}

const setProcessingState = (state: boolean) => {
  isProcessing.value = state
}

const setErrorMessage = (message: string) => {
  errorMessage.value = message
  isProcessing.value = false
  processStatus.value = ''
}

// Watch for material changes and auto-clear ZP98 if not eligible
watch(material, (newMaterial) => {
  if (!newMaterial.trim().startsWith('11') && createZP98.value) {
    createZP98.value = false
    zp98Quantity.value = ''
  }
})

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
    // Focus the input field after the dialog is shown
    nextTick(() => {
      const input = document.getElementById('material')
      input?.focus()
    })
  }
})

// Expose methods for parent component
defineExpose({
  setProcessingState,
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
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
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

/* ZP98 Section Styles */
.zp98-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.checkbox-wrapper {
  margin-bottom: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 600;
  color: #374151;
  gap: 0.75rem;
}

.checkbox-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.checkbox-disabled .checkbox-text {
  color: #6b7280;
}

.eligibility-hint {
  font-size: 0.8rem;
  font-weight: normal;
  color: #6b7280;
  font-style: italic;
  margin-left: 0.5rem;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: white;
}

.checkbox-input:checked + .checkbox-custom {
  background: #10b981;
  border-color: #10b981;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 0.875rem;
  font-weight: bold;
}

.checkbox-input:disabled + .checkbox-custom {
  background: #f3f4f6;
  border-color: #d1d5db;
  cursor: not-allowed;
}

.checkbox-text {
  font-size: 0.95rem;
}

.zp98-quantity-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

/* Status Section */
.status-section {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.status-step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.status-active {
  color: #10b981;
  font-weight: 600;
}

.status-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  color: #6b7280;
}

.status-active .status-icon {
  background: #10b981;
  color: white;
}

.status-text {
  font-size: 0.9rem;
}

.status-divider {
  height: 20px;
  width: 2px;
  background: #e5e7eb;
  margin-left: 11px;
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Success Section */
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
  margin-bottom: 0.25rem;
}

.success-details {
  color: #047857;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Error Section */
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

/* Footer */
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

.btn-create {
  background: #10b981;
  color: white;
  border: 2px solid #10b981;
}

.btn-create:hover:not(:disabled) {
  background: #059669;
  border-color: #059669;
}

.btn-create:disabled {
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

/* Responsive */
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
}
</style>