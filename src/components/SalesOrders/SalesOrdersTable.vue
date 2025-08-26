<!-- SalesOrdersTable.vue -->
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
              class="col-material sortable" 
              @click="handleSort('material')"
              :class="{ 'sort-active': sortColumn === 'material' }"
            >
              Материал
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
          >
            <!-- Basic Information -->
            <td class="cell-material">{{ order.material }}</td>
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
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
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
}

const emit = defineEmits<Emits>()

// Inject table utilities from parent composable if available
const tableUtils = inject('tableUtils', {
  formatNumber: (value: number) => value.toLocaleString(),
  formatQuantity: (quantity: number, unit: string) => `${quantity.toLocaleString()} ${unit}`
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

const formatNumber = (value: number) => {
  return tableUtils.formatNumber(value)
}

const formatQuantity = (quantity: number, unit: string) => {
  return tableUtils.formatQuantity(quantity, unit)
}

const getPlannedOrderForKey = (key: string) => {
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