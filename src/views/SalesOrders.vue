<!-- SalesOrders.vue - Complete Clean Version with Two-Row Header -->
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

    <!-- API Parameters Section -->
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
            {{ loading ? 'Зареждане...' : '📊 Зареди' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Зареждане на данни от SAP ...</p>
      <p class="loading-sub">Моля изчакайте ...</p>
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

    <!-- Data Display with Two-Row Header -->
    <div v-else-if="hasData" class="table-container">
      <div class="table-header">
        <h3>Батерии за седмица {{ activeWeekData?.reqDlvWeek }} - {{ filteredData.length }} записа</h3>
        <div class="table-info">
          <span class="data-range">
            Дати: {{ formatDateDisplay(apiDateFrom) }} - {{ formatDateDisplay(apiDateTo) }}
          </span>
        </div>
      </div>

      <!-- Delivery Week Tabs -->
      <div v-if="sortedSalesOrdersByDate.length > 0" class="delivery-week-tabs">
        <div class="tabs-navigation">
          <nav class="tabs-nav">
            <button
              v-for="(weekData, index) in sortedSalesOrdersByDate"
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

      <!-- Plant Filter Section -->
      <div v-if="activeWeekData && activeWeekData.salesOrderMainList.length > 0" class="table-filters">
        <div class="filter-group">
          <label for="plantFilter" class="filter-label">Филтър по завод:</label>
          <select
            id="plantFilter"
            v-model="selectedPlant"
            @change="applyPlantFilter"
            class="filter-select"
          >
            <option value="All">Всички заводи</option>
            <option 
              v-for="plant in availablePlants" 
              :key="plant" 
              :value="plant"
            >
              {{ plant }}
            </option>
          </select>
          <span class="filter-info">
            Показване на {{ filteredData.length }} от {{ activeWeekData.salesOrderMainList.length }} записа
          </span>
        </div>
      </div>

      <!-- Custom Table with Two-Row Header -->
      <div v-if="activeWeekData && activeWeekData.salesOrderMainList.length > 0" class="week-table-container">        
        <div class="custom-datatable-container">
          <div class="table-controls">
            <div class="controls-left">
              <label>
                Show 
                <select v-model="pageLength" @change="updatePageLength" class="page-length-select">
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                entries
              </label>
            </div>
            <div class="controls-right">
              <label>
                Search: 
                <input 
                  type="text" 
                  v-model="searchTerm" 
                  @input="filterData"
                  placeholder="Search in current week..."
                  class="search-input"
                >
              </label>
            </div>
          </div>

          <div class="table-wrapper">
            <table class="sales-orders-table-custom">
              <thead>
                <!-- First Header Row - Category Groups -->
                <tr class="header-categories">
                  <th colspan="2" class="header-basic">Основни данни</th>
                  <th colspan="3" class="header-inventory">Складови данни</th>
                  <!-- Dynamic Sales Order + Customer Groups -->
                  <template v-for="key in dynamicColumnKeys" :key="key">
                    <th colspan="3" class="header-dynamic">
                      {{ key }} + {{ getPlannedOrderForKey(key) }}
                    </th>
                  </template>
                </tr>
                
                <!-- Second Header Row - Column Names -->
                <tr class="header-columns">
                  <!-- Basic Information Columns -->
                  <th class="col-material">Материал</th>
                  <th class="col-plant">Завод</th>
                  
                  <!-- Inventory Data Columns -->
                  <th class="col-requested">Заявено количество</th>
                  <th class="col-available">НФ</th>
                  <th class="col-charged">МЗ</th>
                  
                  <!-- Dynamic Columns - Each Sales Order + Customer group -->
                  <template v-for="(key, keyIndex) in dynamicColumnKeys" :key="key">
                    <th :class="['col-dynamic-qty', { 'first-dynamic-group': keyIndex === 0 }]">Количество</th>
                    <th class="col-dynamic-planned">П-ва поръчка</th>
                    <th class="col-dynamic-production">Пр-на поръчка</th>
                  </template>
                </tr>
              </thead>
              
              <tbody>
                <tr 
                  v-for="(order, index) in paginatedData" 
                  :key="order.material + '-' + index"
                  class="data-row"
                  @click="viewOrder(order)"
                >
                  <!-- Basic Information -->
                  <td class="cell-material">{{ order.material }}</td>
                  <td class="cell-plant">{{ order.plant }}</td>
                  
                  <!-- Inventory Data -->
                  <td class="cell-requested">{{ formatQuantity(order.requestedQuantity, order.requestedQuantityUnit) }}</td>
                  <td class="cell-available">{{ formatNumber(order.availableNotCharged) }}</td>
                  <td class="cell-charged">{{ formatNumber(order.availableCharged) }}</td>
                  
                  <!-- Dynamic Columns - Each Sales Order + Customer group -->
                  <template v-for="(key, keyIndex) in dynamicColumnKeys" :key="key">
                    <td :class="['cell-dynamic-qty', { 'first-dynamic-group': keyIndex === 0 }]">
                      {{ order.dynamicSoItems?.[key]?.quantity ? formatNumber(order.dynamicSoItems[key].quantity) : '-' }}
                    </td>
                    <td class="cell-dynamic-planned">
                      {{ order.dynamicSoItems?.[key]?.plannedOrder || '-' }}
                    </td>
                    <td class="cell-dynamic-production">
                      {{ order.dynamicSoItems?.[key]?.productionOrder || '-' }}
                    </td>
                  </template>
                </tr>
                
                <!-- No data row -->
                <tr v-if="filteredData.length === 0" class="no-data-row">
                  <td :colspan="totalColumns" class="no-data-cell">
                    {{ searchTerm ? 'No matching records found' : 'No data available' }}
                  </td>
                </tr>
              </tbody>
              
              <!-- Footer with Totals -->
              <tfoot>
                <tr class="footer-totals">
                  <!-- Basic Information Totals -->
                  <td class="footer-material">{{ filteredData.length }} items</td>
                  <td class="footer-plant">{{ getUniquePlants() }} plants</td>
                  
                  <!-- Inventory Totals -->
                  <td class="footer-requested">Total: {{ formatNumber(getTotalRequested()) }}</td>
                  <td class="footer-available">Total: {{ formatNumber(getTotalAvailableNotCharged()) }}</td>
                  <td class="footer-charged">Total: {{ formatNumber(getTotalAvailableCharged()) }}</td>
                  
                  <!-- Dynamic Column Totals - Each Sales Order + Customer group -->
                  <template v-for="(key, keyIndex) in dynamicColumnKeys" :key="key">
                    <td :class="['footer-dynamic-qty', { 'first-dynamic-group': keyIndex === 0 }]">Total: {{ formatNumber(getDynamicTotal(key, 'quantity')) }}</td>
                    <td class="footer-dynamic-planned">{{ getDynamicCount(key, 'plannedOrder') }} orders</td>
                    <td class="footer-dynamic-production">{{ getDynamicCount(key, 'productionOrder') }} orders</td>
                  </template>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Pagination Controls -->
          <div class="pagination-controls">
            <div class="pagination-info">
              Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ filteredData.length }} entries
              <span v-if="searchTerm">(filtered from {{ activeWeekData.salesOrderMainList.length }} total entries)</span>
            </div>
            <div class="pagination-buttons">
              <button 
                class="btn btn-secondary pagination-btn"
                :disabled="currentPage === 1"
                @click="goToPage(1)"
              >
                First
              </button>
              <button 
                class="btn btn-secondary pagination-btn"
                :disabled="currentPage === 1"
                @click="goToPage(currentPage - 1)"
              >
                Previous
              </button>
              <span class="page-numbers">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              <button 
                class="btn btn-secondary pagination-btn"
                :disabled="currentPage === totalPages"
                @click="goToPage(currentPage + 1)"
              >
                Next
              </button>
              <button 
                class="btn btn-secondary pagination-btn"
                :disabled="currentPage === totalPages"
                @click="goToPage(totalPages)"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- No data message for active week -->
      <div v-else-if="activeWeekData && activeWeekData.salesOrderMainList.length === 0" class="no-data-message">
        <p>No data available for week {{ activeWeekData.reqDlvWeek }}</p>
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
                  <div class="dynamic-item-row" v-if="item.customer">
                    <span class="dynamic-item-label">Customer:</span>
                    <span class="dynamic-item-value">{{ item.customer }}</span>
                  </div>
                  <div class="dynamic-item-row" v-if="item.completeDelivery !== undefined">
                    <span class="dynamic-item-label">Complete Delivery:</span>
                    <span class="dynamic-item-value">{{ item.completeDelivery ? 'Yes' : 'No' }}</span>
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
import type { SalesOrderMain, SalesOrderByDate } from '@/types/api'

// Composables and existing state
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

// API parameters
const apiDateFrom = ref('')
const apiDateTo = ref('')
const activeWeekTab = ref<string>('')
const activeWeekIndex = ref<number>(0)
const selectedPlant = ref('All')

// Custom table state
const searchTerm = ref('')
const pageLength = ref(15)
const currentPage = ref(1)

// Computed properties
const hasCredentials = computed(() => {
  return salesOrderService.hasCredentials()
})

const activeWeekData = computed(() => {
  if (!sortedSalesOrdersByDate.value.length || !activeWeekTab.value) {
    return sortedSalesOrdersByDate.value[0] || null
  }
  return sortedSalesOrdersByDate.value.find(weekData => weekData.reqDlvWeek === activeWeekTab.value) || null
})

const sortedSalesOrdersByDate = computed(() => {
  if (!salesOrdersByDate.value.length) return []
  
  return [...salesOrdersByDate.value].sort((a, b) => {
    const parseWeek = (weekStr: string) => {
      const parts = weekStr.split('/')
      return {
        week: parseInt(parts[0]) || 0,
        year: parseInt(parts[1]) || 0
      }
    }
    
    const weekA = parseWeek(a.reqDlvWeek)
    const weekB = parseWeek(b.reqDlvWeek)
    
    if (weekA.year !== weekB.year) {
      return weekA.year - weekB.year
    }
    
    return weekA.week - weekB.week
  })
})

const dynamicColumnKeys = computed(() => {
  if (!activeWeekData.value) return []
  
  const allKeys = new Set<string>()
  
  activeWeekData.value.salesOrderMainList.forEach(order => {
    if (order.dynamicSoItems) {
      Object.keys(order.dynamicSoItems).forEach(key => {
        allKeys.add(key)
      })
    }
  })
  
  return Array.from(allKeys).sort()
})

const availablePlants = computed(() => {
  if (!activeWeekData.value) return []
  
  const plants = new Set<string>()
  activeWeekData.value.salesOrderMainList.forEach(order => {
    if (order.plant && order.plant.trim() !== '') {
      plants.add(order.plant.trim())
    }
  })
  
  return Array.from(plants).sort()
})

// Custom table computed properties
const filteredData = computed(() => {
  if (!activeWeekData.value) return []
  
  let data = activeWeekData.value.salesOrderMainList
  
  // Apply plant filter
  if (selectedPlant.value !== 'All') {
    data = data.filter(order => order.plant === selectedPlant.value)
  }
  
  // Apply search filter
  if (searchTerm.value.trim()) {
    const search = searchTerm.value.toLowerCase()
    data = data.filter(order => 
      order.material.toLowerCase().includes(search) ||
      order.plant.toLowerCase().includes(search) ||
      order.requestedQuantityUnit.toLowerCase().includes(search) ||
      // Search in dynamic items
      (order.dynamicSoItems && Object.values(order.dynamicSoItems).some(item => 
        item.plannedOrder?.toLowerCase().includes(search) ||
        item.productionOrder?.toLowerCase().includes(search)
      ))
    )
  }
  
  return data
})

const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / pageLength.value)
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * pageLength.value
})

const endIndex = computed(() => {
  return Math.min(startIndex.value + pageLength.value, filteredData.value.length)
})

const paginatedData = computed(() => {
  return filteredData.value.slice(startIndex.value, endIndex.value)
})

const totalColumns = computed(() => {
  return 5 + (dynamicColumnKeys.value.length * 3) // Basic(2) + Inventory(3) + Dynamic(keys*3) - Actions removed
})

// Methods
const filterData = () => {
  currentPage.value = 1 // Reset to first page when searching
}

const updatePageLength = () => {
  currentPage.value = 1 // Reset to first page when changing page length
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Footer calculation methods
const getTotalRequested = () => {
  return filteredData.value.reduce((total, order) => total + order.requestedQuantity, 0)
}

const getTotalAvailableNotCharged = () => {
  return filteredData.value.reduce((total, order) => total + order.availableNotCharged, 0)
}

const getTotalAvailableCharged = () => {
  return filteredData.value.reduce((total, order) => total + order.availableCharged, 0)
}

const getDynamicTotal = (key: string, field: 'quantity') => {
  return filteredData.value.reduce((total, order) => {
    const item = order.dynamicSoItems?.[key]
    return total + (item?.[field] || 0)
  }, 0)
}

const getDynamicCount = (key: string, field: 'plannedOrder' | 'productionOrder') => {
  return filteredData.value.filter(order => {
    const item = order.dynamicSoItems?.[key]
    return item?.[field] && item[field] !== '-' && item[field].trim() !== ''
  }).length
}

const getUniquePlants = () => {
  const plants = new Set(filteredData.value.map(order => order.plant))
  return plants.size
}

// Utility methods
const formatNumber = (value: number) => {
  return value.toLocaleString()
}

const formatQuantity = (quantity: number, unit: string) => {
  return `${formatNumber(quantity)} ${unit}`
}

// Order and tab management
const viewOrder = (order: SalesOrderMain) => {
  selectedOrder.value = order
}

const closeModal = () => {
  selectedOrder.value = null
}

const setActiveWeekTab = (weekName: string, index: number) => {
  activeWeekTab.value = weekName
  activeWeekIndex.value = index
  selectedPlant.value = 'All'
  searchTerm.value = ''
  currentPage.value = 1
  
  console.log(`🔄 Switching to week ${weekName} with ${dynamicColumnKeys.value.length} dynamic column groups`)
}

const applyPlantFilter = () => {
  console.log(`🏭 Plant filter changed to: ${selectedPlant.value}`)
  currentPage.value = 1 // Reset pagination when filter changes
}

// Date and API methods
const initializeDateInputs = () => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  
  apiDateFrom.value = formatDateTimeLocal(startOfMonth)
  apiDateTo.value = formatDateTimeLocal(endOfMonth)
}

const formatDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

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

const loadDataFromAPI = async () => {
  if (!apiDateFrom.value || !apiDateTo.value) {
    alert('Please select both date from and date to')
    return
  }

  try {
    const startDate = new Date(apiDateFrom.value)
    const endDate = new Date(apiDateTo.value)
    
    filters.reqDelDateBegin = formatDateForBackend(startDate)
    filters.reqDelDateEnd = formatDateForBackend(endDate)
    
    console.log('🔍 Setting date filters:', {
      fromInput: apiDateFrom.value,
      toInput: apiDateTo.value,
      backendFormat: {
        begin: filters.reqDelDateBegin,
        end: filters.reqDelDateEnd
      }
    })
    
    filters.material = ''
    filters.plant = ''
    pagination.page = 0
    activeWeekTab.value = ''
    activeWeekIndex.value = 0
    searchTerm.value = ''
    currentPage.value = 1
    
    await fetchSalesOrders()
  } catch (error) {
    console.error('❌ Error in loadDataFromAPI:', error)
    alert('Error loading data: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

const loadDataFromAPIWithCurrentMonth = async () => {
  initializeDateInputs()
  await loadDataFromAPI()
}

// Credentials management
const saveCredentials = async () => {
  if (!credentialsForm.value.username || !credentialsForm.value.password) {
    credentialsError.value = 'Both username and password are required'
    return
  }

  savingCredentials.value = true
  credentialsError.value = ''

  try {
    setCredentials(credentialsForm.value.username, credentialsForm.value.password)
    closeCredentialsModal()
    
    initializeDateInputs()
    console.log('✅ Credentials saved successfully')
    
  } catch (error) {
    credentialsError.value = error instanceof Error ? error.message : 'Failed to save credentials'
  } finally {
    savingCredentials.value = false
  }
}

const closeCredentialsModal = () => {
  showCredentialsModal.value = false
  credentialsForm.value = { username: '', password: '' }
  credentialsError.value = ''
  savingCredentials.value = false
}

const clearCredentialsAndReload = () => {
  clearCredentials()
  clearError()
  showCredentialsModal.value = true
}

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

// Get planned order for a specific dynamic key (from first item that has this key)
const getPlannedOrderForKey = (key: string) => {
  if (!activeWeekData.value) return 'N/A'
  
  // Find the first order that has this dynamic key with a plannedOrder
  for (const order of activeWeekData.value.salesOrderMainList) {
    if (order.dynamicSoItems?.[key]?.plannedOrder) {
      return order.dynamicSoItems[key].plannedOrder
    }
  }
  
  return 'N/A' // Return N/A if no plannedOrder found for this key
}

// Watchers
watch(salesOrdersByDate, (newData) => {
  if (newData.length > 0 && !activeWeekTab.value) {
    setActiveWeekTab(newData[0].reqDlvWeek, 0)
  }
}, { deep: true })

// Reset page when filters change
watch([selectedPlant, searchTerm], () => {
  currentPage.value = 1
})

// Initialize component
onMounted(() => {
  console.log('🔍 SalesOrders component mounted with two-row header')
  initializeDateInputs()
  
  if (!hasCredentials.value) {
    showCredentialsModal.value = true
  }
})
</script>

<style scoped>
/* Import base SalesOrder styles */
@import '@/styles/views/SalesOrder.css';

/* Import two-row header specific styles */
@import '@/styles/views/SalesOrdersTwoRowHeader.css';
</style>