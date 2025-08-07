<!-- src/views/SalesOrders.vue - Complete version with Dynamic Footer -->
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
        <h3>Батерии за седмица {{ activeWeekData?.reqDlvWeek }} - {{ filteredDataCount }} записа</h3>
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
            Показване на {{ filteredDataCount }} от {{ activeWeekData.salesOrderMainList.length }} записа
          </span>
        </div>
      </div>
      
      <!-- DataTables Component for Active Week -->
      <div v-if="activeWeekData && activeWeekData.salesOrderMainList.length > 0" class="week-table-container">        
        <DataTable
          ref="dataTable"
          :data="filteredSalesOrderData"
          :columns="dynamicColumns"
          :options="tableOptions"
          class="sales-orders-datatable"
          :key="activeWeekTab + '-' + dynamicColumnKeys.join('-') + '-' + selectedPlant"
        >
          <tfoot>
            <tr class="footer-row">
              <th v-for="(column, index) in dynamicColumns" :key="index" :class="getFooterCellClass(column)">
                {{ getFooterContent(column, index) }}
              </th>
            </tr>
          </tfoot>
        </DataTable>
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

// Plant filter state
const selectedPlant = ref('All')

// New reactive reference for footer calculations based on DataTable search
const searchFilteredData = ref<SalesOrderMain[]>([])

// Check if credentials are available
const hasCredentials = computed(() => {
  return salesOrderService.hasCredentials()
})

// Get total items count across all weeks
const totalItemsCount = computed(() => {
  return sortedSalesOrdersByDate.value.reduce((total, weekData) => 
    total + weekData.salesOrderMainList.length, 0)
})

// Get active week data
const activeWeekData = computed(() => {
  if (!sortedSalesOrdersByDate.value.length || !activeWeekTab.value) {
    return sortedSalesOrdersByDate.value[0] || null
  }
  return sortedSalesOrdersByDate.value.find(weekData => weekData.reqDlvWeek === activeWeekTab.value) || null
})

// Get unique plants from active week data
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

// Filter data based on selected plant
const filteredSalesOrderData = computed(() => {
  if (!activeWeekData.value) return []
  
  if (selectedPlant.value === 'All') {
    return activeWeekData.value.salesOrderMainList
  }
  
  return activeWeekData.value.salesOrderMainList.filter(order => 
    order.plant === selectedPlant.value
  )
})

// Count of filtered data
const filteredDataCount = computed(() => {
  return filteredSalesOrderData.value.length
})

// Get all unique dynamic column keys from the current active week data
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

// Generate dynamic columns configuration
const dynamicColumns = computed(() => {
  // Base columns
  const baseColumns = [
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
    }
  ]

  // Dynamic columns for each dynamicSoItems key
  const dynamicCols = dynamicColumnKeys.value.flatMap(key => [
    {
      title: `${key} - Qty`,
      data: null,
      orderable: true,
      searchable: false,
      className: 'dynamic-col-qty',
      render: (data: any, type: string, row: SalesOrderMain) => {
        const item = row.dynamicSoItems?.[key]
        return item?.quantity ? item.quantity.toString() : '-'
      }
    },
    {
      title: `${key} - Planned Order`,
      data: null,
      orderable: true,
      searchable: true,
      className: 'dynamic-col-planned',
      render: (data: any, type: string, row: SalesOrderMain) => {
        const item = row.dynamicSoItems?.[key]
        return item?.plannedOrder || '-'
      }
    },
    {
      title: `${key} - Production Order`,
      data: null,
      orderable: true,
      searchable: true,
      className: 'dynamic-col-production',
      render: (data: any, type: string, row: SalesOrderMain) => {
        const item = row.dynamicSoItems?.[key]
        return item?.productionOrder || '-'
      }
    }
  ])

  // Actions column
  const actionsColumn = {
    title: 'Actions',
    data: null,
    orderable: false,
    searchable: false,
    render: (data: any, type: string, row: SalesOrderMain) => {
      return '<button class="btn-icon view-order" title="View Details">👁️</button>'
    }
  }

  return [...baseColumns, ...dynamicCols, actionsColumn]
})

const sortedSalesOrdersByDate = computed(() => {
  if (!salesOrdersByDate.value.length) return []
  
  return [...salesOrdersByDate.value].sort((a, b) => {
    // Parse the week format: "49/2025" -> { week: 49, year: 2025 }
    const parseWeek = (weekStr: string) => {
      const parts = weekStr.split('/')
      return {
        week: parseInt(parts[0]) || 0,
        year: parseInt(parts[1]) || 0
      }
    }
    
    const weekA = parseWeek(a.reqDlvWeek)
    const weekB = parseWeek(b.reqDlvWeek)
    
    // Sort by year first, then by week number
    if (weekA.year !== weekB.year) {
      return weekA.year - weekB.year
    }
    
    return weekA.week - weekB.week
  })
})

// Get count of items that have a specific dynamic key
const getDynamicKeyCount = (key: string) => {
  if (!activeWeekData.value) return 0
  
  return activeWeekData.value.salesOrderMainList.filter(order => 
    order.dynamicSoItems && order.dynamicSoItems[key]
  ).length
}

// Add this helper method for footer cell styling:
const getFooterCellClass = (column) => {
  const classes = ['footer-cell']
  
  if (column.data === 'requestedQuantity' || 
      column.data === 'availableNotCharged' || 
      column.data === 'availableCharged' ||
      column.title.includes('Qty')) {
    classes.push('footer-numeric')
  } else if (column.data === 'material' || 
             column.data === 'plant' ||
             column.title.includes('Order')) {
    classes.push('footer-count')
  } else if (column.title === 'Actions') {
    classes.push('footer-actions')
  }
  
  return classes.join(' ')
}

// Function to update footer based on currently visible (searched/filtered) data
const updateFooterWithVisibleData = () => {
  if (!dataTable.value?.dt) return
  
  // Get all visible rows after search/filter
  const visibleRows = dataTable.value.dt.rows({ search: 'applied' }).data().toArray()
  searchFilteredData.value = visibleRows
  
  // Update footer content
  updateFooterCells()
}

// Function to update footer cells with current calculations
const updateFooterCells = () => {
  if (!dataTable.value?.dt) return
  
  const footerCells = document.querySelectorAll('.sales-orders-datatable tfoot th')
  
  footerCells.forEach((cell, index) => {
    if (index < dynamicColumns.value.length) {
      const column = dynamicColumns.value[index]
      cell.textContent = getFooterContentForSearch(column, index)
    }
  })
}

// Updated footer content calculation using search-filtered data
const getFooterContentForSearch = (column, index) => {
  const data = searchFilteredData.value.length > 0 ? searchFilteredData.value : filteredSalesOrderData.value
  
  if (!data || !data.length) return ''
  
  // Helper function to get numeric value
  const numVal = (i) => {
    if (typeof i === 'string') {
      const cleaned = i.replace(/[\$,\s]/g, '')
      return parseFloat(cleaned) || 0
    }
    return typeof i === 'number' ? i : 0
  }
  
  // Check if this is a numeric column
  if (column.data === 'requestedQuantity' || 
      column.data === 'availableNotCharged' || 
      column.data === 'availableCharged' ||
      column.title.includes('Qty')) {
    
    // Sum numeric values
    let total = 0
    data.forEach(rowData => {
      if (column.data === 'requestedQuantity') {
        total += numVal(rowData.requestedQuantity)
      } else if (column.data === 'availableNotCharged') {
        total += numVal(rowData.availableNotCharged)
      } else if (column.data === 'availableCharged') {
        total += numVal(rowData.availableCharged)
      } else if (column.title.includes('Qty')) {
        // For dynamic qty columns
        const keyMatch = column.title.match(/^(.+) - Qty$/)
        if (keyMatch) {
          const key = keyMatch[1]
          const item = rowData.dynamicSoItems?.[key]
          total += numVal(item?.quantity || 0)
        }
      }
    })
    
    return `Total: ${total.toLocaleString()}`
    
  } else if (column.data === 'material' || 
             column.data === 'plant' ||
             column.title.includes('Order')) {
    
    // Count non-empty values for string columns
    let count = 0
    data.forEach(rowData => {
      if (column.data === 'material') {
        if (rowData.material && rowData.material !== '-' && rowData.material.toString().trim() !== '') {
          count++
        }
      } else if (column.data === 'plant') {
        if (rowData.plant && rowData.plant !== '-' && rowData.plant.toString().trim() !== '') {
          count++
        }
      } else if (column.title.includes('Planned Order') || column.title.includes('Production Order')) {
        // For dynamic order columns
        const keyMatch = column.title.match(/^(.+) - (Planned|Production) Order$/)
        if (keyMatch) {
          const key = keyMatch[1]
          const orderType = keyMatch[2].toLowerCase() + 'Order'
          const item = rowData.dynamicSoItems?.[key]
          const orderValue = item?.[orderType]
          if (orderValue && orderValue !== '-' && orderValue.toString().trim() !== '') {
            count++
          }
        }
      }
    })
    
    return `${count} items`
    
  } else if (column.title === 'Actions') {
    // Skip actions column
    return ''
  } else {
    // For other columns, show total count
    return `${data.length} total`
  }
}

// Calculate footer content for each column (updated to use search-filtered data)
const getFooterContent = (column, index) => {
  // Use search-filtered data if available, otherwise fall back to plant-filtered data
  return getFooterContentForSearch(column, index)
}

// Apply plant filter
const applyPlantFilter = () => {
  console.log(`🏭 Plant filter changed to: ${selectedPlant.value}`)
  console.log(`📊 Showing ${filteredDataCount.value} of ${activeWeekData.value?.salesOrderMainList.length || 0} records`)
  
  // Reset search filtered data when plant filter changes
  searchFilteredData.value = []
  
  // Trigger footer update after plant filter is applied
  setTimeout(() => {
    if (dataTable.value?.dt) {
      updateFooterWithVisibleData()
    }
  }, 100)
}

// Set active week tab (updated to reset plant filter)
const setActiveWeekTab = (weekName: string, index: number) => {
  activeWeekTab.value = weekName
  activeWeekIndex.value = index
  selectedPlant.value = 'All' // Reset filter when switching weeks
  searchFilteredData.value = [] // Reset search filtered data
  
  console.log(`🔄 Switching to week ${weekName} with ${dynamicColumnKeys.value.length} dynamic column groups`)
}

// Watch for data changes to set first tab as active
watch(salesOrdersByDate, (newData) => {
  if (newData.length > 0 && !activeWeekTab.value) {
    setActiveWeekTab(newData[0].reqDlvWeek, 0)
  }
}, { deep: true })

// Watch for changes in the DataTable search input
watch(() => dataTable.value, (newValue) => {
  if (newValue?.dt) {
    // Listen for search events
    newValue.dt.on('search.dt', () => {
      setTimeout(() => {
        updateFooterWithVisibleData()
      }, 10)
    })
    
    // Listen for page change events
    newValue.dt.on('page.dt', () => {
      setTimeout(() => {
        updateFooterWithVisibleData()
      }, 10)
    })
    
    // Listen for length change events
    newValue.dt.on('length.dt', () => {
      setTimeout(() => {
        updateFooterWithVisibleData()
      }, 10)
    })
  }
}, { immediate: true })

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
const tableOptions = {
  responsive: true,
  pageLength: 15,
  lengthChange: true,
  lengthMenu: [10, 15, 25, 50, 100],
  searching: true,
  ordering: true,
  info: true,
  autoWidth: false,
  scrollX: true,
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
      updateFooterWithVisibleData()
    }, 0)
  },
  // Add search callback to update footer when search changes
  initComplete: function(settings, json) {
    updateFooterWithVisibleData()
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
    
    // Reset search filtered data
    searchFilteredData.value = []
    
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

/* Dynamic Columns Info Styling */
.dynamic-columns-info {
  background: var(--background-card);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
  padding: 16px;
  margin-bottom: 20px;
}

.dynamic-columns-info h4 {
  margin: 0 0 12px 0;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
}

.dynamic-keys {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dynamic-key-badge {
  padding: 4px 8px;
  background: var(--color-primary);
  color: white;
  border-radius: var(--border-radius-sm);
  font-size: 12px;
  font-weight: 500;
}

/* No Data Message */
.no-data-message {
  background: var(--background-card);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}

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
}

.week-table-header {
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

/* DataTables styling with dynamic columns */
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
  padding: 12px 8px;
  border-bottom: 2px solid var(--border-light);
  text-align: left;
  white-space: nowrap;
  font-size: 12px;
}

:deep(table.dataTable tbody td) {
  padding: 10px 8px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-primary);
  font-size: 12px;
  white-space: nowrap;
}

:deep(table.dataTable tbody tr:hover) {
  background: var(--background-secondary);
}

/* DataTable Footer Styles */
:deep(table.dataTable tfoot th) {
  background: var(--background-secondary) !important;
  color: var(--text-primary) !important;
  font-weight: 600 !important;
  padding: 12px 8px !important;
  border-top: 2px solid var(--color-primary) !important;
  border-bottom: 1px solid var(--border-light) !important;
  text-align: left !important;
  font-size: 12px !important;
  white-space: nowrap !important;
  vertical-align: middle !important;
}

:deep(table.dataTable tfoot th.footer-numeric) {
  background-color: #f0f9ff !important;
  text-align: right !important;
  font-weight: 700 !important;
  color: var(--color-primary) !important;
}

:deep(table.dataTable tfoot th.footer-count) {
  background-color: #f0fdf4 !important;
  text-align: center !important;
  color: var(--color-success) !important;
  font-weight: 600 !important;
}

:deep(table.dataTable tfoot th.footer-actions) {
  background-color: var(--background-card) !important;
}

:deep(.footer-row) {
  border-top: 2px solid var(--color-primary) !important;
}

/* Dynamic column styling */
:deep(.dynamic-col-qty) {
  background-color: #f0f9ff;
  font-weight: 600;
  text-align: center;
}

:deep(.dynamic-col-planned) {
  background-color: #f0fdf4;
  font-family: monospace;
  font-size: 11px;
}

:deep(.dynamic-col-production) {
  background-color: #fefce8;
  font-family: monospace;
  font-size: 11px;
}

/* Dynamic column headers */
:deep(table.dataTable thead th:contains("Qty")) {
  background-color: #dbeafe !important;
  color: #1e40af !important;
}

:deep(table.dataTable thead th:contains("Planned Order")) {
  background-color: #dcfce7 !important;
  color: #166534 !important;
}

:deep(table.dataTable thead th:contains("Production Order")) {
  background-color: #fef3c7 !important;
  color: #92400e !important;
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

/* Scrollable table for many dynamic columns */
:deep(.dataTables_scroll) {
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
}

:deep(.dataTables_scrollHead) {
  border-bottom: 2px solid var(--border-medium);
}

:deep(.dataTables_scrollBody) {
  border-top: none;
}

/* Column group headers visual distinction */
:deep(table.dataTable thead th) {
  position: relative;
}

/* Add visual separators between dynamic column groups */
:deep(table.dataTable thead th[data-group="new"]) {
  border-left: 3px solid var(--color-primary);
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

  .dynamic-columns-info {
    padding: 12px;
  }

  .dynamic-keys {
    flex-direction: column;
    gap: 6px;
  }

  :deep(.dataTables_wrapper) {
    padding: 15px;
  }
  
  :deep(.dataTables_length),
  :deep(.dataTables_filter) {
    margin-bottom: 15px;
  }
  
  :deep(table.dataTable thead th),
  :deep(table.dataTable tbody td),
  :deep(table.dataTable tfoot th) {
    padding: 6px 4px;
    font-size: 11px;
  }

  .dynamic-item-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .week-table-container {
    margin-top: 24px;
  }
  
  /* Force horizontal scroll on mobile for dynamic columns */
  :deep(.dataTables_wrapper) {
    overflow-x: auto;
  }
  
  :deep(table.dataTable) {
    min-width: 800px;
  }
}

/* Print styles for dynamic columns */
@media print {
  .dynamic-columns-info,
  .delivery-week-tabs {
    display: none;
  }
  
  :deep(table.dataTable) {
    font-size: 10px;
  }
  
  :deep(table.dataTable thead th),
  :deep(table.dataTable tbody td),
  :deep(table.dataTable tfoot th) {
    padding: 4px 2px;
  }
}
</style>