<!-- SalesOrdersTable.vue - Complete with Material and Planned Order Click Functionality -->
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
            
            <!-- Dynamic Columns -->
            <template v-for="(key, keyIndex) in dynamicColumns" :key="key">
              <td :class="['cell-dynamic-qty', { 'first-dynamic-group': keyIndex === 0 }]">
                {{ order.dynamicSoItems?.[key]?.quantity ? formatNumber(order.dynamicSoItems[key].quantity) : '-' }}
              </td>
              <td class="cell-dynamic-planned">
                <div 
                  v-if="order.dynamicSoItems?.[key]?.plannedOrder && order.dynamicSoItems[key].plannedOrder !== '-'"
                  class="planned-order-clickable-container"
                  @click.stop="handlePlannedOrderClick(order.dynamicSoItems[key].plannedOrder, order.material)"
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

    <!-- Planned Order Click Feedback -->
    <div v-if="showPlannedOrderClickFeedback" class="planned-order-click-feedback">
      <div class="feedback-content">
        <span class="feedback-icon">🔄</span>
        <span class="feedback-text">Отваряне на диалог за конвертиране на {{ lastClickedPlannedOrder }}...</span>
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
  'planned-order-click': [plannedOrder: string, material: string]
}

const emit = defineEmits<Emits>()

// State
const showMaterialClickFeedback = ref(false)
const lastClickedMaterial = ref('')
const showPlannedOrderClickFeedback = ref(false)
const lastClickedPlannedOrder = ref('')

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

const handlePlannedOrderClick = (plannedOrder: string, material: string) => {
  console.log(`🔄 Planned order clicked in table: ${plannedOrder} for material: ${material}`)
  
  lastClickedPlannedOrder.value = plannedOrder
  
  // Show temporary feedback (same pattern as material click)
  showPlannedOrderClickFeedback.value = true
  setTimeout(() => {
    showPlannedOrderClickFeedback.value = false
  }, 1500)
  
  // Emit the planned order click event (same pattern as material click)
  emit('planned-order-click', plannedOrder, material)
  
  console.log(`✅ Planned order click event emitted for: ${plannedOrder}`)
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
</style>