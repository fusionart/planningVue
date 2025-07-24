<!-- src/views/Dashboard.vue -->
<template>
  <div class="dashboard">
    <h2 class="page-title">Dashboard</h2>
    <div class="dashboard-content">
      <!-- Sales Orders Statistics -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <h3>Total Sales Orders</h3>
            <span class="stat-icon">📋</span>
          </div>
          <p class="stat-number">{{ salesStats.totalOrders || '-' }}</p>
          <p class="stat-change positive" v-if="!loadingStats">
            <span class="change-icon">↗</span>
            12% vs last month
          </p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <h3>Completed Orders</h3>
            <span class="stat-icon">✅</span>
          </div>
          <p class="stat-number">{{ salesStats.completedOrders || '-' }}</p>
          <p class="stat-change positive" v-if="!loadingStats">
            <span class="change-icon">↗</span>
            8% vs last month
          </p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <h3>Pending Orders</h3>
            <span class="stat-icon">⏳</span>
          </div>
          <p class="stat-number">{{ salesStats.pendingOrders || '-' }}</p>
          <p class="stat-change" v-if="!loadingStats">
            <span class="change-icon">→</span>
            Same as last month
          </p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <h3>Total Value</h3>
            <span class="stat-icon">💰</span>
          </div>
          <p class="stat-number">
            {{ salesStats.totalValue ? formatCurrency(salesStats.totalValue) : '-' }}
          </p>
          <p class="stat-change positive" v-if="!loadingStats">
            <span class="change-icon">↗</span>
            15% vs last month
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
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="recent-orders" v-if="recentOrders.length > 0">
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

      <!-- Loading States -->
      <div v-if="loadingStats || loadingOrders" class="loading-section">
        <p>Loading dashboard data...</p>
      </div>

      <!-- Error States -->
      <div v-if="error" class="error-section">
        <p class="error-message">{{ error }}</p>
        <button class="btn btn-primary" @click="loadDashboardData">
          Retry
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

// Load dashboard data
const loadDashboardData = async () => {
  error.value = null
  
  // Load statistics
  loadingStats.value = true
  try {
    const stats = await salesOrderService.getSalesOrdersStats()
    salesStats.value = stats
  } catch (err) {
    console.error('Failed to load sales stats:', err)
    error.value = 'Failed to load statistics'
  } finally {
    loadingStats.value = false
  }

  // Load recent orders
  loadingOrders.value = true
  try {
    const response = await salesOrderService.getSalesOrders({}, { page: 0, size: 5, sort: 'requestedDeliveryDate', direction: 'desc' })
    recentOrders.value = response.content
  } catch (err) {
    console.error('Failed to load recent orders:', err)
    if (!error.value) {
      error.value = 'Failed to load recent orders'
    }
  } finally {
    loadingOrders.value = false
  }
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
  loadDashboardData()
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

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  margin: 0;
}

.stat-change.positive {
  color: var(--color-success);
}

.change-icon {
  font-size: 14px;
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

.loading-section,
.error-section {
  text-align: center;
  padding: 40px 20px;
  background: var(--background-card);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
}

.error-message {
  color: var(--color-error);
  margin-bottom: 16px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
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