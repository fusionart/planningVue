<!-- src/views/Dashboard.vue - Updated for SalesOrderMain model with finalBattery -->
<template>
  <div class="dashboard">
    <h2 class="page-title">Dashboard</h2>
    <div class="dashboard-content">
      <!-- Connection Status -->
      <div class="connection-status">
        <div class="status-card" :class="connectionStatus.class">
          <div class="status-icon">{{ connectionStatus.icon }}</div>
          <div class="status-text">
            <h3>{{ connectionStatus.title }}</h3>
            <p>{{ connectionStatus.message }}</p>
          </div>
          <button 
            v-if="!hasCredentials" 
            class="btn btn-primary"
            @click="$router.push('/sales-orders')"
          >
            Setup Credentials
          </button>
        </div>
      </div>

      <!-- Sales Orders Statistics -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <h3>Total Items</h3>
            <span class="stat-icon">📋</span>
          </div>
          <p class="stat-number" v-if="!loadingStats">{{ salesStats.totalOrders || 0 }}</p>
          <div v-else class="stat-loading">Loading...</div>
          <p class="stat-description" v-if="!loadingStats">
            {{ getStatusMessage('orders') }}
          </p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <h3>Total Requested Quantity</h3>
            <span class="stat-icon">📦</span>
          </div>
          <p class="stat-number" v-if="!loadingStats">{{ formatNumber(salesStats.totalRequestedQuantity || 0) }}</p>
          <div v-else class="stat-loading">Loading...</div>
          <p class="stat-description" v-if="!loadingStats">
            Units requested across all items
          </p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <h3>Available Not Charged</h3>
            <span class="stat-icon">✅</span>
          </div>
          <p class="stat-number" v-if="!loadingStats">{{ formatNumber(salesStats.totalAvailableNotCharged || 0) }}</p>
          <div v-else class="stat-loading">Loading...</div>
          <p class="stat-description" v-if="!loadingStats">
            Total available inventory not charged
          </p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <h3>Available Charged</h3>
            <span class="stat-icon">⚡</span>
          </div>
          <p class="stat-number" v-if="!loadingStats">{{ formatNumber(salesStats.totalAvailableCharged || 0) }}</p>
          <div v-else class="stat-loading">Loading...</div>
          <p class="stat-description" v-if="!loadingStats">
            Total available inventory charged
          </p>
        </div>

        <!-- NEW: Final Battery Statistics Card -->
        <div class="stat-card">
          <div class="stat-header">
            <h3>Total Final Battery</h3>
            <span class="stat-icon">🔋</span>
          </div>
          <p class="stat-number" v-if="!loadingStats">{{ formatNumber(salesStats.totalFinalBattery || 0) }}</p>
          <div v-else class="stat-loading">Loading...</div>
          <p class="stat-description" v-if="!loadingStats">
            Total final battery quantity
          </p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <h3>Unique Plants</h3>
            <span class="stat-icon">🏭</span>
          </div>
          <p class="stat-number" v-if="!loadingStats">{{ salesStats.uniquePlants || 0 }}</p>
          <div v-else class="stat-loading">Loading...</div>
          <p class="stat-description" v-if="!loadingStats">
            Number of different plants
          </p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <h3>Unique Materials</h3>
            <span class="stat-icon">🧱</span>
          </div>
          <p class="stat-number" v-if="!loadingStats">{{ salesStats.uniqueMaterials || 0 }}</p>
          <div v-else class="stat-loading">Loading...</div>
          <p class="stat-description" v-if="!loadingStats">
            Number of different materials
          </p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h3>Quick Actions</h3>
        <div class="actions-grid">
          <router-link to="/sales-orders" class="action-card">
            <div class="action-icon">📋</div>
            <div class="action-content">
              <h4>View Sales Orders Items</h4>
              <p>Manage and track all sales order items</p>
            </div>
          </router-link>

          <router-link to="/users" class="action-card">
            <div class="action-icon">👥</div>
            <div class="action-content">
              <h4>Manage Users</h4>
              <p>User administration and settings</p>
            </div>
          </router-link>

          <router-link to="/products" class="action-card">
            <div class="action-icon">📦</div>
            <div class="action-content">
              <h4>Products Catalog</h4>
              <p>Browse and manage products</p>
            </div>
          </router-link>

          <div class="action-card" @click="refreshDashboard">
            <div class="action-icon">🔄</div>
            <div class="action-content">
              <h4>Refresh Data</h4>
              <p>Update dashboard statistics</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Orders - Only show if we have credentials and data -->
      <div class="recent-orders" v-if="hasCredentials && recentOrders.length > 0">
        <div class="section-header">
          <h3>Recent Sales Order Items</h3>
          <router-link to="/sales-orders" class="view-all-link">
            View All
          </router-link>
        </div>
        <div class="orders-list">
          <div
            v-for="order in recentOrders"
            :key="order.material"
            class="order-item"
          >
            <div class="order-info">
              <span class="order-number">{{ order.material }}</span>
              <span class="order-party">Plant: {{ order.plant }}</span>
            </div>
            <div class="order-meta">
              <span class="order-quantity">{{ formatNumber(order.requestedQuantity) }} {{ order.requestedQuantityUnit }}</span>
              <span class="order-final-battery">🔋 {{ formatNumber(order.finalBattery || 0) }}</span>
              <span
                class="order-status"
                :class="getAvailabilityStatusClass(order)"
              >
                {{ getAvailabilityStatus(order) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Battery Analysis Overview -->
      <div class="battery-analysis-overview" v-if="hasCredentials && hasData">
        <div class="section-header">
          <h3>Battery Analysis Overview</h3>
        </div>
        <div class="battery-stats">
          <div class="battery-stat">
            <div class="stat-label">Average Final Battery per Item</div>
            <div class="stat-value">{{ getAverageFinalBattery() }}</div>
            <div class="stat-description">Average final battery quantity across all items</div>
          </div>
          
          <div class="battery-comparison">
            <div class="comparison-item">
              <span class="comparison-label">Total Requested:</span>
              <span class="comparison-value">{{ formatNumber(salesStats.totalRequestedQuantity || 0) }}</span>
            </div>
            <div class="comparison-item">
              <span class="comparison-label">Total Final Battery:</span>
              <span class="comparison-value">{{ formatNumber(salesStats.totalFinalBattery || 0) }}</span>
            </div>
            <div class="comparison-item">
              <span class="comparison-label">Battery Efficiency:</span>
              <span class="comparison-value">{{ getBatteryEfficiency() }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Availability Overview -->
      <div class="availability-overview" v-if="hasCredentials && hasData">
        <div class="section-header">
          <h3>Availability Overview</h3>
        </div>
        <div class="availability-stats">
          <div class="availability-stat">
            <div class="stat-label">Overall Fulfillment Rate</div>
            <div class="stat-value">{{ getOverallFulfillmentRate() }}%</div>
            <div class="stat-bar">
              <div 
                class="stat-bar-fill" 
                :style="{ width: getOverallFulfillmentRate() + '%' }"
                :class="getFulfillmentBarClass(getOverallFulfillmentRate())"
              ></div>
            </div>
          </div>
          <div class="availability-breakdown">
            <div class="breakdown-item">
              <span class="breakdown-label">Full Availability:</span>
              <span class="breakdown-value">{{ getAvailabilityBreakdown().full }} items</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">Partial Availability:</span>
              <span class="breakdown-value">{{ getAvailabilityBreakdown().partial }} items</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">Low Availability:</span>
              <span class="breakdown-value">{{ getAvailabilityBreakdown().low }} items</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error && hasCredentials" class="error-section">
        <div class="error-content">
          <div class="error-icon">❌</div>
          <h3>Error Loading Data</h3>
          <p class="error-message">{{ error }}</p>
          <div class="error-actions">
            <button class="btn btn-primary" @click="clearError">
              Dismiss
            </button>
            <button class="btn btn-secondary" @click="refreshDashboard">
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { salesOrderService } from '@/services/salesOrderService'
import type { SalesOrderMain } from '@/types/api'

const salesStats = ref({
  totalOrders: 0,
  totalRequestedQuantity: 0,
  totalAvailableNotCharged: 0,
  totalAvailableCharged: 0,
  totalFinalBattery: 0,  // NEW: Final battery total
  uniquePlants: 0,
  uniqueMaterials: 0
})

const recentOrders = ref<SalesOrderMain[]>([])
const loadingStats = ref(false)
const loadingOrders = ref(false)
const error = ref<string | null>(null)

// Check if credentials are available
const hasCredentials = computed(() => {
  return salesOrderService.hasCredentials()
})

// Check if we have data
const hasData = computed(() => {
  return salesStats.value.totalOrders > 0
})

// Connection status computed property
const connectionStatus = computed(() => {
  if (!hasCredentials.value) {
    return {
      class: 'status-warning',
      icon: '🔓',
      title: 'SAP Connection Required',
      message: 'Please setup your SAP credentials to view sales data.'
    }
  }

  if (error.value) {
    return {
      class: 'status-error',
      icon: '❌',
      title: 'Connection Error',
      message: 'Failed to connect to SAP system. Check your credentials.'
    }
  }

  if (loadingStats.value || loadingOrders.value) {
    return {
      class: 'status-loading',
      icon: '⏳',
      title: 'Loading Data',
      message: 'Connecting to SAP system and loading sales data...'
    }
  }

  return {
    class: 'status-success',
    icon: '✅',
    title: 'Connected to SAP',
    message: 'Successfully connected and data is up to date.'
  }
})

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
    case 'Full': return 'status-complete'
    case 'Partial': return 'status-partial'
    case 'Low': return 'status-low'
    default: return 'status-partial'
  }
}

// NEW: Battery analysis functions
const getAverageFinalBattery = () => {
  if (salesStats.value.totalOrders === 0) return '0'
  const average = salesStats.value.totalFinalBattery / salesStats.value.totalOrders
  return formatNumber(Math.round(average))
}

const getBatteryEfficiency = () => {
  if (salesStats.value.totalRequestedQuantity === 0) return 0
  return Math.round((salesStats.value.totalFinalBattery / salesStats.value.totalRequestedQuantity) * 100)
}

// Overall fulfillment rate calculation
const getOverallFulfillmentRate = () => {
  if (salesStats.value.totalRequestedQuantity === 0) return 0
  const totalAvailable = salesStats.value.totalAvailableNotCharged + salesStats.value.totalAvailableCharged
  return Math.round((totalAvailable / salesStats.value.totalRequestedQuantity) * 100)
}

// Get availability breakdown
const getAvailabilityBreakdown = () => {
  if (recentOrders.value.length === 0) return { full: 0, partial: 0, low: 0 }
  
  const breakdown = { full: 0, partial: 0, low: 0 }
  recentOrders.value.forEach(order => {
    const status = getAvailabilityStatus(order)
    switch (status) {
      case 'Full': breakdown.full++; break
      case 'Partial': breakdown.partial++; break
      case 'Low': breakdown.low++; break
    }
  })
  
  return breakdown
}

// Get fulfillment bar class
const getFulfillmentBarClass = (rate: number) => {
  if (rate >= 80) return 'bar-success'
  if (rate >= 50) return 'bar-warning'
  return 'bar-error'
}

// Load dashboard data
const loadDashboardData = async () => {
  if (!hasCredentials.value) {
    console.log('⚠️ No credentials available, skipping data load')
    return
  }

  error.value = null
  
  // Load statistics
  loadingStats.value = true
  try {
    const stats = await salesOrderService.getSalesOrdersStats()
    salesStats.value = stats
    console.log('✅ Dashboard statistics loaded successfully')
  } catch (err) {
    console.error('❌ Failed to load sales stats:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load statistics'
  } finally {
    loadingStats.value = false
  }

  // Load recent orders (first 10)
  loadingOrders.value = true
  try {
    const response = await salesOrderService.getSalesOrdersByDate({}, { 
      page: 0, 
      size: 10
    })
    
    // Flatten recent orders from all weeks
    const allRecentOrders: SalesOrderMain[] = []
    response.content.forEach(weekData => {
      allRecentOrders.push(...weekData.salesOrderMainList)
    })
    
    // Take first 10 orders
    recentOrders.value = allRecentOrders.slice(0, 10)
    console.log('✅ Recent orders loaded successfully')
  } catch (err) {
    console.error('❌ Failed to load recent orders:', err)
    if (!error.value) {
      error.value = err instanceof Error ? err.message : 'Failed to load recent orders'
    }
  } finally {
    loadingOrders.value = false
  }
}

// Refresh dashboard data
const refreshDashboard = () => {
  console.log('🔄 Refreshing dashboard data...')
  loadDashboardData()
}

// Clear error
const clearError = () => {
  error.value = null
}

// Get status message for orders
const getStatusMessage = (type: 'orders') => {
  const total = salesStats.value.totalOrders
  if (total === 0) return 'No items found'
  if (total === 1) return '1 item found'
  return `${total} items found`
}

// Format number
const formatNumber = (value: number) => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M'
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  } else {
    return value.toLocaleString()
  }
}

// Initialize data on component mount
onMounted(() => {
  console.log('📊 Dashboard mounted, checking credentials...')
  if (hasCredentials.value) {
    console.log('✅ Credentials found, loading dashboard data')
    loadDashboardData()
  } else {
    console.log('⚠️ No credentials found, dashboard will show setup prompt')
  }
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.page-title {
  margin-bottom: 24px;
  color: var(--text-primary);
}

.connection-status {
  margin-bottom: 32px;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
}

.status-success {
  background: #d1fae5;
  border: 1px solid #10b981;
}

.status-warning {
  background: #fef3c7;
  border: 1px solid #f59e0b;
}

.status-error {
  background: #fee2e2;
  border: 1px solid #ef4444;
}

.status-loading {
  background: #dbeafe;
  border: 1px solid #3b82f6;
}

.status-icon {
  font-size: 32px;
}

.status-text {
  flex: 1;
}

.status-text h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: var(--text-primary);
}

.status-text p {
  margin: 0;
  color: var(--text-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--background-card);
  padding: 24px;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
  transition: var(--transition-fast);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stat-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.stat-icon {
  font-size: 24px;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 8px 0;
}

.stat-loading {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin: 8px 0;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.stat-description {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

.quick-actions {
  margin-bottom: 32px;
}

.quick-actions h3 {
  margin-bottom: 16px;
  color: var(--text-primary);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--background-card);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
  text-decoration: none;
  color: inherit;
  transition: var(--transition-fast);
  cursor: pointer;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.action-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
}

.action-content h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: var(--text-primary);
}

.action-content p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.recent-orders,
.availability-overview,
.battery-analysis-overview {
  background: var(--background-card);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
  padding: 24px;
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.view-all-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.view-all-link:hover {
  text-decoration: underline;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-number {
  font-weight: 600;
  color: var(--text-primary);
}

.order-party {
  font-size: 14px;
  color: var(--text-secondary);
}

.order-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.order-quantity,
.order-final-battery {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.order-final-battery {
  color: var(--color-primary);
}

.order-status {
  padding: 2px 8px;
  border-radius: var(--border-radius-sm);
  font-size: 12px;
  font-weight: 500;
}

.status-complete {
  background: var(--color-success);
  color: white;
}

.status-partial {
  background: var(--color-warning);
  color: white;
}

.status-low {
  background: var(--color-error);
  color: white;
}

/* Battery Analysis Styles */
.battery-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.battery-stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.battery-comparison {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.comparison-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
}

.comparison-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.comparison-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

/* Availability Overview Styles */
.availability-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.availability-stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-bar {
  width: 100%;
  height: 12px;
  background: var(--background-secondary);
  border-radius: 6px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease;
}

.bar-success {
  background: linear-gradient(90deg, #10b981, #059669);
}

.bar-warning {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.bar-error {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.availability-breakdown {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--background-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
}

.breakdown-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.breakdown-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.error-section {
  background: var(--background-card);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
  padding: 32px;
  text-align: center;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.error-icon {
  font-size: 48px;
}

.error-content h3 {
  margin: 0;
  color: var(--text-primary);
}

.error-message {
  color: var(--color-error);
  margin: 0;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .status-card {
    flex-direction: column;
    text-align: center;
  }

  .order-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .order-meta {
    align-items: flex-start;
  }

  .availability-breakdown,
  .battery-comparison {
    grid-template-columns: 1fr;
  }

  .breakdown-item,
  .comparison-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}
</style>