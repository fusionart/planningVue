<!-- TableFooter.vue -->
<template>
  <tfoot>
    <tr class="footer-totals">
      <td class="footer-material">{{ data.length }} записа</td>
      <td class="footer-plant">{{ getUniquePlants() }} завода</td>
      <td class="footer-requested">Общо: {{ formatNumber(getTotalRequested()) }} бр.</td>
      <td class="footer-to-produce">Общо: {{ formatNumber(getTotalToProduce()) }} бр.</td>
      <td class="footer-total-available">Общо: {{ formatNumber(getTotalAvailableQuantity()) }} бр.</td>
      <td class="footer-cumulative">Общо: {{ formatNumber(getTotalCumulativeQuantity()) }} бр.</td>
      <td class="footer-available">Общо: {{ formatNumber(getTotalAvailableNotCharged()) }} бр.</td>
      <td class="footer-charged">Общо: {{ formatNumber(getTotalAvailableCharged()) }} бр.</td>
      <td class="footer-final-battery">Общо: {{ formatNumber(getTotalFinalBattery()) }} бр.</td>
      
      <!-- Dynamic Column Totals -->
      <template v-for="(key, keyIndex) in dynamicColumns" :key="key">
        <td :class="['footer-dynamic-qty', { 'first-dynamic-group': keyIndex === 0 }]">
          Общо: {{ formatNumber(getDynamicTotal(key, 'quantity')) }} бр.
        </td>
        <td class="footer-dynamic-planned">{{ getDynamicCount(key, 'plannedOrder') }} поръчки</td>
        <td class="footer-dynamic-production">{{ getDynamicCount(key, 'productionOrder') }} поръчки</td>
      </template>
    </tr>
  </tfoot>
</template>

<script setup lang="ts">
import type { SalesOrderMain } from '@/types/api'

interface Props {
  data: SalesOrderMain[]
  dynamicColumns: string[]
}

const props = defineProps<Props>()

// Calculation methods
const formatNumber = (value: number) => {
  return value.toLocaleString()
}

const getTotalRequested = () => {
  return props.data.reduce((total, order) => total + order.requestedQuantity, 0)
}

const getTotalToProduce = () => {
  return props.data.reduce((total, order) => total + (order.toProduce || 0), 0)
}

const getTotalAvailableQuantity = () => {
  return props.data.reduce((total, order) => total + (order.totalAvailableQuantity || 0), 0)
}

const getTotalCumulativeQuantity = () => {
  return props.data.reduce((total, order) => total + (order.cumulativeQuantity || 0), 0)
}

const getTotalAvailableNotCharged = () => {
  return props.data.reduce((total, order) => total + order.availableNotCharged, 0)
}

const getTotalAvailableCharged = () => {
  return props.data.reduce((total, order) => total + order.availableCharged, 0)
}

const getTotalFinalBattery = () => {
  return props.data.reduce((total, order) => total + (order.finalBattery || 0), 0)
}

const getDynamicTotal = (key: string, field: 'quantity') => {
  return props.data.reduce((total, order) => {
    const item = order.dynamicSoItems?.[key]
    return total + (item?.[field] || 0)
  }, 0)
}

const getDynamicCount = (key: string, field: 'plannedOrder' | 'productionOrder') => {
  return props.data.filter(order => {
    const item = order.dynamicSoItems?.[key]
    return item?.[field] && item[field] !== '-' && item[field].trim() !== ''
  }).length
}

const getUniquePlants = () => {
  const plants = new Set(props.data.map(order => order.plant))
  return plants.size
}
</script>

<style scoped>
/* Footer styles */
.footer-totals td {
  background-color: #f3f4f6 !important;
  font-weight: 600 !important;
  text-align: right !important;
  border-top: 2px solid #d1d5db !important;
  padding: 0.75rem 0.5rem !important;
}

.footer-material {
  text-align: left !important;
}

.footer-plant {
  text-align: left !important;
}

.footer-cumulative,
.footer-to-produce,
.footer-total-available {
  background-color: #fef3c7 !important;
  color: #d97706 !important;
}

.footer-final-battery {
  background-color: #f0f9ff !important;
  color: var(--color-primary, #3b82f6) !important;
  border-right: 2px solid #1f2937 !important;
}

.first-dynamic-group {
  border-left: 2px solid #7c3aed !important;
}
</style>