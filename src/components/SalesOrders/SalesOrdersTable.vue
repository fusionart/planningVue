<!-- SalesOrdersTable.vue - Complete with Material Click Functionality -->
<template>
  <div class="custom-datatable-container">
    <div class="table-wrapper">
      <table class="sales-orders-table-custom">
        <thead>
          <!-- First Header Row - Category Groups -->
          <tr class="header-categories">
            <th colspan="2" class="header-basic">Основни данни</th>
            <th colspan="7" class="header-inventory">Складови данни</th>
            <!-- Dynamic Sales Order + Customer Groups -->
            <template v-for="key in dynamicColumns" :key="key">
              <th colspan="3" class="header-dynamic">
                {{ key }} / {{ getPlannedOrderForKey(key) }}
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
              :title="'Материал - кликнете за производствени поръчки'"
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
            
            <!-- Dynamic Columns -->
            <template v-for="(key, keyIndex) in dynamicColumns" :key="key">
              <th 
                :class="['col-dynamic-qty sortable', { 'first-dynamic-group': keyIndex === 0, 'sort-active': sortColumn === `dynamic-${key}-quantity` }]"
                @click="handleSort(`dynamic-${key}-quantity`)"
              >
                Количество
                <SortIndicator :column="sortColumn" :direction="sortDirection" :current="`dynamic-${key}-quantity`" />
              </th>
              <th 
                class="col-dynamic-planned sortable"
                @click="handleSort(`dynamic-${key}-plannedOrder`)"
                :class="{ 'sort-active': sortColumn === `dynamic-${key}-plannedOrder` }"
              >
                П-ва поръчка
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
            :class="{ 'row-hover': true }"
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
            
            <!-- Dynamic Columns -->
            <template v-for="(key, keyIndex) in dynamicColumns" :key="key">
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
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
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
}

const emit = defineEmits<Emits>()

// State
const showMaterialClickFeedback = ref(false)
const lastClickedMaterial = ref('')

// Inject table utilities from parent composable if available
const tableUtils = inject('tableUtils', {
  formatNumber: (value: number) => value.toLocaleString('bg-BG'),
  formatQuantity: (quantity: number, unit: string) => `${quantity.toLocaleString('bg-BG')} ${unit}`
})

// Computed
const totalColumns = computed(() => {
  return 9 + (props.dynamicColumns.length * 3)
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

const formatNumber = (value: number): string => {
  return tableUtils.formatNumber(value)
}

const formatQuantity = (quantity: number, unit: string): string => {
  return tableUtils.formatQuantity(quantity, unit)
}

const getPlannedOrderForKey = (key: string): string => {
  for (const order of props.data) {
    if (order.dynamicSoItems?.[key]?.plannedOrder) {
      return order.dynamicSoItems[key].plannedOrder
    }
  }
  return 'N/A'
}
</script>

<style scoped>
@import '@/styles/components/SalesOrders/SalesOrdersTable.css';

/* Material column header enhancements */
.material-header {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border: 1px solid #bfdbfe !important;
  position: relative;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.header-text {
  font-weight: 700;
}

.header-subtitle {
  font-size: 0.7rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  margin-top: 0.25rem;
}

.production-hint {
  font-size: 1rem;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.material-header:hover .production-hint {
  opacity: 1;
  transform: scale(1.1);
}

/* Material cell clickable styling */
.material-clickable-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer !important;
  transition: all 0.2s ease;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
}

.material-clickable-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
  transition: left 0.5s ease;
}

.material-clickable-container:hover::before {
  left: 100%;
}

.material-clickable-container:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.15);
}

.material-code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-weight: 700;
  color: #1e40af;
  font-size: 0.9rem;
  letter-spacing: 0.5px;
}

.production-icon {
  font-size: 1rem;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.material-clickable-container:hover .production-icon {
  opacity: 1;
  transform: scale(1.1);
}

/* Row hover effects */
.row-hover:hover .cell-material .material-clickable-container {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

/* Material click feedback */
.material-click-feedback {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(59, 130, 246, 0.95);
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeInOut 2s ease-in-out;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  20%, 80% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
}

.feedback-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
}

.feedback-icon {
  font-size: 1.25rem;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.feedback-text {
  white-space: nowrap;
}

/* Enhanced table styles */
.custom-datatable-container {
  position: relative;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.table-wrapper {
  overflow-x: auto;
  max-height: 70vh;
}

.sales-orders-table-custom {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  background: white;
}

.sales-orders-table-custom th {
  background: linear-gradient(135deg, #f9fafb 0%, #f1f5f9 100%);
  padding: 1rem 0.75rem;
  text-align: left;
  font-weight: 700;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sales-orders-table-custom td {
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
  background: white;
  transition: background-color 0.2s ease;
}

.data-row {
  cursor: pointer;
  transition: all 0.2s ease;
}

.data-row:hover {
  background: #f8fafc !important;
}

.data-row:hover .cell-material .material-clickable-container {
  border-color: #3b82f6 !important;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
}

/* Header category styles */
.header-categories th {
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  color: white;
  font-weight: 700;
  text-align: center;
  padding: 0.75rem;
  border-bottom: 1px solid #4b5563;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.header-basic {
  background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
}

.header-inventory {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
}

.header-dynamic {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%) !important;
}

/* Sortable column styles */
.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
  transition: all 0.2s ease;
}

.sortable:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
  color: #1f2937;
}

.sort-active {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%) !important;
  color: #1e40af !important;
  font-weight: 800;
}

/* Cell specific styles */
.cell-plant {
  font-weight: 600;
  color: #374151;
  background: #f9fafb;
  font-family: monospace;
}

.cell-requested,
.cell-to-produce,
.cell-total-available,
.cell-cumulative,
.cell-available,
.cell-charged,
.cell-final-battery {
  text-align: right;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-weight: 600;
  color: #1f2937;
}

.cell-dynamic-qty {
  text-align: right;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-weight: 600;
  color: #7c3aed;
}

.cell-dynamic-planned,
.cell-dynamic-production {
  font-family: monospace;
  font-size: 0.85rem;
  color: #6b7280;
}

.first-dynamic-group {
  border-left: 3px solid #7c3aed;
}

/* No data styles */
.no-data-row {
  background: #fafbfc;
}

.no-data-cell {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
  font-style: italic;
  font-size: 1.1rem;
}

.no-data-cell::before {
  content: "📭";
  display: block;
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* Responsive design */
@media (max-width: 1200px) {
  .sales-orders-table-custom {
    font-size: 0.85rem;
  }
  
  .sales-orders-table-custom th,
  .sales-orders-table-custom td {
    padding: 0.5rem 0.375rem;
  }
  
  .material-clickable-container {
    padding: 0.375rem 0.5rem;
  }
  
  .material-code {
    font-size: 0.8rem;
  }
}

@media (max-width: 768px) {
  .sales-orders-table-custom {
    font-size: 0.8rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .production-hint {
    font-size: 0.8rem;
  }
  
  .material-click-feedback {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
  }
  
  .feedback-content {
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .sales-orders-table-custom th,
  .sales-orders-table-custom td {
    padding: 0.375rem 0.25rem;
  }
  
  .material-clickable-container {
    padding: 0.25rem 0.375rem;
    flex-direction: column;
    gap: 0.125rem;
  }
  
  .material-code {
    font-size: 0.75rem;
  }
  
  .production-icon {
    font-size: 0.8rem;
  }
  
  .material-click-feedback {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }
  
  .feedback-text {
    white-space: normal;
    text-align: center;
  }
}

/* Print styles */
@media print {
  .material-clickable-container {
    background: white !important;
    border: 1px solid #000 !important;
  }
  
  .production-icon {
    display: none !important;
  }
  
  .material-click-feedback {
    display: none !important;
  }
  
  .sales-orders-table-custom th {
    background: white !important;
    color: #000 !important;
    border: 1px solid #000 !important;
  }
  
  .data-row:hover {
    background: white !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .material-clickable-container {
    background: white;
    border: 2px solid #000;
  }
  
  .material-code {
    color: #000;
  }
  
  .sales-orders-table-custom th {
    background: white;
    color: #000;
    border: 2px solid #000;
  }
  
  .material-click-feedback {
    background: #000;
    color: #fff;
    border: 2px solid #fff;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .material-clickable-container,
  .material-clickable-container::before,
  .production-icon,
  .data-row {
    transition: none;
  }
  
  .material-clickable-container:hover {
    transform: none;
  }
  
  .feedback-icon {
    animation: none;
  }
  
  .material-click-feedback {
    animation: none;
    opacity: 1;
  }
}

/* Custom scrollbar */
.table-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Focus styles for accessibility */
.material-clickable-container:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.sortable:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

/* Loading state for material clicks */
.material-loading {
  opacity: 0.6;
  pointer-events: none;
  position: relative;
}

.material-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border: 2px solid #3b82f6;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>