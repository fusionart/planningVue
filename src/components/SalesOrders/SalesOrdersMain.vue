<!-- SalesOrdersMain.vue - Complete with Production Orders Integration -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { useSalesOrders } from '@/composables/useSalesOrders'
import { useSalesOrdersTable } from '@/composables/useSalesOrdersTable'
import { salesOrderService } from '@/services/salesOrderService'
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

const handlePageChange = (page: number) => {
  goToPage(page)
}

// Escape key handler for modals
const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    // Close modals in priority order
    if (productionOrdersModalVisible.value) {
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
  credentialsModalVisible.value = false
})
</script>

<style scoped>
@import '@/styles/components/SalesOrders/SalesOrdersMain.css';
</style>