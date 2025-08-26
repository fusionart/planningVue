<!-- DateRangeSelector.vue -->
<template>
  <div class="api-parameters-section">
    <h3>Времеви период</h3>
    <div class="parameters-grid">
      <div class="parameter-group-datepicker">
        <label for="dateFromPicker">Дата от</label>
        <DatePicker
          id="dateFromPicker"
          :model-value="dateFrom"
          @update:model-value="updateDateFrom"
          dateFormat="dd.mm.yy"
          :firstDayOfWeek="1"
          :showWeek="true"
          :manualInput="true"
          placeholder="Изберете начална дата"
          class="parameter-datepicker"
          :class="{ 'p-invalid': dateFromError }"
          @date-select="onDateFromSelect"
          @blur="validateDateFrom"
          showButtonBar
          :showIcon="true"
          locale="bg"
        />
      </div>

      <div class="parameter-group-datepicker">
        <label for="dateToPicker">Дата до</label>
        <DatePicker
          id="dateToPicker"
          :model-value="dateTo"
          @update:model-value="updateDateTo"
          dateFormat="dd.mm.yy"
          :firstDayOfWeek="1"
          :showWeek="true"
          :manualInput="true"
          placeholder="Изберете крайна дата"
          class="parameter-datepicker"
          :class="{ 'p-invalid': dateToError }"
          @date-select="onDateToSelect"
          @blur="validateDateTo"
          showButtonBar
          :showIcon="true"
          locale="bg"
        />
      </div>

      <div class="parameter-actions">
        <button 
          class="btn btn-primary" 
          @click="handleLoadData" 
          :disabled="loading || hasDateErrors"
        >
          {{ loading ? 'Зареждане...' : '📊 Зареди' }}
        </button>
      </div>
    </div>
    
    <!-- Date validation errors -->
    <div v-if="hasDateErrors" class="date-errors">
      <div v-if="dateFromError" class="date-error">
        <i class="pi pi-exclamation-triangle"></i>
        {{ dateFromError }}
      </div>
      <div v-if="dateToError" class="date-error">
        <i class="pi pi-exclamation-triangle"></i>
        {{ dateToError }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import DatePicker from 'primevue/datepicker'

// Props
interface Props {
  dateFrom: Date | null
  dateTo: Date | null
  loading: boolean
}

const props = defineProps<Props>()

// Events
interface Emits {
  'update:dateFrom': [date: Date | null]
  'update:dateTo': [date: Date | null]
  'load-data': []
}

const emit = defineEmits<Emits>()

// Local state
const dateFromError = ref('')
const dateToError = ref('')

// Computed
const hasDateErrors = computed(() => {
  return !!(dateFromError.value || dateToError.value)
})

// Methods
const updateDateFrom = (date: Date | null) => {
  emit('update:dateFrom', date)
}

const updateDateTo = (date: Date | null) => {
  emit('update:dateTo', date)
}

const validateDateFrom = () => {
  dateFromError.value = ''
  
  if (!props.dateFrom) {
    dateFromError.value = 'Началната дата е задължителна'
    return
  }
  
  if (props.dateTo && props.dateFrom > props.dateTo) {
    dateFromError.value = 'Началната дата не може да бъде след крайната дата'
  }
}

const validateDateTo = () => {
  dateToError.value = ''
  
  if (!props.dateTo) {
    dateToError.value = 'Крайната дата е задължителна'
    return
  }
  
  if (props.dateFrom && props.dateTo < props.dateFrom) {
    dateToError.value = 'Крайната дата не може да бъде преди началната дата'
  }
}

const onDateFromSelect = () => {
  validateDateFrom()
  if (props.dateTo) {
    validateDateTo()
  }
}

const onDateToSelect = () => {
  validateDateTo()
  if (props.dateFrom) {
    validateDateFrom()
  }
}

const handleLoadData = () => {
  if (!props.dateFrom || !props.dateTo) {
    validateDateFrom()
    validateDateTo()
    return
  }

  if (hasDateErrors.value) {
    return
  }

  emit('load-data')
}

// Watchers
watch(() => props.dateFrom, validateDateFrom)
watch(() => props.dateTo, validateDateTo)
</script>

<style scoped>
@import '@/styles/components/SalesOrders/DateRangeSelector.css';
</style>