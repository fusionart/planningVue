<!-- src/views/SalesOrders.vue -->
<template>
  <div class="sales-orders">
    <div class="page-header">
      <h2 class="page-title">Sales Orders</h2>
      <button class="btn btn-primary" @click="refresh">
        Refresh
      </button>
    </div>

    <!-- Filters Section -->
    <div class="filters-section">
      <div class="filters-grid">
        <div class="filter-group">
          <label for="salesOrderNumber">Sales Order Number</label>
          <input
            id="salesOrderNumber"
            v-model="filters.salesOrderNumber"
            type="text"
            placeholder="Enter order number"
            class="filter-input"
          />
        </div>

        <div class="filter-group">
          <label for="soldToParty">Sold To Party</label>
          <input
            id="soldToParty"
            v-model="filters.soldToParty"
            type="text"
            placeholder="Enter party name"
            class="filter-input"
          />
        </div>

        <div class="filter-group">
          <label for="deliveryWeek">Delivery Week</label>
          <input
            id="deliveryWeek"
            v-model="filters.requestedDeliveryWeek"
            type="text"
            placeholder="e.g., 2025-W04"
            class="filter-input"
          />
        </div>

        <div class="filter-group">
          <label for="completeDelivery">Complete Delivery</label>
          <select
            id="completeDelivery"
            v-model="filters.completeDelivery"
            class="filter-select"
          >
            <option :value="undefined">All</option>
            <option :value="true">Yes</option>
            <option :value="false">No</option>
          </select>
        </div>
      </div>

      <div class="filters-actions">
        <button class="btn btn-primary" @click="applyFilters" :disabled="loading">
          Apply Filters
        </button>
        <button class="btn btn-secondary" @click="clearFilters" :disabled="loading">
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <p>Loading sales orders...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button class="btn btn-primary" @click="clearError">
        Dismiss
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="isEmpty" class="empty-state">
      <p>No sales orders found.</p>
    </div>

    <!-- Sales Orders Table -->
    <div v-else class="table-container">
      <table class="sales-orders-table">
        <thead>
          <tr>
            <th>Order Number</th>
            <th>Sold To Party</th>
            <th>Delivery Date</th>
            <th>Delivery Week</th>
            <th>Complete Delivery</th>
            <th>Items Count</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="order in salesOrders"
            :key="order.salesOrderNumber"
            class="table-row"
          >
            <td class="font-semibold">{{ order.salesOrderNumber }}</td>
            <td>{{ order.soldToParty }}</td>
            <td>{{ formatDate(order.requestedDeliveryDate) }}</td>
            <td>{{ order.requestedDeliveryWeek }}</td>
            <td>
              <span
                class="status-badge"
                :class="order.completeDelivery ? 'status-success' : 'status-warning'"
              >
                {{ order.completeDelivery ? 'Complete' : 'Partial' }}
              </span>
            </td>
            <td>{{ order.toItem.length }}</td>
            <td>
              <div class="actions">
                <button
                  class="btn-icon"
                  @click="viewOrder(order)"
                  title="View Details"
                >
                  👁️
                </button>
                <button
                  class="btn-icon"
                  @click="editOrder(order)"
                  title="Edit Order"
                >
                  ✏️
                </button>
                <button
                  class="btn-icon btn-danger"
                  @click="confirmDelete(order)"
                  title="Delete Order"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="hasData" class="pagination">
      <div class="pagination-info">
        <span>
          Showing {{ pagination.page * pagination.size + 1 }} to 
          {{ Math.min((pagination.page + 1) * pagination.size, pagination.totalElements) }} 
          of {{ pagination.totalElements }} results
        </span>
      </div>
      
      <div class="pagination-controls">
        <button
          class="btn btn-secondary"
          @click="prevPage"
          :disabled="pagination.first || loading"
        >
          Previous
        </button>
        
        <span class="page-info">
          Page {{ pagination.page + 1 }} of {{ pagination.totalPages }}
        </span>
        
        <button
          class="btn btn-secondary"
          @click="nextPage"
          :disabled="pagination.last || loading"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Order Details Modal (if viewing) -->
    <div v-if="selectedOrder" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Sales Order Details</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="order-details">
            <div class="detail-group">
              <label>Order Number:</label>
              <span>{{ selectedOrder.salesOrderNumber }}</span>
            </div>
            
            <div class="detail-group">
              <label>Sold To Party:</label>
              <span>{{ selectedOrder.soldToParty }}</span>
            </div>
            
            <div class="detail-group">
              <label>Requested Delivery Date:</label>
              <span>{{ formatDate(selectedOrder.requestedDeliveryDate) }}</span>
            </div>
            
            <div class="detail-group">
              <label>Delivery Week:</label>
              <span>{{ selectedOrder.requestedDeliveryWeek }}</span>
            </div>
            
            <div class="detail-group">
              <label>Complete Delivery:</label>
              <span class="status-badge" :class="selectedOrder.completeDelivery ? 'status-success' : 'status-warning'">
                {{ selectedOrder.completeDelivery ? 'Yes' : 'No' }}
              </span>
            </div>
          </div>

          <!-- Order Items -->
          <div class="order-items">
            <h4>Order Items ({{ selectedOrder.toItem.length }})</h4>
            <div v-if="selectedOrder.toItem.length > 0" class="items-list">
              <div
                v-for="(item, index) in selectedOrder.toItem"
                :key="index"
                class="item-card"
              >
                <pre>{{ JSON.stringify(item, null, 2) }}</pre>
              </div>
            </div>
            <p v-else class="no-items">No items found for this order.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSalesOrders } from '@/composables/useSalesOrders'
import type { SalesOrderDto } from '@/types/api'

const {
  salesOrders,
  loading,
  error,
  pagination,
  filters,
  hasData,
  hasError,
  isEmpty,
  fetchSalesOrders,
  applyFilters,
  clearFilters,
  clearError,
  refresh,
  nextPage,
  prevPage,
  deleteSalesOrder
} = useSalesOrders()

const selectedOrder = ref<SalesOrderDto | null>(null)

// Initialize data on component mount
onMounted(() => {
  fetchSalesOrders()
})

// Format date for display
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    })
  } catch {
    return dateString
  }
}

// View order details
const viewOrder = (order: SalesOrderDto) => {
  selectedOrder.value = order
}

// Edit order (placeholder for future implementation)
const editOrder = (order: SalesOrderDto) => {
  console.log('Edit order:', order.salesOrderNumber)
  // TODO: Implement edit functionality
}

// Confirm delete order
const confirmDelete = async (order: SalesOrderDto) => {
  if (confirm(`Are you sure you want to delete order ${order.salesOrderNumber}?`)) {
    try {
      await deleteSalesOrder(order.salesOrderNumber)
    } catch (err) {
      console.error('Failed to delete order:', err)
    }
  }
}

// Close modal
const closeModal = () => {
  selectedOrder.value = null
}
</script>

<style scoped>
@import '@/styles/views/SalesOrder.css';
</style>