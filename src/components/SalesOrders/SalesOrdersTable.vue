<!-- SalesOrdersTable.vue - Customer Info in Header Row -->
<template>
  <div class="custom-datatable-container">
    <div class="table-wrapper">
      <table class="sales-orders-table-custom">
        <thead>
          <!-- First Header Row - Category Groups WITH CUSTOMER INFO -->
          <tr class="header-categories">
            <th colspan="2" class="header-basic">Основни данни</th>
            <th colspan="7" class="header-inventory">Складови данни</th>
            <!-- Dynamic Sales Order Groups with Customer Information -->
            <template v-for="key in dynamicColumns" :key="key">
              <th colspan="3" class="header-dynamic">
                <div class="dynamic-header-content-single-line">
                  <!-- All info on single line: Sales Order / Customer / Customer Name -->
                  <span class="order-info-inline">{{ key }}</span>
                  <span class="separator"> / </span>
                  <span 
                    class="customer-number-inline"
                    :class="{ 'customer-missing': !getCustomerForKey(key) }"
                    :title="getCustomerDebugInfoForHeader(key)"
                  >
                    {{ formatCustomerNumber(getCustomerForKey(key)) }}
                  </span>
                  <span 
                    v-if="getCustomerNameForKey(key)" 
                    class="separator"
                  >
                     / 
                  </span>
                  <span 
                    v-if="getCustomerNameForKey(key)" 
                    class="customer-name-inline"
                  >
                    {{ getCustomerNameForKey(key) }}
                  </span>
                  <span 
                    v-if="!getCustomerForKey(key)" 
                    class="debug-indicator-inline"
                    title="Customer data missing from backend"
                  >
                    🔍
                  </span>
                </div>
              </th>
            </template>
          </tr>
          
          <!-- Second Header Row - Column Names with Sorting -->
          <tr class="header-columns">
            <!-- Basic Information Columns -->
            <th 
              class="col-material sortable material-header" 
              @click="handleSort('material')"
              :class="{ 'sort-active': sortColumn === 'material' }"
              title="Материал - кликнете за производствени поръчки"
            >
              <div class="header-content">
                <span class="header-text">Материал</span>
                <span class="production-hint">🏭</span>
              </div>
              <SortIndicator :column="sortColumn" :direction="sortDirection" current="material" />
            </th>
            <th 
              class="col-plant sortable" 
              @click="handleSort('plant')"
              :class="{ 'sort-active': sortColumn === 'plant' }"
            >
              Завод
              <SortIndicator :column="sortColumn" :direction="sortDirection" current="plant" />
            </th>
            
            <!-- Inventory Data Columns -->
            <th 
              class="col-requested sortable" 
              @click="handleSort('requestedQuantity')"
              :class="{ 'sort-active': sortColumn === 'requestedQuantity' }"
            >
              Заявено количество
              <SortIndicator :column="sortColumn" :direction="sortDirection" current="requestedQuantity" />
            </th>
            <th 
              class="col-to-produce sortable" 
              @click="handleSort('toProduce')"
              :class="{ 'sort-active': sortColumn === 'toProduce' }"
            >
              За производство
              <SortIndicator :column="sortColumn" :direction="sortDirection" current="toProduce" />
            </th>
            <th 
              class="col-total-available sortable" 
              @click="handleSort('totalAvailableQuantity')"
              :class="{ 'sort-active': sortColumn === 'totalAvailableQuantity' }"
            >
              Общо налично
              <SortIndicator :column="sortColumn" :direction="sortDirection" current="totalAvailableQuantity" />
            </th>
            <th 
              class="col-cumulative sortable" 
              @click="handleSort('cumulativeQuantity')"
              :class="{ 'sort-active': sortColumn === 'cumulativeQuantity' }"
            >
              Натрупано количество
              <SortIndicator :column="sortColumn" :direction="sortDirection" current="cumulativeQuantity" />
            </th>
            <th 
              class="col-available sortable" 
              @click="handleSort('availableNotCharged')"
              :class="{ 'sort-active': sortColumn === 'availableNotCharged' }"
            >
              НФ
              <SortIndicator :column="sortColumn" :direction="sortDirection" current="availableNotCharged" />
            </th>
            <th 
              class="col-charged sortable" 
              @click="handleSort('availableCharged')"
              :class="{ 'sort-active': sortColumn === 'availableCharged' }"
            >
              МЗ
              <SortIndicator :column="sortColumn" :direction="sortDirection" current="availableCharged" />
            </th>
            <th 
              class="col-final-battery sortable" 
              @click="handleSort('finalBattery')"
              :class="{ 'sort-active': sortColumn === 'finalBattery' }"
            >
              10-ки
              <SortIndicator :column="sortColumn" :direction="sortDirection" current="finalBattery" />
            </th>
            
            <!-- Dynamic Columns - BACK TO 3 COLUMNS (NO SEPARATE CUSTOMER COLUMN) -->
            <template v-for="(key, keyIndex) in dynamicColumns" :key="key">
              <th 
                :class="['col-dynamic-qty sortable', { 'first-dynamic-group': keyIndex === 0, 'sort-active': sortColumn === `dynamic-${key}-quantity` }]"
                @click="handleSort(`dynamic-${key}-quantity`)"
              >
                Количество
                <SortIndicator :column="sortColumn" :direction="sortDirection" :current="`dynamic-${key}-quantity`" />
              </th>
              <th 
                class="col-dynamic-planned sortable planned-order-header"
                @click="handleSort(`dynamic-${key}-plannedOrder`)"
                :class="{ 'sort-active': sortColumn === `dynamic-${key}-plannedOrder` }"
                title="Планирана поръчка - кликнете за конвертиране"
              >
                <div class="header-content">
                  <span class="header-text">П-ва поръчка</span>
                </div>
                <SortIndicator :column="sortColumn" :direction="sortDirection" :current="`dynamic-${key}-plannedOrder`" />
              </th>
              <th 
                class="col-dynamic-production sortable"
                @click="handleSort(`dynamic-${key}-productionOrder`)"
                :class="{ 'sort-active': sortColumn === `dynamic-${key}-productionOrder` }"
              >
                Пр-на поръчка
                <SortIndicator :column="sortColumn" :direction="sortDirection" :current="`dynamic-${key}-productionOrder`" />
              </th>
            </template>
          </tr>
        </thead>
        
        <tbody>
          <tr 
            v-for="(order, index) in data" 
            :key="order.material + '-' + index"
            class="data-row"
            @click="handleRowClick(order)"
          >
            <!-- Basic Information -->
            <td class="cell-material">
              <div 
                class="material-clickable-container"
                @click.stop="handleMaterialClick(order.material)"
                :title="`Кликнете за производствени поръчки на ${order.material}`"
              >
                <span class="material-code">{{ order.material }}</span>
                <span class="production-icon">🏭</span>
              </div>
            </td>
            <td class="cell-plant">{{ order.plant }}</td>
            
            <!-- Inventory Data -->
            <td class="cell-requested">{{ formatQuantity(order.requestedQuantity, order.requestedQuantityUnit) }}</td>
            <td class="cell-to-produce">{{ formatNumber(order.toProduce || 0) }}</td>
            <td class="cell-total-available">{{ formatNumber(order.totalAvailableQuantity || 0) }}</td>
            <td class="cell-cumulative">{{ formatNumber(order.cumulativeQuantity || 0) }}</td>
            <td class="cell-available">{{ formatNumber(order.availableNotCharged) }}</td>
            <td class="cell-charged">{{ formatNumber(order.availableCharged) }}</td>
            <td class="cell-final-battery">{{ formatNumber(order.finalBattery || 0) }}</td>
            
            <!-- Dynamic Columns - BACK TO 3 COLUMNS -->
            <template v-for="(key, keyIndex) in dynamicColumns" :key="key">
              <td :class="['cell-dynamic-qty', { 'first-dynamic-group': keyIndex === 0 }]">
                {{ order.dynamicSoItems?.[key]?.quantity ? formatNumber(order.dynamicSoItems[key].quantity) : '-' }}
              </td>
              <td class="cell-dynamic-planned">
                <div 
                  v-if="order.dynamicSoItems?.[key]?.plannedOrder && order.dynamicSoItems[key].plannedOrder !== '-'"
                  class="planned-order-clickable-container"
                  @click.stop="handlePlannedOrderClick(order.dynamicSoItems[key].plannedOrder, order.material, order.plant)"
                  :title="`Кликнете за конвертиране на планирана поръчка ${order.dynamicSoItems[key].plannedOrder}`"
                >
                  <span class="planned-order-code">{{ order.dynamicSoItems[key].plannedOrder }}</span>
                </div>
                <span v-else class="no-planned-order">-</span>
              </td>
              <td class="cell-dynamic-production">
                {{ order.dynamicSoItems?.[key]?.productionOrder || '-' }}
              </td>
            </template>
          </tr>
          
          <!-- No data row -->
          <tr v-if="data.length === 0" class="no-data-row">
            <td :colspan="totalColumns" class="no-data-cell">
              {{ noDataMessage }}
            </td>
          </tr>
        </tbody>
        
        <!-- Footer with Totals -->
        <TableFooter 
          v-if="data.length > 0"
          :data="allFilteredData"
          :dynamicColumns="dynamicColumns"
        />
      </table>
    </div>

    <!-- Material Click Feedback -->
    <div v-if="showMaterialClickFeedback" class="material-click-feedback">
      <div class="feedback-content">
        <span class="feedback-icon">🏭</span>
        <span class="feedback-text">Зареждане на производствени поръчки за {{ lastClickedMaterial }}...</span>
      </div>
    </div>

    <!-- Debug Panel (Optional) -->
    <div v-if="showDebugPanel" class="debug-panel">
      <div class="debug-header">
        <h3>🔍 Customer Data Debug Panel</h3>
        <button @click="showDebugPanel = false" class="close-debug">✕</button>
      </div>
      <div class="debug-content">
        <div v-for="(key, idx) in dynamicColumns" :key="idx" class="debug-item">
          <strong>Key: {{ key }}</strong>
          <div class="debug-values">
            <div>Customer: {{ getCustomerForKey(key) || 'MISSING' }}</div>
            <div>CustomerName: {{ getCustomerNameForKey(key) || 'MISSING' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted } from 'vue'
import type { SalesOrderMain } from '@/types/api'
import SortIndicator from './SortIndicator.vue'
import TableFooter from './TableFooter.vue'

// Props
interface Props {
  data: SalesOrderMain[]
  allFilteredData: SalesOrderMain[]
  dynamicColumns: string[]
  sortColumn: string
  sortDirection: 'asc' | 'desc'
  noDataMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  noDataMessage: 'No data available'
})

// Events
interface Emits {
  sort: [column: string]
  'row-click': [order: SalesOrderMain]
  'material-click': [material: string]
  'planned-order-click': [plannedOrder: string, material: string, plant: string]
}

const emit = defineEmits<Emits>()

// State
const showMaterialClickFeedback = ref(false)
const lastClickedMaterial = ref('')
const showPlannedOrderClickFeedback = ref(false)
const lastClickedPlannedOrder = ref('')
const showDebugPanel = ref(false)

// Inject table utilities from parent composable if available
const tableUtils = inject('tableUtils', {
  formatNumber: (value: number) => value.toLocaleString('bg-BG'),
  formatQuantity: (quantity: number, unit: string) => `${quantity.toLocaleString('bg-BG')} ${unit}`
})

// Computed
const totalColumns = computed(() => {
  // 9 basic columns + (dynamicColumns.length * 3) - back to 3 columns per dynamic key
  return 9 + (props.dynamicColumns.length * 3)
})

// Debug: Log data on mount
onMounted(() => {
  console.group('🔍 SalesOrdersTable Debug - Customer Data in Header')
  console.log('Orders on current page:', props.data.length)
  console.log('Total filtered orders (all pages):', props.allFilteredData.length)
  console.log('Dynamic columns:', props.dynamicColumns)
  
  // Check customer data for each dynamic column
  props.dynamicColumns.forEach(key => {
    const customer = getCustomerForKey(key)
    const customerName = getCustomerNameForKey(key)
    console.log(`Key "${key}":`, {
      customer: customer || 'MISSING',
      customerName: customerName || 'MISSING',
      hasCustomer: !!customer,
      hasCustomerName: !!customerName,
      searchedIn: 'ALL filtered data (all pages)'
    })
  })
  console.groupEnd()
})

// Methods
const handleSort = (column: string) => {
  emit('sort', column)
}

const handleRowClick = (order: SalesOrderMain) => {
  emit('row-click', order)
}

const handleMaterialClick = (material: string) => {
  console.log(`🔍 Material clicked in table: ${material}`)
  
  lastClickedMaterial.value = material
  
  // Show temporary feedback
  showMaterialClickFeedback.value = true
  setTimeout(() => {
    showMaterialClickFeedback.value = false
  }, 2000)
  
  // Emit the material click event
  emit('material-click', material)
  
  console.log(`✅ Material click event emitted for: ${material}`)
}

const handlePlannedOrderClick = (plannedOrder: string, material: string, plant: string) => {
  console.log(`🔄 Planned order clicked in table: ${plannedOrder} for material: ${material}, plant: ${plant}`)
  
  lastClickedPlannedOrder.value = plannedOrder
  
  // Show temporary feedback
  showPlannedOrderClickFeedback.value = true
  setTimeout(() => {
    showPlannedOrderClickFeedback.value = false
  }, 1500)
  
  // Emit the planned order click event with plant information
  emit('planned-order-click', plannedOrder, material, plant)
  
  console.log(`✅ Planned order click event emitted for: ${plannedOrder} with plant: ${plant}`)
}

const formatNumber = (value: number): string => {
  return tableUtils.formatNumber(value)
}

const formatQuantity = (quantity: number, unit: string): string => {
  return tableUtils.formatQuantity(quantity, unit)
}

const formatCustomerNumber = (customer: string | undefined): string => {
  if (!customer) {
    return 'N/A'
  }
  return customer
}

// Get customer for a specific dynamic column key
const getCustomerForKey = (key: string): string | undefined => {
  // IMPORTANT: Search in ALL filtered data, not just current page
  // This ensures customer info is always available even if the item appears on another page
  for (const order of props.allFilteredData) {
    if (order.dynamicSoItems?.[key]?.customer) {
      return order.dynamicSoItems[key].customer
    }
  }
  return undefined
}

// Get customer name for a specific dynamic column key
const getCustomerNameForKey = (key: string): string | undefined => {
  // IMPORTANT: Search in ALL filtered data, not just current page
  // This ensures customer name is always available even if the item appears on another page
  for (const order of props.allFilteredData) {
    if (order.dynamicSoItems?.[key]?.customerName) {
      return order.dynamicSoItems[key].customerName
    }
  }
  return undefined
}

const getCustomerDebugInfoForHeader = (key: string): string => {
  const customer = getCustomerForKey(key)
  const customerName = getCustomerNameForKey(key)
  
  const debugInfo = []
  debugInfo.push(`Key: ${key}`)
  debugInfo.push(`Customer: ${customer || 'MISSING'}`)
  debugInfo.push(`CustomerName: ${customerName || 'MISSING'}`)
  debugInfo.push(`Has customer field: ${!!customer}`)
  debugInfo.push(`Has customerName field: ${!!customerName}`)
  
  return debugInfo.join('\n')
}

const getPlannedOrderForKey = (key: string): string => {
  for (const order of props.data) {
    if (order.dynamicSoItems?.[key]?.plannedOrder) {
      return order.dynamicSoItems[key].plannedOrder
    }
  }
  return 'N/A'
}

// Toggle debug panel (can be triggered via console: window.toggleCustomerDebug())
;(window as any).toggleCustomerDebug = () => {
  showDebugPanel.value = !showDebugPanel.value
  console.log('🔍 Customer debug panel:', showDebugPanel.value ? 'SHOWN' : 'HIDDEN')
}

// Log customer data
;(window as any).logCustomerData = () => {
  console.group('🔍 Customer Data by Dynamic Column Key')
  console.log(`Searching in ALL filtered data: ${props.allFilteredData.length} orders across all pages`)
  console.log(`Current page shows: ${props.data.length} orders`)
  
  props.dynamicColumns.forEach(key => {
    console.group(`Key: ${key}`)
    console.log('Customer:', getCustomerForKey(key) || 'MISSING')
    console.log('CustomerName:', getCustomerNameForKey(key) || 'MISSING')
    
    // Show all orders with this key from ALL data
    const ordersWithKeyAllPages = props.allFilteredData.filter(o => o.dynamicSoItems?.[key])
    const ordersWithKeyCurrentPage = props.data.filter(o => o.dynamicSoItems?.[key])
    
    console.log(`Orders with this key (all pages): ${ordersWithKeyAllPages.length}`)
    console.log(`Orders with this key (current page): ${ordersWithKeyCurrentPage.length}`)
    
    if (ordersWithKeyAllPages.length > 0) {
      console.log('Sample orders from all data:')
      ordersWithKeyAllPages.slice(0, 3).forEach(order => {
        console.log(`  - Material: ${order.material}`, order.dynamicSoItems?.[key])
      })
    }
    console.groupEnd()
  })
  console.groupEnd()
}

console.log('💡 Debug commands available:')
console.log('  - window.toggleCustomerDebug() - Toggle debug panel')
console.log('  - window.logCustomerData() - Log all customer data to console')
</script>

<style scoped>
@import '@/styles/components/SalesOrders/SalesOrdersTable.css';

/* Single-Line Header Styles for Customer Info */
.dynamic-header-content-single-line {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
  line-height: 1.4;
}

.order-info-inline {
  font-weight: 600;
  color: #1e40af;
  white-space: nowrap;
}

.customer-number-inline {
  font-weight: 600;
  color: #1e3a8a;
  white-space: nowrap;
}

.customer-number-inline.customer-missing {
  color: #dc2626;
  font-style: italic;
}

.customer-name-inline {
  color: #1e3a8a;
  font-style: italic;
  white-space: nowrap;
}

.separator {
  color: #1e3a8a;
  margin: 0 0.25rem;
  font-weight: 400;
}

.debug-indicator-inline {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-left: 0.5rem;
}

/* OLD styles - keep for backward compatibility if needed */
.dynamic-header-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.order-info {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1e40af;
}

.customer-info-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  padding-top: 0.5rem;
}

.customer-number-header {
  font-weight: 600;
  color: #1e3a8a;
}

.customer-number-header.customer-missing {
  color: #dc2626;
  font-style: italic;
}

.customer-name-header {
  font-size: 0.8rem;
  color: #64748b;
  font-style: italic;
  font-weight: 400;
}

.debug-indicator-header {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-left: 0.25rem;
}

/* Debug Panel Styles */
.debug-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 500px;
  max-height: 400px;
  background: white;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #3b82f6;
  color: white;
}

.debug-header h3 {
  margin: 0;
  font-size: 1rem;
}

.close-debug {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-debug:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.debug-content {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.debug-item {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.debug-item strong {
  display: block;
  color: #1e40af;
  margin-bottom: 0.5rem;
}

.debug-values {
  font-size: 0.85rem;
  color: #4b5563;
  margin-left: 1rem;
}

.debug-values > div {
  margin: 0.25rem 0;
  font-family: 'Courier New', monospace;
}
</style>