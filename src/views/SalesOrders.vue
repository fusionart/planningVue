<!-- src/views/SalesOrders.vue - COMPLETE file for SalesOrderByDate model -->
<template>
  <div class="sales-orders">
    <div class="page-header">
      <h2 class="page-title">Клиентски поръчки по заявена дата на доставка</h2>
      <div class="header-actions">
        <button 
          class="btn" 
          :class="hasCredentials ? 'btn-success' : 'btn-warning'"
          @click="showCredentialsModal = true"
        >
          {{ hasCredentials ? '🔐 Актуализация на идентификационни данни' : '🔓 Въведете идентификационни данни' }}
        </button>
      </div>
    </div>

    <!-- Credentials Required Notice -->
    <div v-if="!hasCredentials && !showCredentialsModal" class="credentials-notice">
      <div class="notice-content">
        <div class="notice-icon">🔐</div>
        <div class="notice-text">
          <h3>SAP изискват се идентификационни данни</h3>
          <p>Моля въведете вашите потребителско име и парола за SAP.</p>
        </div>
        <button class="btn btn-primary" @click="showCredentialsModal = true">
          Въведнете потребител и парола
        </button>
      </div>
    </div>

    <!-- Credentials Modal -->
    <div v-if="showCredentialsModal" class="modal-overlay" @click="closeCredentialsModal">
      <div class="modal credentials-modal" @click.stop>
        <div class="modal-header">
          <h3>SAP API идентификационни данни</h3>
          <button class="modal-close" @click="closeCredentialsModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="credentials-info">
            <p>Моля въведете вашите потребителско име и парола за SAP</p>
          </div>

          <div class="form-group">
            <label for="username">Потребителско име:</label>
            <input
              id="username"
              v-model="credentialsForm.username"
              type="text"
              placeholder="Въведете SAP потребител"
              class="form-input"
              :disabled="savingCredentials"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Парола:</label>
            <input
              id="password"
              v-model="credentialsForm.password"
              type="password"
              placeholder="Въведете SAP парола"
              class="form-input"
              :disabled="savingCredentials"
            />
          </div>

          <div v-if="credentialsError" class="credentials-error">
            {{ credentialsError }}
          </div>
          
          <div class="form-actions">
            <button 
              class="btn btn-secondary" 
              @click="closeCredentialsModal"
              :disabled="savingCredentials"
            >
              Отказ
            </button>
            <button 
              class="btn btn-primary" 
              @click="saveCredentials"
              :disabled="!credentialsForm.username || !credentialsForm.password || savingCredentials"
            >
              {{ savingCredentials ? 'Запазване...' : 'Запази' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- API Parameters Section - Only show if credentials are available -->
    <div v-if="hasCredentials" class="api-parameters-section">
      <h3>Времеви период</h3>
      <div class="parameters-grid">
        <div class="parameter-group">
          <label for="dateFrom">Дата от</label>
          <input
            id="dateFrom"
            v-model="apiDateFrom"
            type="datetime-local"
            class="parameter-input"
          />
        </div>

        <div class="parameter-group">
          <label for="dateTo">Дата до</label>
          <input
            id="dateTo"
            v-model="apiDateTo"
            type="datetime-local"
            class="parameter-input"
          />
        </div>

        <div class="parameter-actions">
          <button class="btn btn-primary" @click="loadDataFromAPI" :disabled="loading">
            {{ loading ? 'Loading...' : '📊 Зареди' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading sales orders by delivery week from SAP...</p>
      <p class="loading-sub">This may take a moment...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="error-state">
      <div class="error-icon">❌</div>
      <p class="error-message">{{ error }}</p>
      <div class="error-actions">
        <button class="btn btn-primary" @click="clearError">
          Dismiss
        </button>
        <button class="btn btn-secondary" @click="showCredentialsModal = true">
          Check Credentials
        </button>
        <button class="btn btn-secondary" @click="clearCredentialsAndReload">
          Clear Credentials
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="isEmpty && hasCredentials" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>No sales orders found for the selected date range.</p>
      <p class="empty-sub">Try adjusting the date range or load data for a different period.</p>
      <button class="btn btn-primary" @click="loadDataFromAPIWithCurrentMonth">
        Load Current Month
      </button>
    </div>

    <!-- Delivery Week Tabs and DataTables -->
    <div v-else-if="hasData" class="table-container">
      <div class="table-header">
        <h3>Батерии за седмица {{ activeWeekData.reqDlvWeek }} - {{ activeWeekData.salesOrderMainList.length }} записа</h3>
        <div class="table-info">
          <span class="data-range">
            Дати: {{ formatDateDisplay(apiDateFrom) }} - {{ formatDateDisplay(apiDateTo) }}
          </span>
        </div>
      </div>

      <!-- Delivery Week Tabs -->
      <div v-if="salesOrdersByDate.length > 0" class="delivery-week-tabs">
        <div class="tabs-navigation">
          <nav class="tabs-nav">
            <button
              v-for="(weekData, index) in salesOrdersByDate"
              :key="weekData.reqDlvWeek"
              @click="setActiveWeekTab(weekData.reqDlvWeek, index)"
              :class="[
                'tab-button',
                activeWeekTab === weekData.reqDlvWeek ? 'tab-active' : 'tab-inactive'
              ]"
            >
              <div class="tab-content">
                <span class="tab-label">{{ weekData.reqDlvWeek }}</span>
                <span class="tab-count">
                  {{ weekData.salesOrderMainList.length }} записа
                </span>
              </div>
            </button>
          </nav>
        </div>
      </div>
      
      <!-- DataTables Component for Active Week -->
      <div v-if="activeWeekData" class="week-table-container">        
        <DataTable
          ref="dataTable"
          :data="activeWeekData.salesOrderMainList"
          :columns="columns"
          :options="tableOptions"
          class="sales-orders-datatable"
          :key="activeWeekTab"
        />
      </div>
    </div>

    <!-- Order Details Modal -->
    <div v-if="selectedOrder" class="modal-overlay" @click="closeModal">
      <div class="modal order-details-modal" @click.stop>
        <div class="modal-header">
          <h3>Sales Order Item Details</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="order-details">
            <div class="detail-group">
              <label>Material:</label>
              <span class="detail-value">{{ selectedOrder.material }}</span>
            </div>
            
            <div class="detail-group">
              <label>Plant:</label>
              <span class="detail-value">{{ selectedOrder.plant }}</span>
            </div>
            
            <div class="detail-group">
              <label>Requested Quantity:</label>
              <span class="detail-value">{{ selectedOrder.requestedQuantity }} {{ selectedOrder.requestedQuantityUnit }}</span>
            </div>
            
            <div class="detail-group">
              <label>Available Not Charged:</label>
              <span class="detail-value">{{ selectedOrder.availableNotCharged }}</span>
            </div>
            
            <div class="detail-group">
              <label>Available Charged:</label>
              <span class="detail-value">{{ selectedOrder.availableCharged }}</span>
            </div>

            <div class="detail-group">
              <label>Quantity Unit:</label>
              <span class="detail-value">{{ selectedOrder.requestedQuantityUnit }}</span>
            </div>
          </div>

          <!-- Availability Status -->
          <div class="availability-status">
            <h4>Availability Analysis</h4>
            <div class="availability-grid">
              <div class="availability-item">
                <span class="availability-label">Total Available:</span>
                <span class="availability-value">{{ getTotalAvailable(selectedOrder) }}</span>
              </div>
              <div class="availability-item">
                <span class="availability-label">Fulfillment Rate:</span>
                <span class="availability-value">{{ getFulfillmentRate(selectedOrder) }}%</span>
              </div>
              <div class="availability-item">
                <span class="availability-label">Status:</span>
                <span 
                  class="status-badge" 
                  :class="getAvailabilityStatusClass(selectedOrder)"
                >
                  {{ getAvailabilityStatus(selectedOrder) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Dynamic SO Items -->
          <div v-if="selectedOrder.dynamicSoItems && Object.keys(selectedOrder.dynamicSoItems).length > 0" class="dynamic-so-items">
            <h4>Dynamic Sales Order Items</h4>
            <div class="dynamic-items-grid">
              <div
                v-for="(item, key) in selectedOrder.dynamicSoItems"
                :key="key"
                class="dynamic-item-card"
              >
                <div class="dynamic-item-header">
                  <span class="dynamic-item-key">{{ key }}</span>
                </div>
                <div class="dynamic-item-details">
                  <div class="dynamic-item-row" v-if="item.quantity">
                    <span class="dynamic-item-label">Quantity:</span>
                    <span class="dynamic-item-value">{{ item.quantity }}</span>
                  </div>
                  <div class="dynamic-item-row" v-if="item.plannedOrder">
                    <span class="dynamic-item-label">Planned Order:</span>
                    <span class="dynamic-item-value">{{ item.plannedOrder }}</span>
                  </div>
                  <div class="dynamic-item-row" v-if="item.productionOrder">
                    <span class="dynamic-item-label">Production Order:</span>
                    <span class="dynamic-item-value">{{ item.productionOrder }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSalesOrders } from '@/composables/useSalesOrders'
import { salesOrderService } from '@/services/salesOrderService'
import DataTable from 'datatables.net-vue3'
import DataTablesCore from 'datatables.net'
import 'datatables.net-dt'
import type { SalesOrderMain, SalesOrderByDate } from '@/types/api'

// Register DataTables components
DataTable.use(DataTablesCore)

const {
  salesOrdersByDate,
  allSalesOrders,
  loading,
  error,
  pagination,
  filters,
  hasData,
  hasError,
  isEmpty,
  applyFilters,
  clearFilters,
  clearError,
  nextPage,
  prevPage,
  setCredentials,
  clearCredentials,
  fetchSalesOrders,
  formatDateForBackend
} = useSalesOrders()

// Component state
const selectedOrder = ref<SalesOrderMain | null>(null)
const showCredentialsModal = ref(false)
const savingCredentials = ref(false)
const credentialsError = ref('')
const credentialsForm = ref({
  username: '',
  password: ''
})
const dataTable = ref()

// API parameters (separate from table filters)
const apiDateFrom = ref('')
const apiDateTo = ref('')

// Delivery week tabs state
const activeWeekTab = ref<string>('')
const activeWeekIndex = ref<number>(0)

// Check if credentials are available
const hasCredentials = computed(() => {
  return salesOrderService.hasCredentials()
})

// Get total items count across all weeks
const totalItemsCount = computed(() => {
  return salesOrdersByDate.value.reduce((total, weekData) => 
    total + weekData.salesOrderMainList.length, 0)
})

// Get active week data
const activeWeekData = computed(() => {
  if (!salesOrdersByDate.value.length || !activeWeekTab.value) {
    return salesOrdersByDate.value[0] || null
  }
  return salesOrdersByDate.value.find(weekData => weekData.reqDlvWeek === activeWeekTab.value) || null
})

// Set active week tab
const setActiveWeekTab = (weekName: string, index: number) => {
  activeWeekTab.value = weekName
  activeWeekIndex.value = index
  
  // Force DataTable to refresh with new data
  if (dataTable.value?.dt && activeWeekData.value) {
    dataTable.value.dt.clear()
    dataTable.value.dt.rows.add(activeWeekData.value.salesOrderMainList)
    dataTable.value.dt.draw()
  }
}

// Watch for data changes to set first tab as active
watch(salesOrdersByDate, (newData) => {
  if (newData.length > 0 && !activeWeekTab.value) {
    setActiveWeekTab(newData[0].reqDlvWeek, 0)
  }
}, { deep: true })

// Helper functions for availability calculations
const getTotalAvailable = (order: SalesOrderMain) => {
  return order.availableNotCharged + order.availableCharged
}

const getFulfillmentRate = (order: SalesOrderMain) => {
  const total = getTotalAvailable(order)
  if (order.requestedQuantity === 0) return 0
  return Math.round((total / order.requestedQuantity) * 100)
}

const getAvailabilityStatus = (order: SalesOrderMain) => {
  const rate = getFulfillmentRate(order)
  if (rate >= 100) return 'Full'
  if (rate >= 50) return 'Partial'
  return 'Low'
}

const getAvailabilityStatusClass = (order: SalesOrderMain) => {
  const status = getAvailabilityStatus(order)
  switch (status) {
    case 'Full': return 'status-success'
    case 'Partial': return 'status-warning'
    case 'Low': return 'status-error'
    default: return 'status-warning'
  }
}

// DataTables configuration
const columns = [
  {
    title: 'Material',
    data: 'material',
    className: 'font-semibold'
  },
  {
    title: 'Plant',
    data: 'plant'
  },
  {
    title: 'Requested Qty',
    data: 'requestedQuantity',
    render: (data: number, type: string, row: SalesOrderMain) => {
      return `${data} ${row.requestedQuantityUnit}`
    }
  },
  {
    title: 'Available Not Charged',
    data: 'availableNotCharged',
    render: (data: number) => data.toLocaleString()
  },
  {
    title: 'Available Charged',
    data: 'availableCharged',
    render: (data: number) => data.toLocaleString()
  },
  {
    title: 'Actions',
    data: null,
    orderable: false,
    searchable: false,
    render: (data: any, type: string, row: SalesOrderMain) => {
      return '<button class="btn-icon view-order" title="View Details">👁️</button>'
    }
  }
]

const tableOptions = {
  responsive: true,
  pageLength: 15,
  lengthChange: true,
  lengthMenu: [10, 15, 25, 50, 100],
  searching: true,
  ordering: true,
  info: true,
  autoWidth: false,
  language: {
    search: 'Search items in this week:',
    lengthMenu: 'Show _MENU_ items per page',
    info: 'Showing _START_ to _END_ of _TOTAL_ items',
    infoEmpty: 'No items available',
    infoFiltered: '(filtered from _MAX_ total items)',
    paginate: {
      first: 'First',
      last: 'Last',
      next: 'Next',
      previous: 'Previous'
    }
  },
  drawCallback: () => {
    // Re-attach event listeners after table redraw
    setTimeout(() => {
      attachActionListeners()
    }, 0)
  }
}

// Attach event listeners to action buttons
const attachActionListeners = () => {
  const viewButtons = document.querySelectorAll('.view-order')
  viewButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const tr = target.closest('tr')
      if (tr && dataTable.value?.dt) {
        const rowData = dataTable.value.dt.row(tr).data() as SalesOrderMain
        viewOrder(rowData)
      }
    })
  })
}

// Initialize date inputs with current month
const initializeDateInputs = () => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  
  apiDateFrom.value = formatDateTimeLocal(startOfMonth)
  apiDateTo.value = formatDateTimeLocal(endOfMonth)
}

// Format date for datetime-local input
const formatDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Format datetime-local input for display
const formatDateDisplay = (datetimeLocal: string) => {
  if (!datetimeLocal) return ''
  try {
    const date = new Date(datetimeLocal)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return datetimeLocal
  }
}

// Load data from API with proper date conversion
const loadDataFromAPI = async () => {
  if (!apiDateFrom.value || !apiDateTo.value) {
    alert('Please select both date from and date to')
    return
  }

  try {
    // Convert datetime-local values to proper format for backend
    const startDate = new Date(apiDateFrom.value)
    const endDate = new Date(apiDateTo.value)
    
    // Set the API date filters using the backend format
    filters.reqDelDateBegin = formatDateForBackend(startDate)
    filters.reqDelDateEnd = formatDateForBackend(endDate)
    
    console.log('🔍 Setting date filters:', {
      fromInput: apiDateFrom.value,
      toInput: apiDateTo.value,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      backendFormat: {
        begin: filters.reqDelDateBegin,
        end: filters.reqDelDateEnd
      }
    })
    
    // Clear table filters
    filters.material = ''
    filters.plant = ''
    
    // Reset pagination
    pagination.page = 0
    
    // Reset active week tab
    activeWeekTab.value = ''
    activeWeekIndex.value = 0
    
    // Fetch data
    await fetchSalesOrders()
  } catch (error) {
    console.error('❌ Error in loadDataFromAPI:', error)
    alert('Error loading data: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

// Set current month and load data
const loadDataFromAPIWithCurrentMonth = async () => {
  initializeDateInputs()
  await loadDataFromAPI()
}

// View order details
const viewOrder = (order: SalesOrderMain) => {
  selectedOrder.value = order
}

// Close order details modal
const closeModal = () => {
  selectedOrder.value = null
}

// Save credentials (no validation, just save)
const saveCredentials = async () => {
  if (!credentialsForm.value.username || !credentialsForm.value.password) {
    credentialsError.value = 'Both username and password are required'
    return
  }

  savingCredentials.value = true
  credentialsError.value = ''

  try {
    // Just save the credentials without testing
    setCredentials(credentialsForm.value.username, credentialsForm.value.password)
    closeCredentialsModal()
    
    // Initialize date inputs and show success
    initializeDateInputs()
    console.log('✅ Credentials saved successfully')
    
  } catch (error) {
    credentialsError.value = error instanceof Error ? error.message : 'Failed to save credentials'
  } finally {
    savingCredentials.value = false
  }
}

// Close credentials modal
const closeCredentialsModal = () => {
  showCredentialsModal.value = false
  credentialsForm.value = { username: '', password: '' }
  credentialsError.value = ''
  savingCredentials.value = false
}

// Clear credentials and reload
const clearCredentialsAndReload = () => {
  clearCredentials()
  clearError()
  showCredentialsModal.value = true
}

// Initialize component
onMounted(() => {
  console.log('🔍 Available salesOrderService methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(salesOrderService)))
  initializeDateInputs()
  
  // Don't auto-load data, wait for user to click "Load Data"
  if (!hasCredentials.value) {
    showCredentialsModal.value = true
  }
})
</script>

<style scoped>
@import '@/styles/views/SalesOrder.css';

/* Delivery Week Tabs Styling */
.delivery-week-tabs {
  margin-bottom: 5px;
  background: var(--background-card);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
  padding: 5px;
}

.tabs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tabs-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
}

.tabs-navigation {
  border-bottom: 1px solid var(--border-light);
}

.tabs-nav {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 2px;
  margin-bottom: -1px;
}

.tab-button {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;
  min-width: fit-content;
  white-space: nowrap;
}

.tab-inactive {
  color: var(--text-secondary);
  background: var(--background-secondary);
}

.tab-inactive:hover {
  color: var(--text-primary);
  background: var(--background-hover, #f8f9fa);
  border-bottom-color: var(--border-light);
}

.tab-active {
  color: var(--color-primary);
  background: var(--background-card);
  border-bottom-color: var(--color-primary);
  font-weight: 600;
}

.tab-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.tab-label {
  font-size: 14px;
  font-weight: inherit;
}

.tab-count {
  font-size: 11px;
  opacity: 0.8;
  font-weight: 400;
}

/* Week Table Container - WITH MORE SPACE */
.week-table-container {
  background: var(--background-card);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  /* margin-top: 32px; */
}

.week-table-header {
  /* padding: 20px; */
  background: var(--background-secondary);
  border-bottom: 1px solid var(--border-light);
}

.week-table-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
}

/* Dynamic SO Items Styling */
.dynamic-so-items {
  border-top: 1px solid var(--border-light);
  padding-top: 20px;
  margin-top: 20px;
}

.dynamic-so-items h4 {
  margin: 0 0 16px 0;
  color: var(--text-primary);
  font-size: 16px;
}

.dynamic-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.dynamic-item-card {
  background: var(--background-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
  padding: 16px;
}

.dynamic-item-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-light);
}

.dynamic-item-key {
  font-weight: 600;
  color: var(--color-primary);
  font-size: 14px;
}

.dynamic-item-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dynamic-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dynamic-item-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dynamic-item-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

/* Availability Status Styles */
.availability-status {
  border-top: 1px solid var(--border-light);
  padding-top: 20px;
  margin-top: 20px;
}

.availability-status h4 {
  margin: 0 0 16px 0;
  color: var(--text-primary);
  font-size: 16px;
}

.availability-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.availability-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
}

.availability-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.availability-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

/* Status badge variants */
.status-error {
  background: var(--color-error);
  color: white;
}

/* DataTables styling */
.sales-orders-datatable {
  width: 100% !important;
}

:deep(.dataTables_wrapper) {
  padding: 20px;
}

:deep(.dataTables_length),
:deep(.dataTables_filter) {
  margin-bottom: 20px;
}

:deep(.dataTables_length label),
:deep(.dataTables_filter label) {
  color: var(--text-primary);
  font-weight: 500;
}

:deep(.dataTables_length select),
:deep(.dataTables_filter input) {
  padding: 8px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-sm);
  background: var(--background-secondary);
  color: var(--text-primary);
  margin-left: 8px;
}

:deep(.dataTables_info) {
  color: var(--text-secondary);
  padding-top: 16px;
}

:deep(.dataTables_paginate) {
  padding-top: 16px;
}

:deep(.dataTables_paginate .paginate_button) {
  padding: 8px 16px;
  margin-left: 4px;
  background: var(--background-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-sm);
  color: var(--text-primary);
  text-decoration: none;
  transition: var(--transition-fast);
}

:deep(.dataTables_paginate .paginate_button:hover) {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

:deep(.dataTables_paginate .paginate_button.current) {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

:deep(.dataTables_paginate .paginate_button.disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

:deep(.dataTables_paginate .paginate_button.disabled:hover) {
  background: var(--background-secondary);
  color: var(--text-primary);
  border-color: var(--border-light);
}

:deep(table.dataTable) {
  width: 100% !important;
  border-collapse: collapse;
}

:deep(table.dataTable thead th) {
  background: var(--background-secondary);
  color: var(--text-primary);
  font-weight: 600;
  padding: 12px 16px;
  border-bottom: 2px solid var(--border-light);
  text-align: left;
}

:deep(table.dataTable tbody td) {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
}

:deep(table.dataTable tbody tr:hover) {
  background: var(--background-secondary);
}

:deep(.status-badge) {
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

:deep(.status-success) {
  background: var(--color-success);
  color: white;
}

:deep(.status-warning) {
  background: var(--color-warning);
  color: white;
}

:deep(.btn-icon) {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  transition: var(--transition-fast);
}

:deep(.btn-icon:hover) {
  background: var(--background-secondary);
}

:deep(.font-semibold) {
  font-weight: 600;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .delivery-week-tabs {
    padding: 15px;
  }
  
  .tabs-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .tabs-nav {
    gap: 2px;
  }
  
  .tab-button {
    padding: 10px 12px;
  }
  
  .tab-label {
    font-size: 13px;
  }
  
  .tab-count {
    font-size: 10px;
  }

  .availability-grid,
  .dynamic-items-grid {
    grid-template-columns: 1fr;
  }

  :deep(.dataTables_wrapper) {
    padding: 15px;
  }
  
  :deep(.dataTables_length),
  :deep(.dataTables_filter) {
    margin-bottom: 15px;
  }
  
  :deep(table.dataTable thead th),
  :deep(table.dataTable tbody td) {
    padding: 8px 12px;
    font-size: 14px;
  }

  .dynamic-item-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .week-table-container {
    margin-top: 24px; /* Reduced spacing on mobile */
  }
  
  .week-table-header {
    padding: 16px; /* Reduced padding on mobile */
  }
}
</style>