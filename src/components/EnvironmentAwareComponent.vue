<!-- Example: src/components/EnvironmentAwareComponent.vue -->
<template>
  <div class="environment-aware-component">
    <!-- Environment indicator (only shown in non-production) -->
    <div v-if="!isProduction" class="environment-banner" :class="environmentClass">
      <span class="env-indicator">{{ environmentText }}</span>
      <span class="api-status">API: {{ apiBaseUrl }}</span>
    </div>

    <!-- Debug panel (only in development with debug enabled) -->
    <div v-if="showDebugPanel" class="debug-panel">
      <h4>🔧 Debug Information</h4>
      <div class="debug-grid">
        <div class="debug-item">
          <label>Environment:</label>
          <span>{{ environment.MODE }}</span>
        </div>
        <div class="debug-item">
          <label>API Base URL:</label>
          <span>{{ environment.API.BASE_URL }}</span>
        </div>
        <div class="debug-item">
          <label>Items Per Page:</label>
          <span>{{ environment.UI.ITEMS_PER_PAGE }}</span>
        </div>
        <div class="debug-item">
          <label>Mock Data:</label>
          <span>{{ isFeatureEnabled('MOCK_DATA') ? '✅' : '❌' }}</span>
        </div>
        <div class="debug-item">
          <label>Real-time Updates:</label>
          <span>{{ isFeatureEnabled('REAL_TIME_UPDATES') ? '✅' : '❌' }}</span>
        </div>
      </div>
    </div>

    <!-- Feature-dependent content -->
    <div class="feature-content">
      <!-- Show export button only if export feature is enabled -->
      <button 
        v-if="isFeatureEnabled('EXPORT_FEATURES')" 
        class="btn btn-secondary"
        @click="exportData"
      >
        📊 Export Data
      </button>

      <!-- Show bulk operations only if enabled -->
      <div v-if="isFeatureEnabled('BULK_OPERATIONS')" class="bulk-operations">
        <button class="btn btn-primary" @click="selectAll">
          Select All
        </button>
        <button class="btn btn-secondary" @click="bulkUpdate">
          Bulk Update
        </button>
        <button class="btn btn-danger" @click="bulkDelete">
          Bulk Delete
        </button>
      </div>

      <!-- Real-time status indicator -->
      <div v-if="isFeatureEnabled('REAL_TIME_UPDATES')" class="realtime-status">
        <div class="status-indicator" :class="{ active: realtimeConnected }">
          <span class="status-dot"></span>
          {{ realtimeConnected ? 'Live Updates Active' : 'Connecting...' }}
        </div>
      </div>

      <!-- Mock data warning -->
      <div v-if="isFeatureEnabled('MOCK_DATA')" class="mock-data-warning">
        <div class="warning-banner">
          🎭 Using Mock Data - API connections are simulated
        </div>
      </div>

      <!-- Pagination with environment-aware page size -->
      <div class="pagination-info">
        <span>Showing {{ paginationInfo.start }} - {{ paginationInfo.end }} of {{ totalItems }}</span>
        <span class="page-size">
          ({{ pageSize }} items per page)
        </span>
      </div>
    </div>

    <!-- Auto-refresh indicator (if enabled) -->
    <div 
      v-if="isFeatureEnabled('REAL_TIME_UPDATES') && autoRefreshEnabled" 
      class="auto-refresh-indicator"
    >
      <div class="refresh-timer">
        Next refresh in: {{ refreshCountdown }}s
      </div>
      <button class="btn-icon" @click="toggleAutoRefresh">
        {{ autoRefreshEnabled ? '⏸️' : '▶️' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { env, isDevelopment, isProduction, isFeatureEnabled, getItemsPerPage } from '@/config/env'

// Environment-aware reactive data
const environment = ref(env)
const realtimeConnected = ref(false)
const autoRefreshEnabled = ref(isFeatureEnabled('REAL_TIME_UPDATES'))
const refreshCountdown = ref(30)
const totalItems = ref(150) // Example data

// Timer references
let refreshTimer: NodeJS.Timeout | null = null
let countdownTimer: NodeJS.Timeout | null = null

// Computed properties
const isProduction = computed(() => environment.value.IS_PRODUCTION)
const showDebugPanel = computed(() => 
  isDevelopment() && isFeatureEnabled('DEBUG_MODE') && isFeatureEnabled('DEV_TOOLS')
)

const environmentClass = computed(() => ({
  'env-development': environment.value.MODE === 'development',
  'env-staging': environment.value.MODE === 'staging',
  'env-test': environment.value.MODE === 'test'
}))

const environmentText = computed(() => {
  const mode = environment.value.MODE.toUpperCase()
  const icons = {
    DEVELOPMENT: '🟡',
    STAGING: '🟠', 
    TEST: '🔵',
    PRODUCTION: '🟢'
  }
  return `${icons[mode as keyof typeof icons] || '⚪'} ${mode}`
})

const apiBaseUrl = computed(() => environment.value.API.BASE_URL)

const pageSize = computed(() => getItemsPerPage())

const paginationInfo = computed(() => ({
  start: 1,
  end: Math.min(pageSize.value, totalItems.value),
}))

// Environment-aware methods
const exportData = () => {
  if (!isFeatureEnabled('EXPORT_FEATURES')) {
    console.warn('Export feature is disabled')
    return
  }
  
  console.log('Exporting data...')
  // Implement export logic
}

const selectAll = () => {
  if (!isFeatureEnabled('BULK_OPERATIONS')) {
    console.warn('Bulk operations are disabled')
    return
  }
  
  console.log('Selecting all items...')
  // Implement select all logic
}

const bulkUpdate = () => {
  if (!isFeatureEnabled('BULK_OPERATIONS')) {
    console.warn('Bulk operations are disabled')
    return
  }
  
  console.log('Bulk updating selected items...')
  // Implement bulk update logic
}

const bulkDelete = () => {
  if (!isFeatureEnabled('BULK_OPERATIONS')) {
    console.warn('Bulk operations are disabled')
    return
  }
  
  if (confirm('Are you sure you want to delete all selected items?')) {
    console.log('Bulk deleting selected items...')
    // Implement bulk delete logic
  }
}

const toggleAutoRefresh = () => {
  autoRefreshEnabled.value = !autoRefreshEnabled.value
  
  if (autoRefreshEnabled.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  if (!isFeatureEnabled('REAL_TIME_UPDATES')) return
  
  const refreshInterval = environment.value.UI.ORDERS_AUTO_REFRESH || 60000
  
  refreshTimer = setInterval(() => {
    console.log('Auto-refreshing data...')
    // Implement refresh logic
    refreshCountdown.value = Math.floor(refreshInterval / 1000)
  }, refreshInterval)
  
  // Countdown timer
  countdownTimer = setInterval(() => {
    if (refreshCountdown.value > 0) {
      refreshCountdown.value--
    } else {
      refreshCountdown.value = Math.floor(refreshInterval / 1000)
    }
  }, 1000)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

// Lifecycle hooks
onMounted(() => {
  // Log component mounting in debug mode
  if (isFeatureEnabled('DEBUG_MODE')) {
    console.log('🔧 Environment-aware component mounted with config:', {
      mode: environment.value.MODE,
      features: Object.entries(environment.value.FEATURES)
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => feature),
      pageSize: pageSize.value
    })
  }

  // Start auto-refresh if enabled
  if (autoRefreshEnabled.value) {
    startAutoRefresh()
  }

  // Simulate real-time connection
  if (isFeatureEnabled('REAL_TIME_UPDATES')) {
    setTimeout(() => {
      realtimeConnected.value = true
    }, 2000)
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.environment-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 16px;
  border-radius: var(--border-radius-md);
}

.env-development {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
}

.env-staging {
  background: #fed7aa;
  color: #9a3412;
  border: 1px solid #ea580c;
}

.env-test {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #3b82f6;
}

.debug-panel {
  background: var(--background-secondary);
  border: 1px solid var(--border-medium);
  border-radius: var(--border-radius-lg);
  padding: 16px;
  margin-bottom: 20px;
}

.debug-panel h4 {
  margin: 0 0 12px 0;
  color: var(--text-primary);
}

.debug-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 14px;
}

.debug-item label {
  font-weight: 500;
  color: var(--text-secondary);
}

.debug-item span {
  color: var(--text-primary);
  font-family: monospace;
}

.feature-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bulk-operations {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.realtime-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
}

.status-indicator.active {
  color: var(--color-success);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-secondary);
  animation: pulse 2s infinite;
}

.status-indicator.active .status-dot {
  background: var(--color-success);
}

.mock-data-warning {
  margin: 16px 0;
}

.warning-banner {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
  padding: 12px 16px;
  border-radius: var(--border-radius-md);
  font-size: 14px;
  text-align: center;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.page-size {
  font-style: italic;
}

.auto-refresh-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: var(--background-card);
  border: 1px solid var(--border-medium);
  border-radius: var(--border-radius-lg);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow-card);
  font-size: 14px;
}

.refresh-timer {
  color: var(--text-secondary);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: var(--border-radius-sm);
  transition: var(--transition-fast);
}

.btn-icon:hover {
  background: var(--background-secondary);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Responsive design */
@media (max-width: 768px) {
  .environment-banner {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }

  .debug-grid {
    grid-template-columns: 1fr;
  }

  .bulk-operations {
    flex-direction: column;
  }

  .auto-refresh-indicator {
    bottom: 10px;
    right: 10px;
    left: 10px;
    justify-content: center;
  }
}
</style>