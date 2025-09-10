<!-- OrderDetailsModal.vue - Updated with proper click handling -->
<template>
  <div v-if="order" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal order-details-modal" @click.stop>
      <div class="modal-header">
        <h3>Sales Order Item Details</h3>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>
      
      <div class="modal-body">
        <div class="order-details">
          <div class="detail-group">
            <label>Material:</label>
            <span class="detail-value">{{ order.material }}</span>
          </div>
          
          <div class="detail-group">
            <label>Plant:</label>
            <span class="detail-value">{{ order.plant }}</span>
          </div>
          
          <div class="detail-group">
            <label>Requested Quantity:</label>
            <span class="detail-value">{{ order.requestedQuantity }} {{ order.requestedQuantityUnit }}</span>
          </div>

          <div class="detail-group">
            <label>To Produce:</label>
            <span class="detail-value">{{ order.toProduce || 0 }}</span>
          </div>

          <div class="detail-group">
            <label>Total Available Quantity:</label>
            <span class="detail-value">{{ order.totalAvailableQuantity || 0 }}</span>
          </div>

          <div class="detail-group">
            <label>Cumulative Quantity:</label>
            <span class="detail-value">{{ order.cumulativeQuantity || 0 }}</span>
          </div>
          
          <div class="detail-group">
            <label>Available Not Charged:</label>
            <span class="detail-value">{{ order.availableNotCharged }}</span>
          </div>
          
          <div class="detail-group">
            <label>Available Charged:</label>
            <span class="detail-value">{{ order.availableCharged }}</span>
          </div>

          <div class="detail-group">
            <label>Final Battery:</label>
            <span class="detail-value">{{ order.finalBattery || 0 }}</span>
          </div>
        </div>

        <!-- Availability Status -->
        <div class="availability-status">
          <h4>Availability Analysis</h4>
          <div class="availability-grid">
            <div class="availability-item">
              <span class="availability-label">Total Available:</span>
              <span class="availability-value">{{ getTotalAvailable(order) }}</span>
            </div>
            <div class="availability-item">
              <span class="availability-label">Fulfillment Rate:</span>
              <span class="availability-value">{{ getFulfillmentRate(order) }}%</span>
            </div>
            <div class="availability-item">
              <span class="availability-label">Status:</span>
              <span 
                class="status-badge" 
                :class="getAvailabilityStatusClass(order)"
              >
                {{ getAvailabilityStatus(order) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Dynamic SO Items -->
        <div v-if="order.dynamicSoItems && Object.keys(order.dynamicSoItems).length > 0" class="dynamic-so-items">
          <h4>Dynamic Sales Order Items</h4>
          <div class="dynamic-items-grid">
            <div
              v-for="(item, key) in order.dynamicSoItems"
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
</template>

<script setup lang="ts">
import type { SalesOrderMain } from '@/types/api'

interface Props {
  order: SalesOrderMain | null
}

defineProps<Props>()

interface Emits {
  close: []
}

const emit = defineEmits<Emits>()

// Methods
const handleOverlayClick = () => {
  emit('close')
}

// Helper functions
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
</script>

<style scoped>
@import '@/styles/components/SalesOrders/OrderDetailsModal.css';
</style>