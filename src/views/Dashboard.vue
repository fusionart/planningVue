<!-- src/views/Dashboard.vue - Updated without mock data -->
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
            <h3>Total Sales Orders</h3>
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
            <h3>Completed Orders</h3>
            <span class="stat-icon">✅</span>
          </div>
          <p class="stat-number" v-if="!loadingStats">{{ salesStats.completedOrders || 0 }}</p>
          <div v-else class="stat-loading">Loading...</div>
          <p class="stat-description" v-if="!loadingStats">
            {{ getCompletionRate() }}% completion rate
          </p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <h3>Pending Orders</h3>
            <span class="stat-icon">⏳</span>
          </div>
          <p class="stat-number" v-if="!loadingStats">{{ salesStats.pendingOrders || 0 }}</p>
          <div v-else class="stat-loading">Loading...</div>
          <p class="stat-description" v-if="!loadingStats">
            {{ getStatusMessage('pending') }}
          </p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <h3>Total Value</h3>
            <span class="stat-icon">💰</span>
          </div>
          <p class="stat-number" v-if="!loadingStats">
            {{ salesStats.totalValue ? formatCurrency(salesStats.totalValue) : '$0' }}
          </p>
          <div v-else class="stat-loading">Loading...</div>
          <p class="stat-description" v-if="!loadingStats">
            Estimated total value
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
              <h4>View Sales Orders</h4>
              <p>Manage and track all sales orders</p>
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
          <h3>Recent Sales Orders</h3>
          <router-link to="/sales-orders" class="view-all-link">
            View All
          </router-link>
        </div>
        <div class="orders-list">
          <div
            v-for="order in recentOrders"
            :key="order.salesOrderNumber"
            class="order-item"
          >
            <div class="order-info">
              <span class="order-number">{{ order.salesOrderNumber }}</span>
              <span class="order-party">{{ order.soldToParty }}</span>
            </div>
            <div class="order-meta">
              <span class="order-date">{{ formatDate(order.requestedDeliveryDate) }}</span>
              <span
                class="order-status"
                :class="order.completeDelivery ? 'status-complete' : 'status-partial'"
              >
                {{ order.completeDelivery ? 'Complete' : 'Partial' }}
              </span>
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
import type { SalesOrderDto } from '@/types/api'

const salesStats = ref({
  totalOrders: 0,
  completedOrders: 0,
  pendingOrders: 0,
  totalValue: 0
})

const recentOrders = ref<SalesOrderDto[]>([])
const loadingStats = ref(false)
const loadingOrders = ref(false)
const error = ref<string | null>(null)

// Check if credentials are available
const hasCredentials = computed(() => {
  return salesOrderService.hasCredentials()
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

  // Load recent orders
  loadingOrders.value = true
  try {
    const response = await salesOrderService.getSalesOrders({}, { 
      page: 0, 
      size: 5, 
      sort: 'requestedDeliveryDate', 
      direction: 'desc' 
    })
    recentOrders.value = response.content
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
const getStatusMessage = (type: 'orders' | 'pending') => {
  if (type === 'orders') {
    const total = salesStats.value.totalOrders
    if (total === 0) return 'No orders found'
    if (total === 1) return '1 order found'
    return `${total} orders found`
  } else {
    const pending = salesStats.value.pendingOrders
    if (pending === 0) return 'All orders complete'
    if (pending === 1) return '1 pending order'
    return `${pending} pending orders`
  }
}

// Get completion rate
const getCompletionRate = () => {
  const total = salesStats.value.totalOrders
  const completed = salesStats.value.completedOrders
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value)
}

// Format date
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit'
    })
  } catch {
    return dateString
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

.recent-orders {
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

.order-date {
  font-size: 14px;
  color: var(--text-secondary);
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
}
</style>