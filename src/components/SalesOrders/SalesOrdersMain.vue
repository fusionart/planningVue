<!-- SalesOrdersMain.vue - Updated with CreateProductionOrderDialog -->
<template>
  <div class="sales-orders" :key="componentKey">
    <!-- Page Header -->
    <div class="page-header">
      <h2 class="page-title">Клиентски поръчки по заявена дата на доставка</h2>
      <div class="header-actions">
        <button 
          class="btn" 
          :class="hasCredentials ? 'btn-success' : 'btn-warning'"
          @click.stop="handleCredentialsButtonClick"
          type="button"
        >
          {{ hasCredentials ? '🔐 Актуализация на идентификационни данни' : '🔓 Въведете идентификационни данни' }}
        </button>
        
        <!-- Create Production Order Button -->
        <button 
          v-if="hasCredentials"
          class="btn btn-primary" 
          @click.stop="handleCreateProductionOrderClick"
          type="button"
        >
          ➕ Създаване на производствена поръчка
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

    <!-- Loading States Component (without empty state) -->
    <LoadingStates
      :hasCredentials="hasCredentials"
      :showCredentialsModal="credentialsModalVisible"
      :localCredentialsState="localCredentialsState"
      :loading="loading"
      :hasError="hasError"
      :error="error"
      :isEmpty="false"
      @show-credentials="credentialsModalVisible = true"
      @clear-error="clearError"
      @clear-credentials="handleClearCredentials"
      @load-current-month="handleLoadCurrentMonth"
    />

    <!-- Date Range Selector -->
    <DateRangeSelector
      v-if="hasCredentials || localCredentialsState"
      v-model:dateFrom="apiDateFromDate"
      v-model:dateTo="apiDateToDate"
      :loading="loading"
      @load-data="handleLoadData"
    />

    <!-- Empty State - Now positioned below date picker -->
    <div v-if="isEmpty && (hasCredentials || localCredentialsState) && !loading && !hasError" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>No sales orders found for the selected date range.</p>
      <p class="empty-sub">Try adjusting the date range or load data for a different period.</p>
      <button class="btn btn-primary" @click="handleLoadCurrentMonth">
        Load Current Month
      </button>
    </div>

    <!-- Main Data Display -->
    <div v-if="hasData" class="data-display">
      <!-- Weekly Tabs -->
      <WeeklyTabs
        :weekData="sortedSalesOrdersByDate"
        :activeWeek="activeWeekTab"
        :dateFrom="apiDateFromDate"
        :dateTo="apiDateToDate"
        @tab-change="handleTabChange"
      />

      <!-- Table Section -->
      <div v-if="activeWeekData?.salesOrderMainList.length > 0" class="table-section">
        <!-- Table Controls -->
        <TableControls
          :plants="availablePlants"
          v-model:selectedPlant="selectedPlant"
          v-model:searchValue="globalFilterValue"
          v-model:rowsPerPage="rows"
        />

        <!-- Sales Orders Table -->
        <SalesOrdersTable
          :data="paginatedData"
          :allFilteredData="sortedAndFilteredData"
          :dynamicColumns="dynamicColumnKeys"
          :sortColumn="sortColumn"
          :sortDirection="sortDirection"
          @sort="handleSort"
          @row-click="handleRowClick"
          @material-click="handleMaterialClick"
          @planned-order-click="handlePlannedOrderClick"
        />

        <!-- Pagination -->
        <TablePagination
          :currentPage="currentPage"
          :totalPages="totalPages"
          :totalRecords="filteredDataLength"
          :startRecord="paginationDisplay.start"
          :endRecord="paginationDisplay.end"
          :globalFilter="globalFilterValue"
          :totalDataLength="activeWeekData.salesOrderMainList.length"
          @page-change="handlePageChange"
        />
      </div>

      <!-- No data for active week -->
      <div v-else-if="activeWeekData" class="no-data-message">
        <p>No data available for week {{ activeWeekData.reqDlvWeek }}</p>
      </div>
    </div>

    <!-- Order Details Modal -->
    <OrderDetailsModal
      :order="selectedOrder"
      @close="handleCloseModal"
    />

    <!-- Production Orders Modal -->
    <ProductionOrdersModal
      :show="productionOrdersModalVisible"
      :material="selectedMaterial"
      :dateFrom="apiDateFromDate"
      :dateTo="apiDateToDate"
      @close="handleCloseProductionOrdersModal"
    />

    <!-- Planned Order Conversion Dialog -->
    <PlannedOrderConversionDialog
      :visible="showPlannedOrderConversionDialog"
      :plannedOrder="selectedPlannedOrderForConversion"
      :material="selectedMaterialForConversion"
      @update:visible="handleConversionDialogVisibility"
      @success="handlePlannedOrderConversionSuccess"
      @cancel="closePlannedOrderConversionDialog"
    />

    <!-- Create Production Order Dialog -->
    <CreateProductionOrderDialog
      :visible="createProductionOrderDialogVisible"
      @update:visible="handleCreateProductionOrderDialogVisibility"
      @success="handleCreateProductionOrderSuccess"
      @cancel="closeCreateProductionOrderDialog"
    />

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
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { useSalesOrders } from '@/composables/useSalesOrders'
import { useSalesOrdersTable } from '@/composables/useSalesOrdersTable'
import { salesOrderService } from '@/services/salesOrderService'
import { productionOrderService } from '@/services/productionOrderService'
import type { SalesOrderMain } from '@/types/api'

// Import child components
import CredentialsModal from './CredentialsModal.vue'
import DateRangeSelector from './DateRangeSelector.vue'
import WeeklyTabs from './WeeklyTabs.vue'
import TableControls from './TableControls.vue'
import SalesOrdersTable from './SalesOrdersTable.vue'
import TablePagination from './TablePagination.vue'
import OrderDetailsModal from './OrderDetailsModal.vue'
import ProductionOrdersModal from './ProductionOrdersModal.vue'
import PlannedOrderConversionDialog from './PlannedOrderConversionDialog.vue'
import CreateProductionOrderDialog from './CreateProductionOrderDialog.vue'
import LoadingStates from './LoadingStates.vue'

// Main composables
const {
  salesOrdersByDate,
  loading,
  error,
  pagination,
  filters: salesOrderFilters,
  hasData,
  hasError,
  isEmpty,
  clearError,
  setCredentials,
  clearCredentials,
  fetchSalesOrders,
  formatDateForBackend
} = useSalesOrders()

// Initialize refs first before passing to composable
const currentPage = ref(1)
const rows = ref(10)

// Table composable
const {
  // State
  globalFilterValue,
  sortColumn,
  sortDirection,
  selectedPlant,
  activeWeekTab,
  activeWeekIndex,
  
  // Computed
  sortedSalesOrdersByDate,
  activeWeekData,
  dynamicColumnKeys,
  availablePlants,
  sortedAndFilteredData,
  totalPages,
  filteredDataLength,
  paginatedData,
  paginationDisplay,
  
  // Methods
  sortBy,
  goToPage,
  setActiveWeekTab,
  applyPlantFilter
} = useSalesOrdersTable(salesOrdersByDate, currentPage, rows)

// Component state
const selectedOrder = ref<SalesOrderMain | null>(null)
const selectedMaterial = ref('')
const productionOrdersModalVisible = ref(false)
const credentialsModalVisible = ref(false)
const savingCredentials = ref(false)
const credentialsError = ref('')
const componentKey = ref(0)
const localCredentialsState = ref(false)

// Planned order conversion state
const showPlannedOrderConversionDialog = ref(false)
const selectedPlannedOrderForConversion = ref('')
const selectedMaterialForConversion = ref('')

// Create production order state
const createProductionOrderDialogVisible = ref(false)

// Toast state
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

// API date state
const apiDateFromDate = ref<Date | null>(null)
const apiDateToDate = ref<Date | null>(null)

// Computed
const hasCredentials = computed(() => {
  return salesOrderService.hasCredentials() || localCredentialsState.value
})

const isDevelopment = computed(() => {
  return process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost'
})

// Methods
const forceRerender = () => {
  componentKey.value++
}

const initializeDateInputs = () => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  apiDateFromDate.value = startOfMonth
  apiDateToDate.value = endOfMonth
}

const showSuccessToast = (message: string) => {
  toastMessage.value = message
  toastType.value = 'success'
  showToast.value = true
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    showToast.value = false
  }, 5000)
}

const showErrorToast = (message: string) => {
  toastMessage.value = message
  toastType.value = 'error'
  showToast.value = true
  
  // Auto-hide after 7 seconds for errors
  setTimeout(() => {
    showToast.value = false
  }, 7000)
}

// Event handlers
const handleCredentialsButtonClick = () => {
  credentialsModalVisible.value = true
}

const handleSaveCredentials = async (credentials: { username: string, password: string }) => {
  savingCredentials.value = true
  credentialsError.value = ''

  try {
    setCredentials(credentials.username, credentials.password)
    localCredentialsState.value = true
    
    await nextTick()
    forceRerender()
    
    credentialsModalVisible.value = false
    credentialsError.value = ''
    initializeDateInputs()
    
  } catch (error) {
    console.error('❌ Error saving credentials:', error)
    credentialsError.value = error instanceof Error ? error.message : 'Failed to save credentials'
    localCredentialsState.value = false
    credentialsModalVisible.value = true
  } finally {
    savingCredentials.value = false
  }
}

const handleCloseCredentialsModal = () => {
  credentialsModalVisible.value = false
  credentialsError.value = ''
  savingCredentials.value = false
}

const handleClearCredentials = () => {
  clearCredentials()
  localCredentialsState.value = false
  clearError()
  credentialsModalVisible.value = true
}

const handleLoadData = async () => {
  if (!apiDateFromDate.value || !apiDateToDate.value) return

  try {
    salesOrderFilters.reqDelDateBegin = formatDateForBackend(apiDateFromDate.value)
    salesOrderFilters.reqDelDateEnd = formatDateForBackend(apiDateToDate.value)
    
    salesOrderFilters.material = ''
    salesOrderFilters.plant = ''
    pagination.page = 0
    
    // Reset table state
    activeWeekTab.value = ''
    activeWeekIndex.value = 0
    globalFilterValue.value = ''
    currentPage.value = 1
    sortColumn.value = ''
    sortDirection.value = 'asc'
    
    await fetchSalesOrders()
  } catch (error) {
    console.error('❌ Error in loadDataFromAPI:', error)
    alert('Error loading data: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

const handleLoadCurrentMonth = async () => {
  initializeDateInputs()
  await handleLoadData()
}

const handleTabChange = (weekName: string, index: number) => {
  setActiveWeekTab(weekName, index)
}

const handleSort = (column: string) => {
  sortBy(column)
}

const handleRowClick = (order: SalesOrderMain) => {
  selectedOrder.value = order
  // Prevent body scroll when modal opens
  document.body.classList.add('modal-open')
}

const handleCloseModal = () => {
  selectedOrder.value = null
  // Re-enable body scroll when modal closes
  document.body.classList.remove('modal-open')
}

const handleMaterialClick = (material: string) => {
  console.log(`🔍 Material clicked: ${material}`)
  
  // Validate that we have the required date range
  if (!apiDateFromDate.value || !apiDateToDate.value) {
    console.warn('⚠️ Date range not available for production orders lookup')
    alert('Моля, първо изберете период от датите за да видите производствените поръчки.')
    return
  }

  // Check if we have credentials
  if (!salesOrderService.hasCredentials() && !localCredentialsState.value) {
    console.warn('⚠️ No credentials available for production orders lookup')
    alert('Моля, първо въведете идентификационни данни.')
    credentialsModalVisible.value = true
    return
  }

  selectedMaterial.value = material
  productionOrdersModalVisible.value = true
  
  // Prevent body scroll when modal opens
  document.body.classList.add('modal-open')
  
  console.log(`✅ Opening production orders modal for material: ${material}`)
}

const handleCloseProductionOrdersModal = () => {
  productionOrdersModalVisible.value = false
  selectedMaterial.value = ''
  // Re-enable body scroll when modal closes
  document.body.classList.remove('modal-open')
  
  console.log('✅ Production orders modal closed')
}

// Handle planned order clicks
const handlePlannedOrderClick = (plannedOrder: string, material: string) => {
  console.log(`🔄 Planned order clicked in parent: ${plannedOrder} for material: ${material}`)
  
  // Validate that we have credentials
  if (!salesOrderService.hasCredentials() && !localCredentialsState.value) {
    console.warn('⚠️ No credentials available for planned order conversion')
    alert('Моля, първо въведете идентификационни данни.')
    credentialsModalVisible.value = true
    return
  }

  // Set the selected planned order and material
  selectedPlannedOrderForConversion.value = plannedOrder
  selectedMaterialForConversion.value = material
  
  // Open the conversion dialog
  showPlannedOrderConversionDialog.value = true
  
  // Prevent body scroll when modal opens
  document.body.classList.add('modal-open')
  
  console.log(`✅ Opening planned order conversion dialog for: ${plannedOrder}`)
}

const handleConversionDialogVisibility = (visible: boolean) => {
  if (!visible) {
    closePlannedOrderConversionDialog()
  }
}

const handlePlannedOrderConversionSuccess = () => {
  console.log('✅ Planned order conversion successful')
  
  showSuccessToast('Планираната поръчка беше успешно конвертирана и планирана')
  
  // Close the dialog after short delay
  setTimeout(() => {
    closePlannedOrderConversionDialog()
  }, 1500)
  
  // Refresh data after successful conversion
  handleLoadData()
}

const closePlannedOrderConversionDialog = () => {
  showPlannedOrderConversionDialog.value = false
  selectedPlannedOrderForConversion.value = ''
  selectedMaterialForConversion.value = ''
  
  // Re-enable body scroll when modal closes
  document.body.classList.remove('modal-open')
  
  console.log('✅ Planned order conversion dialog closed')
}

// Handle create production order
const handleCreateProductionOrderClick = () => {
  // Validate credentials
  if (!salesOrderService.hasCredentials() && !localCredentialsState.value) {
    console.warn('⚠️ No credentials available for creating production order')
    alert('Моля, първо въведете идентификационни данни.')
    credentialsModalVisible.value = true
    return
  }

  createProductionOrderDialogVisible.value = true
  // Prevent body scroll when modal opens
  document.body.classList.add('modal-open')
  
  console.log('✅ Opening create production order dialog')
}

const handleCreateProductionOrderDialogVisibility = (visible: boolean) => {
  if (!visible) {
    closeCreateProductionOrderDialog()
  }
}

const handleCreateProductionOrderSuccess = (productionOrder: string) => {
  console.log(`✅ Production order ${productionOrder} created and scheduled successfully`)
  
  showSuccessToast(`Производствената поръчка ${productionOrder} беше успешно създадена и планирана`)
  
  // Close the dialog after short delay
  setTimeout(() => {
    closeCreateProductionOrderDialog()
  }, 1500)
  
  // Refresh data
  handleLoadData()
}

const closeCreateProductionOrderDialog = () => {
  createProductionOrderDialogVisible.value = false
  
  // Re-enable body scroll when modal closes
  document.body.classList.remove('modal-open')
  
  console.log('✅ Create production order dialog closed')
}

const handlePageChange = (page: number) => {
  goToPage(page)
}

// Escape key handler for modals
const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    // Close modals in priority order
    if (createProductionOrderDialogVisible.value) {
      closeCreateProductionOrderDialog()
    } else if (showPlannedOrderConversionDialog.value) {
      closePlannedOrderConversionDialog()
    } else if (productionOrdersModalVisible.value) {
      handleCloseProductionOrdersModal()
    } else if (selectedOrder.value) {
      handleCloseModal()
    } else if (credentialsModalVisible.value) {
      handleCloseCredentialsModal()
    }
  }
}

// Watchers
watch(salesOrdersByDate, (newData) => {
  if (newData.length > 0 && !activeWeekTab.value) {
    setActiveWeekTab(newData[0].reqDlvWeek, 0)
  }
}, { deep: true })

// Watch for modal state changes to ensure proper cleanup
watch(productionOrdersModalVisible, (isVisible) => {
  if (isVisible) {
    console.log(`🔍 Production orders modal opened for material: ${selectedMaterial.value}`)
  } else {
    console.log('✅ Production orders modal closed')
    selectedMaterial.value = ''
  }
})

// Initialize
onMounted(() => {
  console.log('📋 SalesOrdersMain component mounted')
  
  const initialHasCredentials = salesOrderService.hasCredentials()
  localCredentialsState.value = initialHasCredentials
  
  if (!initialHasCredentials) {
    console.log('🔓 No credentials found, showing credentials modal')
    credentialsModalVisible.value = true
  } else {
    console.log('🔐 Credentials found, initializing date inputs')
    initializeDateInputs()
  }

  // Add escape key listener
  document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  console.log('📋 SalesOrdersMain component unmounted')
  
  // Clean up event listener and body classes
  document.removeEventListener('keydown', handleEscapeKey)
  document.body.classList.remove('modal-open')
  
  // Clean up any remaining state
  selectedOrder.value = null
  selectedMaterial.value = ''
  productionOrdersModalVisible.value = false
  showPlannedOrderConversionDialog.value = false
  selectedPlannedOrderForConversion.value = ''
  selectedMaterialForConversion.value = ''
  credentialsModalVisible.value = false
  createProductionOrderDialogVisible.value = false
})
</script>

<style scoped>
@import '@/styles/components/SalesOrders/SalesOrdersMain.css';

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

/* Responsive design for toast */
@media (max-width: 640px) {
  .toast {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
}
</style>