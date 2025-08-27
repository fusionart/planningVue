<!-- SalesOrdersMain.vue - Refactored main component -->
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

    <!-- Loading States Component -->
    <LoadingStates
      :hasCredentials="hasCredentials"
      :showCredentialsModal="credentialsModalVisible"
      :localCredentialsState="localCredentialsState"
      :loading="loading"
      :hasError="hasError"
      :error="error"
      :isEmpty="isEmpty"
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
          :dynamicColumns="dynamicColumnKeys"
          :sortColumn="sortColumn"
          :sortDirection="sortDirection"
          @sort="handleSort"
          @row-click="handleRowClick"
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
      @close="selectedOrder = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
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

// Component state - renamed to avoid conflicts
const selectedOrder = ref<SalesOrderMain | null>(null)
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
}

const handlePageChange = (page: number) => {
  goToPage(page)
}


// Watchers
watch(salesOrdersByDate, (newData) => {
  if (newData.length > 0 && !activeWeekTab.value) {
    setActiveWeekTab(newData[0].reqDlvWeek, 0)
  }
}, { deep: true })

// Initialize
onMounted(() => {
  const initialHasCredentials = salesOrderService.hasCredentials()
  localCredentialsState.value = initialHasCredentials
  
  if (!initialHasCredentials) {
    credentialsModalVisible.value = true
  } else {
    initializeDateInputs()
  }
})
</script>

<style scoped>
@import '@/styles/components/SalesOrders/SalesOrdersMain.css';
</style>