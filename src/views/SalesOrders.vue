<!-- src/views/SalesOrders.vue -->
<template>
  <div class="sales-orders">
    <div class="page-header">
      <h2 class="page-title">Sales Orders</h2>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="showCredentialsModal = true">
          🔐 Credentials
        </button>
        <button class="btn btn-primary" @click="refresh" :disabled="loading">
          {{ loading ? 'Loading...' : 'Refresh' }}
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
          <div class="form-group">
            <label for="username">Username:</label>
            <input
              id="username"
              v-model="credentialsForm.username"
              type="text"
              placeholder="Enter SAP username"
              class="form-input"
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
            />
          </div>
          
          <div class="form-actions">
            <button class="btn btn-secondary" @click="closeCredentialsModal">
              Cancel
            </button>
            <button class="btn btn-primary" @click="saveCredentials">
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="filters-section">
      <div class="filters-grid">
        <div class="filter-group">
          <label for="dateFrom">Date From</label>
          <input
            id="dateFrom"
            v-model="dateFromInput"
            type="datetime-local"
            class="filter-input"
          />
        </div>

        <div class="filter-group">
          <label for="dateTo">Date To</label>
          <input
            id="dateTo"
            v-model="dateToInput"
            type="datetime-local"
            class="filter-input"
          />
        </div>

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
      </div>

      <div class="filters-actions">
        <button class="btn btn-primary" @click="applyFilters" :disabled="loading">
          Apply Filters
        </button>
        <button class="btn btn-secondary" @click="clearFilters" :disabled="loading">
          Clear Filters
        </button>
        <button class="btn btn-secondary" @click="setCurrentMonthRange">
          Current Month
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading sales orders from SAP...</p>
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
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="isEmpty" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>No sales orders found for the selected criteria.</p>
      <button class="btn btn-primary" @click="clearFilters">
        Clear Filters
      </button>
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
            <td>{{ order.toItem?.length || 0 }}</td>
            <td>
              <div class="actions">
                <button
                  class="btn-icon"
                  @click="viewOrder(order)"
                  title="View Details"
                >
                  👁️
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
  applyFilters,
  clearFilters,
  clearError,
  refresh,
  nextPage,
  prevPage,
  setCurrentMonthRange,
  setCredentials
} = useSalesOrders()

// Component state
const selectedOrder = ref<SalesOrderDto | null>(null)
const showCredentialsModal = ref(false)
const credentialsForm = ref({
  username: '',
  password: ''
})

// Date inputs for the filter form
const dateFromInput = ref('')
const dateToInput = ref('')

// Initialize date inputs with current month
const initializeDateInputs = () => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  
  dateFromInput.value = formatDateTimeLocal(startOfMonth)
  dateToInput.value = formatDateTimeLocal(endOfMonth)
  
  // Set the filters
  filters.reqDelDateBegin = startOfMonth.toISOString()
  filters.reqDelDateEnd = endOfMonth.toISOString()
}

// Watch date inputs and update filters
watch([dateFromInput, dateToInput], ([fromDate, toDate]) => {
  if (fromDate) {
    filters.reqDelDateBegin = new Date(fromDate).toISOString()
  }
  if (toDate) {
    filters.reqDelDateEnd = new Date(toDate).toISOString()
  }
})

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

// View order details
const viewOrder = (order: SalesOrderDto) => {
  selectedOrder.value = order
}

// Close order details modal
const closeModal = () => {
  selectedOrder.value = null
}

// Save credentials
const saveCredentials = () => {
  if (credentialsForm.value.username && credentialsForm.value.password) {
    setCredentials(credentialsForm.value.username, credentialsForm.value.password)
    closeCredentialsModal()
    // Refresh data with new credentials
    refresh()
  }
}

// Close credentials modal
const closeCredentialsModal = () => {
  showCredentialsModal.value = false
  credentialsForm.value = { username: '', password: '' }
}

// Set current month range and refresh
const setCurrentMonthRangeAndRefresh = () => {
  setCurrentMonthRange()
  initializeDateInputs()
  applyFilters()
}

// Initialize component
onMounted(() => {
  initializeDateInputs()
  refresh()
})
</script>

<style scoped>
@import '@/styles/views/SalesOrder.css';

/* Additional styles for credentials modal and improved UI */
.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.credentials-modal {
  max-width: 400px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-medium);
  border-radius: var(--border-radius-md);
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-light);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}

.order-details-modal {
  max-width: 800px;
  max-height: 90vh;
}

.detail-value {
  font-weight: 500;
  color: var(--text-primary);
}

.item-card {
  background: var(--background-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
  padding: 16px;
  margin-bottom: 12px;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-label {
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 120px;
}

.item-value {
  color: var(--text-primary);
  text-align: right;
}

.no-items {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  font-style: italic;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .header-actions .btn {
    width: 100%;
  }

  .item-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .item-label {
    min-width: auto;
  }

  .item-value {
    text-align: left;
  }
}
</style>