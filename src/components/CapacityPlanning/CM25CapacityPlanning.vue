<!-- CM25CapacityPlanning.vue -->
<template>
  <div class="cm25-wrapper">
    <!-- Page Header -->
    <div class="page-header">
      <h2 class="page-title">CM25 - Capacity Planning</h2>
      <div class="header-actions">
        <button 
          class="btn" 
          :class="hasCredentials ? 'btn-success' : 'btn-warning'"
          @click="handleCredentialsButtonClick"
          type="button"
        >
          {{ hasCredentials ? '🔐 Update Credentials' : '🔓 Enter Credentials' }}
        </button>
      </div>
    </div>

    <!-- Credentials Modal -->
    <CredentialsModal
      :show="credentialsModalVisible"
      :saving="savingCredentials"
      :error="credentialsError"
      @save="handleSaveCredentials"
      @close="handleCloseCredentialsModal"
    />

    <!-- Date Range Selector -->
    <div v-if="hasCredentials" class="date-range-section">
      <div class="date-inputs">
        <div class="input-group">
          <label for="dateFrom">Date From:</label>
          <input
            id="dateFrom"
            type="date"
            v-model="dateFromInput"
            :disabled="loading"
            class="date-input"
          />
        </div>
        <div class="input-group">
          <label for="dateTo">Date To:</label>
          <input
            id="dateTo"
            type="date"
            v-model="dateToInput"
            :disabled="loading"
            class="date-input"
          />
        </div>
        <div class="input-group">
          <label for="supervisor">Production Supervisor:</label>
          <select
            id="supervisor"
            v-model="selectedSupervisor"
            :disabled="loading || loadingSupervisors"
            class="supervisor-select"
          >
            <option value="">{{ loadingSupervisors ? 'Loading supervisors...' : '-- Select Supervisor --' }}</option>
            <option 
              v-for="supervisor in productionSupervisors"
              :key="supervisor.supervisor"
              :value="supervisor.supervisor"
            >
              {{ supervisor.supervisor }} - {{ supervisor.supervisorName }} ({{ supervisor.plant }})
            </option>
          </select>
        </div>
        <button 
          class="btn btn-primary"
          @click="handleLoadData"
          :disabled="loading || !dateFromInput || !dateToInput || !selectedSupervisor"
          type="button"
        >
          {{ loading ? 'Loading...' : '📊 Load Data' }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading production orders...</p>
    </div>

    <!-- Error State -->
    <div v-if="error && !loading" class="error-state">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button class="btn btn-primary" @click="clearError">
        Dismiss
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="!hasData && !loading && !error && hasCredentials" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>No production orders found</p>
      <p class="empty-sub">Select a date range and click "Load Data" to view capacity planning.</p>
    </div>

    <!-- Main Content -->
    <div v-if="hasData && !loading" class="cm25-container">
      <WorkCentersTable 
        :work-centers="workCenters"
        :current-date="currentDateDisplay"
        :timeline="timeline"
        :capacity-allocations="capacityAllocations"
        :scroll-left="timelineScrollLeft"
        @navigate-prev="navigatePrev"
        @navigate-next="navigateNext"
        @work-center-click="handleWorkCenterClick"
        @timeline-scroll="handleTimelineScroll"
      />

      <DispatchedOrdersTable 
        :orders="dispatchedOrders"
        :current-date="currentDateDisplay"
        :timeline="timeline"
        :scroll-left="timelineScrollLeft"
        @navigate-prev="navigatePrev"
        @navigate-next="navigateNext"
        @order-click="handleOrderClick"
        @material-click="handleMaterialClick"
        @work-center-click="handleWorkCenterClick"
        @timeline-scroll="handleTimelineScroll"
      />

      <PoolOrdersTable 
        :orders="poolOrders"
        :current-date="currentDateDisplay"
        :timeline="timeline"
        :scroll-left="timelineScrollLeft"
        @navigate-prev="navigatePrev"
        @navigate-next="navigateNext"
        @order-click="handleOrderClick"
        @material-click="handleMaterialClick"
        @work-center-click="handleWorkCenterClick"
        @timeline-scroll="handleTimelineScroll"
      />
    </div>

    <!-- Success/Error Toast -->
    <div 
      v-if="showToast && toastMessage"
      class="toast"
      :class="{ 
        'toast-success': toastType === 'success',
        'toast-error': toastType === 'error'
      }"
    >
      <div class="toast-content">
        <span class="toast-icon">
          {{ toastType === 'success' ? '✅' : '❌' }}
        </span>
        <span class="toast-message">{{ toastMessage }}</span>
        <button 
          class="toast-close"
          @click="showToast = false"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { salesOrderService } from '@/services/salesOrderService'
import { productionOrderService, type ProductionOrderDto, type PlannedOrderDto, type WorkCenter } from '@/services/productionOrderService'
import WorkCentersTable from './WorkCentersTable.vue'
import DispatchedOrdersTable from './DispatchedOrdersTable.vue'
import PoolOrdersTable from './PoolOrdersTable.vue'
import CredentialsModal from '@/components/SalesOrders/CredentialsModal.vue'

// State
const loading = ref(false)
const error = ref('')
const hasData = ref(false)

// Credentials state
const credentialsModalVisible = ref(false)
const savingCredentials = ref(false)
const credentialsError = ref('')
const localCredentialsState = ref(false)

// Toast state
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

// Date picker state
const dateFromInput = ref('')
const dateToInput = ref('')

// Production supervisor state
const productionSupervisors = ref<Array<{ plant: string; supervisor: string; supervisorName: string }>>([])
const selectedSupervisor = ref('')
const loadingSupervisors = ref(false)

// Data state
const productionOrders = ref<ProductionOrderDto[]>([])
const plannedOrders = ref<PlannedOrderDto[]>([])
const workCenters = ref<Array<{
  id: string
  capacityCategory: string
  description: string
  capacityDescription: string
  numIndividualCapacity: number
}>>([])
const loadingWorkCenters = ref(false)

const dispatchedOrders = ref([])
const poolOrders = ref([])
const capacityAllocations = ref([])


// Scroll synchronization state
const timelineScrollLeft = ref(0)

// Handle timeline scroll from any table
const handleTimelineScroll = (scrollLeft: number) => {
  timelineScrollLeft.value = scrollLeft
}
// Computed
const hasCredentials = computed(() => {
  return salesOrderService.hasCredentials() || localCredentialsState.value
})

// Generate current date display for the header
const currentDateDisplay = computed(() => {
  if (!dateFromInput.value || !dateToInput.value) {
    return ''
  }
  
  const startDate = parseInputDate(dateFromInput.value)
  const endDate = parseInputDate(dateToInput.value)
  
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  }
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
})

// Generate timeline based on date picker range
const timeline = computed(() => {
  const result = []
  
  // If no dates selected, return empty timeline
  if (!dateFromInput.value || !dateToInput.value) {
    return result
  }
  
  const startDate = parseInputDate(dateFromInput.value)
  const endDate = parseInputDate(dateToInput.value)
  
  // Generate timeline for each day in the range
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const day = currentDate.getDate().toString().padStart(2, '0')
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    
    // Generate 24 hours for each day
    for (let hour = 0; hour < 24; hour++) {
      result.push({
        day: day,
        month: month,
        hour: hour.toString().padStart(2, '0'),
        key: `${month}-${day}-${hour.toString().padStart(2, '0')}`,
        fullDate: new Date(currentDate)
      })
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return result
})

// Methods
const initializeDateInputs = () => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  dateFromInput.value = formatDateForInput(startOfMonth)
  dateToInput.value = formatDateForInput(endOfMonth)
}

const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const loadProductionSupervisors = async () => {
  try {
    loadingSupervisors.value = true
    console.log('🔍 Loading production supervisors...')
    
    const supervisors = await productionOrderService.getProductionSupervisors()
    productionSupervisors.value = supervisors
    
    console.log('✅ Production supervisors loaded:', supervisors)
    
    // Auto-select first supervisor if available
    if (supervisors.length > 0) {
      selectedSupervisor.value = supervisors[0].supervisor
      console.log('✅ Auto-selected supervisor:', supervisors[0].supervisorName)
      
      // Load work centers for the selected supervisor
      await loadWorkCenters(supervisors[0].supervisor)
    }
  } catch (error) {
    console.error('❌ Failed to load production supervisors:', error)
    showErrorToast('Failed to load production supervisors')
  } finally {
    loadingSupervisors.value = false
  }
}

const loadWorkCenters = async (supervisor: string) => {
  try {
    loadingWorkCenters.value = true
    console.log('🔍 Loading work centers for supervisor:', supervisor)
    
    const centers = await productionOrderService.getWorkCentersByProductionSupervisor(supervisor)
    
    // Transform to match the expected format
    workCenters.value = centers.map(wc => ({
      id: wc.workCenter,
      capacityCategory: '001', // Default value, can be fetched from backend if available
      description: wc.description,
      capacityDescription: '',
      numIndividualCapacity: 1
    }))
    
    console.log('✅ Work centers loaded:', workCenters.value)
  } catch (error) {
    console.error('❌ Failed to load work centers:', error)
    showErrorToast('Failed to load work centers')
    workCenters.value = [] // Clear work centers on error
  } finally {
    loadingWorkCenters.value = false
  }
}

const parseInputDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const extractDayFromDate = (dateString: string): number => {
  // Parse date string like "2025-10-24" or "24.10.2025"
  let day: number
  
  if (dateString.includes('-')) {
    day = parseInt(dateString.split('-')[2], 10)
  } else if (dateString.includes('.')) {
    day = parseInt(dateString.split('.')[0], 10)
  } else {
    day = 1
  }
  
  return day
}

const calculateDurationHours = (startTime: string, endTime: string): number => {
  // Simple calculation - can be enhanced
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)
  const diffMs = end.getTime() - start.getTime()
  return Math.round(diffMs / (1000 * 60 * 60))
}

const transformProductionOrdersToCapacityData = (orders: ProductionOrderDto[]) => {
  // Transform to dispatched orders - these are scheduled orders (orderIsScheduled = true)
  dispatchedOrders.value = orders
    .filter(order => order.orderIsScheduled)
    .map(order => {
      const startDay = extractDayFromDate(order.mfgOrderScheduledStartDate)
      const startHour = parseInt(order.mfgOrderScheduledStartTime.split(':')[0], 10)
      const endHour = parseInt(order.mfgOrderScheduledEndTime.split(':')[0], 10)
      const durationHours = endHour - startHour || 1
      
      return {
        orderNo: order.productionOrder,
        material: order.material,
        materialDescription: order.materialDescription,
        startDate: order.mfgOrderScheduledStartDate,
        workCenter: order.workCenter,
        startDay,
        startHour,
        durationHours,
        label: order.material.substring(0, 15),
        type: 'production' // Add type identifier
      }
    })

  // Build capacity allocations
  capacityAllocations.value = dispatchedOrders.value.map(order => ({
    workCenterId: order.workCenter,
    startDay: order.startDay,
    startHour: order.startHour,
    durationHours: order.durationHours,
    label: order.label,
    description: order.materialDescription
  }))

  // Pool orders - orders not yet scheduled (orderIsScheduled = false)
  poolOrders.value = orders
    .filter(order => !order.orderIsScheduled)
    .map(order => ({
      orderNo: order.productionOrder,
      material: order.material,
      materialDescription: order.materialDescription,
      startDate: order.mfgOrderScheduledStartDate || 'N/A',
      workCenter: order.workCenter || 'N/A',
      operations: 1,
      highlighted: false,
      type: 'production' // Add type identifier
    }))
  
  console.log('📊 Data transformation complete:', {
    totalOrders: orders.length,
    dispatchedOrders: dispatchedOrders.value.length,
    poolOrders: poolOrders.value.length,
    workCenters: workCenters.value.length
  })
}

// NEW: Transform both production orders and planned orders
const transformAllOrdersToCapacityData = (prodOrders: ProductionOrderDto[], plannedOrders: PlannedOrderDto[]) => {
  // Transform production orders - scheduled ones (orderIsScheduled = true)
  const dispatchedProdOrders = prodOrders
    .filter(order => order.orderIsScheduled)
    .map(order => {
      const startDay = extractDayFromDate(order.mfgOrderScheduledStartDate)
      const startHour = parseInt(order.mfgOrderScheduledStartTime.split(':')[0], 10)
      const endHour = parseInt(order.mfgOrderScheduledEndTime.split(':')[0], 10)
      const durationHours = endHour - startHour || 1
      
      return {
        orderNo: order.productionOrder,
        material: order.material,
        materialDescription: order.materialDescription,
        startDate: order.mfgOrderScheduledStartDate,
        workCenter: order.workCenter,
        startDay,
        startHour,
        durationHours,
        label: order.material.substring(0, 15),
        type: 'production' // Production order
      }
    })

  // Transform planned orders - dispatched ones (plannedOrderCapacityIsDsptchd = true)
  const dispatchedPlannedOrders = plannedOrders
    .filter(order => order.plannedOrderCapacityIsDsptchd)
    .map(order => {
      const startDay = extractDayFromDate(order.plndOrderPlannedStartDate)
      const startHour = parseInt(order.plndOrderPlannedStartTime.split(':')[0], 10)
      const endHour = parseInt(order.plndOrderPlannedEndTime.split(':')[0], 10)
      const durationHours = endHour - startHour || 1
      
      return {
        orderNo: order.plannedOrder,
        material: order.material,
        materialDescription: order.description || order.material, // Use actual description
        startDate: order.plndOrderPlannedStartDate,
        workCenter: order.workCenter,
        startDay,
        startHour,
        durationHours,
        label: order.material.substring(0, 15),
        type: 'planned' // Planned order
      }
    })

  // Combine all dispatched orders
  dispatchedOrders.value = [...dispatchedProdOrders, ...dispatchedPlannedOrders]

  // Build capacity allocations from all dispatched orders
  capacityAllocations.value = dispatchedOrders.value.map(order => ({
    workCenterId: order.workCenter,
    startDay: order.startDay,
    startHour: order.startHour,
    durationHours: order.durationHours,
    label: order.label,
    description: order.materialDescription
  }))

  // Pool orders - unscheduled production orders
  const poolProdOrders = prodOrders
    .filter(order => !order.orderIsScheduled)
    .map(order => ({
      orderNo: order.productionOrder,
      material: order.material,
      materialDescription: order.materialDescription,
      startDate: order.mfgOrderScheduledStartDate || 'N/A',
      workCenter: order.workCenter || 'N/A',
      operations: 1,
      highlighted: false,
      type: 'production'
    }))

  // Pool orders - un-dispatched planned orders
  const poolPlannedOrders = plannedOrders
    .filter(order => !order.plannedOrderCapacityIsDsptchd)
    .map(order => ({
      orderNo: order.plannedOrder,
      material: order.material,
      materialDescription: order.description || order.material, // Use actual description
      startDate: order.plndOrderPlannedStartDate || 'N/A',
      workCenter: order.workCenter || 'N/A',
      operations: 1,
      highlighted: false,
      type: 'planned'
    }))

  // Combine all pool orders
  poolOrders.value = [...poolProdOrders, ...poolPlannedOrders]
  
  console.log('📊 Combined data transformation complete:', {
    totalProductionOrders: prodOrders.length,
    totalPlannedOrders: plannedOrders.length,
    dispatchedOrders: dispatchedOrders.value.length,
    poolOrders: poolOrders.value.length,
    workCenters: workCenters.value.length
  })
}

const handleLoadData = async () => {
  if (!dateFromInput.value || !dateToInput.value) {
    showErrorToast('Please select both start and end dates')
    return
  }

  if (!selectedSupervisor.value) {
    showErrorToast('Please select a production supervisor')
    return
  }

  if (!hasCredentials.value) {
    credentialsModalVisible.value = true
    return
  }

  loading.value = true
  error.value = ''

  try {
    const dateFrom = parseInputDate(dateFromInput.value)
    const dateTo = parseInputDate(dateToInput.value)

    console.log('📊 Loading orders for supervisor:', {
      supervisor: selectedSupervisor.value,
      dateFrom,
      dateTo
    })

    // Load work centers first
    await loadWorkCenters(selectedSupervisor.value)

    // Load both production orders and planned orders in parallel
    const [prodOrders, plndOrders] = await Promise.all([
      productionOrderService.getProductionOrdersByProductionSupervisor(
        selectedSupervisor.value,
        dateFrom,
        dateTo
      ),
      productionOrderService.getPlannedOrdersByProductionSupervisor(
        selectedSupervisor.value,
        dateFrom,
        dateTo
      )
    ])

    console.log(`✅ Loaded ${prodOrders.length} production orders and ${plndOrders.length} planned orders`)
    
    productionOrders.value = prodOrders
    plannedOrders.value = plndOrders
    
    // Transform data even if there are no orders (will show empty tables with work centers)
    transformAllOrdersToCapacityData(prodOrders, plndOrders)
    
    // Always show the tables when Load Data is clicked
    hasData.value = true

    const totalOrders = prodOrders.length + plndOrders.length
    if (totalOrders === 0) {
      showSuccessToast('Work centers loaded. No orders found for the selected criteria.')
    } else {
      showSuccessToast(`Loaded ${prodOrders.length} production orders and ${plndOrders.length} planned orders`)
    }

  } catch (err) {
    console.error('❌ Error loading orders:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load orders'
    showErrorToast(error.value)
    hasData.value = false
  } finally {
    loading.value = false
  }
}

const clearError = () => {
  error.value = ''
}

// Credentials handlers
const handleCredentialsButtonClick = () => {
  credentialsModalVisible.value = true
}

const handleSaveCredentials = async (credentials: { username: string; password: string }) => {
  savingCredentials.value = true
  credentialsError.value = ''

  try {
    salesOrderService.setCredentials(credentials.username, credentials.password)
    localCredentialsState.value = true
    
    credentialsModalVisible.value = false
    credentialsError.value = ''
    initializeDateInputs()
    
    // Load production supervisors after credentials are set
    await loadProductionSupervisors()
    
    showSuccessToast('Credentials saved successfully')
  } catch (error) {
    console.error('❌ Error saving credentials:', error)
    credentialsError.value = error instanceof Error ? error.message : 'Failed to save credentials'
    localCredentialsState.value = false
  } finally {
    savingCredentials.value = false
  }
}

const handleCloseCredentialsModal = () => {
  credentialsModalVisible.value = false
  credentialsError.value = ''
  savingCredentials.value = false
}

// Toast methods
const showSuccessToast = (message: string) => {
  toastMessage.value = message
  toastType.value = 'success'
  showToast.value = true
  
  setTimeout(() => {
    showToast.value = false
  }, 5000)
}

const showErrorToast = (message: string) => {
  toastMessage.value = message
  toastType.value = 'error'
  showToast.value = true
  
  setTimeout(() => {
    showToast.value = false
  }, 7000)
}

// Event handlers
const navigatePrev = () => {
  console.log('Navigate to previous period')
  // TODO: Implement timeline navigation
}

const navigateNext = () => {
  console.log('Navigate to next period')
  // TODO: Implement timeline navigation
}

const handleWorkCenterClick = (workCenterId: string) => {
  console.log('Work center clicked:', workCenterId)
  // TODO: Show work center details
}

const handleOrderClick = (orderNo: string) => {
  console.log('Order clicked:', orderNo)
  // TODO: Show order details
}

const handleMaterialClick = (material: string) => {
  console.log('Material clicked:', material)
  // TODO: Show material details
}

// Initialize
onMounted(() => {
  console.log('📋 CM25 Capacity Planning mounted')
  
  const initialHasCredentials = salesOrderService.hasCredentials()
  localCredentialsState.value = initialHasCredentials
  
  if (!initialHasCredentials) {
    console.log('🔓 No credentials found, showing credentials modal')
    credentialsModalVisible.value = true
  } else {
    console.log('🔐 Credentials found, initializing date inputs and loading supervisors')
    initializeDateInputs()
    loadProductionSupervisors()
  }
})

// Watch for supervisor changes to load corresponding work centers
watch(selectedSupervisor, async (newSupervisor, oldSupervisor) => {
  if (newSupervisor && newSupervisor !== oldSupervisor) {
    console.log('👁️ Supervisor changed, loading work centers for:', newSupervisor)
    await loadWorkCenters(newSupervisor)
    
    // Clear orders when supervisor changes (user needs to click Load Data again)
    dispatchedOrders.value = []
    poolOrders.value = []
    capacityAllocations.value = []
    productionOrders.value = []
    hasData.value = false
  }
})
</script>

<style scoped>
.cm25-wrapper {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.page-header {
  background: white;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}

.date-range-section {
  background: white;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.date-inputs {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.date-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  min-width: 150px;
}

.date-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.date-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.supervisor-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  min-width: 200px;
  background: white;
  cursor: pointer;
  color: #000000;
}

.supervisor-select option {
  color: #000000;
}

.supervisor-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.supervisor-select:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
  color: #6b7280;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon,
.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-sub,
.error-message {
  color: #6b7280;
  margin-top: 0.5rem;
}

.cm25-container {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
  font-family: Arial, sans-serif;
  font-size: 11px;
  overflow: hidden;
}

/* Toast styles */
.toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 1002;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(4px);
  animation: slideIn 0.3s ease-out;
  max-width: 400px;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-success {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border: 1px solid #22c55e;
  color: #15803d;
}

.toast-error {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  border: 1px solid #ef4444;
  color: #dc2626;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toast-icon {
  font-size: 1.25rem;
}

.toast-message {
  font-weight: 600;
  flex: 1;
}

.toast-close {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.toast-close:hover {
  opacity: 1;
}

@media (max-width: 640px) {
  .date-inputs {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toast {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
}
</style>