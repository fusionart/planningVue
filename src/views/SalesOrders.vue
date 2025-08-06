<!-- src/views/SalesOrders.vue - Updated with DataTables and Delivery Week Tabs -->
<template>
  <div class="sales-orders">
    <div class="page-header">
      <h2 class="page-title">Sales Orders</h2>
      <div class="header-actions">
        <button 
          class="btn" 
          :class="hasCredentials ? 'btn-success' : 'btn-warning'"
          @click="showCredentialsModal = true"
        >
          {{ hasCredentials ? '🔐 Update Credentials' : '🔓 Enter Credentials' }}
        </button>
      </div>
    </div>

    <!-- Credentials Required Notice -->
    <div v-if="!hasCredentials && !showCredentialsModal" class="credentials-notice">
      <div class="notice-content">
        <div class="notice-icon">🔐</div>
        <div class="notice-text">
          <h3>SAP Credentials Required</h3>
          <p>Please provide your SAP username and password to access sales orders data.</p>
        </div>
        <button class="btn btn-primary" @click="showCredentialsModal = true">
          Enter Credentials
        </button>
      </div>
    </div>

    <!-- Credentials Modal -->
    <div v-if="showCredentialsModal" class="modal-overlay" @click="closeCredentialsModal">
      <div class="modal credentials-modal" @click.stop>
        <div class="modal-header">
          <h3>SAP API Credentials</h3>
          <button class="modal-close" @click="closeCredentialsModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="credentials-info">
            <p>Enter your SAP system credentials. They will be stored securely and used for API requests.</p>
          </div>

          <div class="form-group">
            <label for="username">Username:</label>
            <input
              id="username"
              v-model="credentialsForm.username"
              type="text"
              placeholder="Enter SAP username"
              class="form-input"
              :disabled="savingCredentials"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password:</label>
            <input
              id="password"
              v-model="credentialsForm.password"
              type="password"
              placeholder="Enter SAP password"
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
              Cancel
            </button>
            <button 
              class="btn btn-primary" 
              @click="saveCredentials"
              :disabled="!credentialsForm.username || !credentialsForm.password || savingCredentials"
            >
              {{ savingCredentials ? 'Saving...' : 'Save Credentials' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- API Parameters Section - Only show if credentials are available -->
    <div v-if="hasCredentials" class="api-parameters-section">
      <h3>Load Data Parameters</h3>
      <div class="parameters-grid">
        <div class="parameter-group">
          <label for="dateFrom">Date From</label>
          <input
            id="dateFrom"
            v-model="apiDateFrom"
            type="datetime-local"
            class="parameter-input"
          />
        </div>

        <div class="parameter-group">
          <label for="dateTo">Date To</label>
          <input
            id="dateTo"
            v-model="apiDateTo"
            type="datetime-local"
            class="parameter-input"
          />
        </div>

        <div class="parameter-actions">
          <button class="btn btn-primary" @click="loadDataFromAPI" :disabled="loading">
            {{ loading ? 'Loading...' : '📊 Load Data' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading sales orders from SAP...</p>
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

    <!-- Delivery Week Tabs and DataTables Sales Orders Table -->
    <div v-else-if="hasData" class="table-container">
      <div class="table-header">
        <h3>Sales Orders ({{ salesOrders.length }})</h3>
        <div class="table-info">
          <span class="data-range">
            Data: {{ formatDateDisplay(apiDateFrom) }} - {{ formatDateDisplay(apiDateTo) }}
          </span>
        </div>
      </div>

      <!-- Delivery Week Tabs -->
      <div v-if="deliveryWeeks.length > 0" class="delivery-week-tabs">
        <div class="tabs-header">
          <h4>Filter by Delivery Week</h4>
        </div>
        <div class="tabs-navigation">
          <nav class="tabs-nav">
            <!-- All Tab (always first) -->
            <button
              @click="clearWeekFilter"
              :class="[
                'tab-button',
                !activeWeekTab ? 'tab-active' : 'tab-inactive'
              ]"
            >
              <div class="tab-content">
                <span class="tab-label">All</span>
                <span class="tab-count">
                  {{ salesOrders.length }} orders
                </span>
              </div>
            </button>
            
            <!-- Individual Week Tabs -->
            <button
              v-for="week in deliveryWeeks"
              :key="week"
              @click="setActiveWeekTab(week)"
              :class="[
                'tab-button',
                activeWeekTab === week ? 'tab-active' : 'tab-inactive'
              ]"
            >
              <div class="tab-content">
                <span class="tab-label">{{ week }}</span>
                <span class="tab-count">
                  {{ getWeekOrderCount(week) }} orders
                </span>
              </div>
            </button>
          </nav>
        </div>
      </div>
      
      <!-- DataTables Component -->
      <DataTable
        ref="dataTable"
        :data="filteredTableData"
        :columns="columns"
        :options="tableOptions"
        class="sales-orders-datatable"
      />
    </div>

    <!-- Order Details Modal -->
    <div v-if="selectedOrder" class="modal-overlay" @click="closeModal">
      <div class="modal order-details-modal" @click.stop>
        <div class="modal-header">
          <h3>Sales Order Details</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="order-details">
            <div class="detail-group">
              <label>Order Number:</label>
              <span class="detail-value">{{ selectedOrder.salesOrderNumber }}</span>
            </div>
            
            <div class="detail-group">
              <label>Sold To Party:</label>
              <span class="detail-value">{{ selectedOrder.soldToParty }}</span>
            </div>
            
            <div class="detail-group">
              <label>Requested Delivery Date:</label>
              <span class="detail-value">{{ formatDate(selectedOrder.requestedDeliveryDate) }}</span>
            </div>
            
            <div class="detail-group">
              <label>Delivery Week:</label>
              <span class="detail-value">{{ selectedOrder.requestedDeliveryWeek }}</span>
            </div>
            
            <div class="detail-group">
              <label>Complete Delivery:</label>
              <span 
                class="status-badge" 
                :class="selectedOrder.completeDelivery ? 'status-success' : 'status-warning'"
              >
                {{ selectedOrder.completeDelivery ? 'Yes' : 'No' }}
              </span>
            </div>
          </div>

          <!-- Order Items -->
          <div class="order-items">
            <h4>Order Items ({{ selectedOrder.toItem?.length || 0 }})</h4>
            <div v-if="selectedOrder.toItem && selectedOrder.toItem.length > 0" class="items-list">
              <div
                v-for="(item, index) in selectedOrder.toItem"
                :key="index"
                class="item-card"
              >
                <div class="item-details">
                  <div class="item-row">
                    <span class="item-label">Item Number:</span>
                    <span class="item-value">{{ item.itemNumber || 'N/A' }}</span>
                  </div>
                  <div class="item-row">
                    <span class="item-label">Material Number:</span>
                    <span class="item-value">{{ item.materialNumber || 'N/A' }}</span>
                  </div>
                  <div class="item-row">
                    <span class="item-label">Description:</span>
                    <span class="item-value">{{ item.materialDescription || 'N/A' }}</span>
                  </div>
                  <div class="item-row">
                    <span class="item-label">Quantity:</span>
                    <span class="item-value">{{ item.quantity || 'N/A' }} {{ item.unitOfMeasure || '' }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="no-items">
              <p>No items found for this order.</p>
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
import type { SalesOrderDto } from '@/types/api'

// Register DataTables components
DataTable.use(DataTablesCore)

const {
  salesOrders,
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
const selectedOrder = ref<SalesOrderDto | null>(null)
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
const activeWeekTab = ref<string | null>(null)

// Check if credentials are available
const hasCredentials = computed(() => {
  return salesOrderService.hasCredentials()
})

// Get unique delivery weeks from sales orders, sorted chronologically
const deliveryWeeks = computed(() => {
  if (!salesOrders.value || salesOrders.value.length === 0) return []
  
  const weeks = [...new Set(
    salesOrders.value
      .map(order => order.requestedDeliveryWeek)
      .filter(week => week && week.trim() !== '')
  )]
  
  return weeks.sort()
})

// Get order count for a specific week
const getWeekOrderCount = (week: string) => {
  if (!salesOrders.value) return 0
  return salesOrders.value.filter(order => order.requestedDeliveryWeek === week).length
}

// Filter table data based on active week tab
const filteredTableData = computed(() => {
  if (!salesOrders.value) return []
  if (!activeWeekTab.value) return salesOrders.value
  
  return salesOrders.value.filter(order => order.requestedDeliveryWeek === activeWeekTab.value)
})

// Set active week tab
const setActiveWeekTab = (week: string) => {
  activeWeekTab.value = week
  // Force DataTable to refresh with new filtered data
  if (dataTable.value?.dt) {
    dataTable.value.dt.clear()
    dataTable.value.dt.rows.add(filteredTableData.value)
    dataTable.value.dt.draw()
  }
}

// Clear week filter
const clearWeekFilter = () => {
  activeWeekTab.value = null
  // Force DataTable to refresh with all data
  if (dataTable.value?.dt) {
    dataTable.value.dt.clear()
    dataTable.value.dt.rows.add(filteredTableData.value)
    dataTable.value.dt.draw()
  }
}

// DataTables configuration
const columns = [
  {
    title: 'Order Number',
    data: 'salesOrderNumber',
    className: 'font-semibold'
  },
  {
    title: 'Sold To Party',
    data: 'soldToParty'
  },
  {
    title: 'Delivery Date',
    data: 'requestedDeliveryDate',
    render: (data: string) => formatDate(data)
  },
  {
    title: 'Delivery Week',
    data: 'requestedDeliveryWeek'
  },
  {
    title: 'Complete Delivery',
    data: 'completeDelivery',
    render: (data: boolean) => {
      const status = data ? 'Complete' : 'Partial'
      const className = data ? 'status-success' : 'status-warning'
      return `<span class="status-badge ${className}">${status}</span>`
    }
  },
  {
    title: 'Items Count',
    data: 'toItem',
    render: (data: any[]) => data?.length || 0,
    searchable: false
  },
  {
    title: 'Actions',
    data: null,
    orderable: false,
    searchable: false,
    render: (data: any, type: string, row: SalesOrderDto) => {
      return '<button class="btn-icon view-order" title="View Details">👁️</button>'
    }
  }
]

const tableOptions = {
  responsive: true,
  pageLength: 10,
  lengthChange: true,
  lengthMenu: [10, 25, 50, 100],
  searching: true,
  ordering: true,
  info: true,
  autoWidth: false,
  language: {
    search: 'Search orders:',
    lengthMenu: 'Show _MENU_ orders per page',
    info: 'Showing _START_ to _END_ of _TOTAL_ orders',
    infoEmpty: 'No orders available',
    infoFiltered: '(filtered from _MAX_ total orders)',
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
        const rowData = dataTable.value.dt.row(tr).data() as SalesOrderDto
        viewOrder(rowData)
      }
    })
  })
}

// Watch for changes in filteredTableData to refresh table
watch(filteredTableData, () => {
  if (dataTable.value?.dt) {
    dataTable.value.dt.clear()
    dataTable.value.dt.rows.add(filteredTableData.value)
    dataTable.value.dt.draw()
  }
}, { deep: true })

// Reset week filter when new data is loaded
watch(salesOrders, () => {
  activeWeekTab.value = null
}, { deep: true })

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

// Format date for display
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

// Format datetime-local input for display
const formatDateDisplay = (datetimeLocal: string) => {
  if (!datetimeLocal) return ''
  try {
    const date = new Date(datetimeLocal)
    return formatDate(date.toISOString())
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
    filters.salesOrderNumber = ''
    filters.soldToParty = ''
    
    // Reset pagination
    pagination.page = 0
    
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
const viewOrder = (order: SalesOrderDto) => {
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
  margin-bottom: 20px;
  background: var(--background-card);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
  padding: 20px;
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

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
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

/* DataTables specific styles - CSS should be imported globally in main.ts */
.sales-orders-datatable {
  width: 100% !important;
}

/* Custom styles for DataTables integration */
:deep(.dataTables_wrapper) {
  background: var(--background-card);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
  padding: 20px;
  margin-top: 20px;
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

/* Table styling */
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

/* Status badges */
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

/* Action buttons */
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

/* Font weight utility */
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
}
</style>