<!-- src/components/SalesOrders/ProductionOrdersModal.vue -->
<template>
  <div v-if="show" class="modal-overlay" @click.self="handleClose">
    <div class="modal-container">
      <!-- Modal Header -->
      <div class="modal-header">
        <h3 class="modal-title">
          <span class="material-icon">🏭</span>
          Производствени поръчки за материал: 
          <span class="material-code">{{ material }}</span>
        </h3>
        <button class="modal-close-btn" @click="handleClose" type="button" aria-label="Затвори">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Зареждане на производствени поръчки...</p>
          <p class="loading-sub">Материал: {{ material }}</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h4>Грешка при зареждане</h4>
          <p class="error-message">{{ error }}</p>
          <div class="error-actions">
            <button class="btn btn-primary" @click="handleRetry">
              🔄 Опитай отново
            </button>
            <button class="btn btn-secondary" @click="handleClose">
              Затвори
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="productionOrders.length === 0 && !loading" class="empty-state">
          <div class="empty-icon">📋</div>
          <h4>Няма производствени поръчки</h4>
          <p>Няма намерени производствени поръчки за материал <strong>{{ material }}</strong>.</p>
          <p class="empty-sub">
            Период: {{ formattedDateRange }}
          </p>
          <div class="empty-actions">
            <button class="btn btn-primary" @click="handleRefresh">
              🔄 Обнови
            </button>
            <button class="btn btn-secondary" @click="handleClose">
              Затвори
            </button>
          </div>
        </div>

        <!-- Production Orders Table -->
        <div v-else class="table-container">
          <!-- Table Header Info -->
          <div class="table-header-info">
            <div class="table-info">
              <span class="info-badge">
                📊 Намерени: <strong>{{ productionOrders.length }}</strong> производствени поръчки
              </span>
              <span class="info-badge">
                📅 Период: {{ formattedDateRange }}
              </span>
              <span class="info-badge">
                🎯 Материал: <strong>{{ material }}</strong>
              </span>
            </div>
            
            <!-- Quick Actions -->
            <div class="quick-actions">
              <button class="btn btn-sm btn-outline" @click="handleRefresh" :disabled="loading">
                🔄 Обнови
              </button>
              <button class="btn btn-sm btn-outline" @click="exportToCSV" v-if="productionOrders.length > 0">
                📥 Експорт CSV
              </button>
            </div>
          </div>
          
          <!-- Table Wrapper -->
          <div class="table-wrapper">
            <table class="production-orders-table">
              <thead>
                <tr>
                  <th class="col-order">Производствена поръчка</th>
                  <th class="col-description">Описание на материала</th>
                  <th class="col-plant">Завод</th>
                  <th class="col-status">Статус</th>
                  <th class="col-supervisor">Отговорник</th>
                  <th class="col-work-center">Работен център</th>
                  <th class="col-dates">Планирани дати</th>
                  <th class="col-quantities">Количества</th>
                  <th class="col-version">Версия</th>
                  <th class="col-sales-order">Клиентска поръчка</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(order, index) in productionOrders" 
                  :key="order.productionOrder"
                  class="table-row"
                  :class="{ 'row-even': index % 2 === 0, 'row-odd': index % 2 === 1 }"
                >
                  <!-- Production Order -->
                  <td class="cell-production-order">
                    <div class="order-info">
                      <strong class="order-number">{{ order.productionOrder }}</strong>
                      <div class="order-meta">
                        <span class="material-code">{{ order.material }}</span>
                      </div>
                    </div>
                  </td>

                  <!-- Material Description -->
                  <td class="cell-description">
                    <div class="description-text" :title="order.materialDescription">
                      {{ order.materialDescription || 'Няма описание' }}
                    </div>
                  </td>

                  <!-- Plant -->
                  <td class="cell-plant">
                    <span class="plant-code">{{ order.productionPlant }}</span>
                  </td>

                  <!-- Status -->
                  <td class="cell-status">
                    <div class="status-container">
                      <div class="status-badges">
                        <span 
                          class="status-badge"
                          :class="{ 
                            'status-released': order.orderIsReleased,
                            'status-not-released': !order.orderIsReleased 
                          }"
                          :title="order.orderIsReleased ? 'Поръчката е пусната в производство' : 'Поръчката не е пусната'"
                        >
                          {{ order.orderIsReleased ? '✅ Пуснат' : '❌ Не е пуснат' }}
                        </span>
                        <span 
                          class="status-badge"
                          :class="{ 
                            'status-scheduled': order.orderIsScheduled,
                            'status-not-scheduled': !order.orderIsScheduled 
                          }"
                          :title="order.orderIsScheduled ? 'Поръчката е планирана' : 'Поръчката не е планирана'"
                        >
                          {{ order.orderIsScheduled ? '📅 Планиран' : '⏳ Не е планиран' }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Production Supervisor -->
                  <td class="cell-supervisor">
                    <span class="supervisor-name">
                      {{ order.productionSupervisor || 'Неопределен' }}
                    </span>
                  </td>

                  <!-- Work Center -->
                  <td class="cell-work-center">
                    <div class="work-center-info">
                      <div class="work-center-code">{{ order.workCenter || 'N/A' }}</div>
                      <div class="work-center-desc" :title="order.workCenterDescription">
                        {{ order.workCenterDescription || 'Няма описание' }}
                      </div>
                    </div>
                  </td>

                  <!-- Planned Dates -->
                  <td class="cell-dates">
                    <div class="dates-container">
                      <div class="date-row">
                        <span class="date-label">От:</span>
                        <div class="date-time-info">
                          <span class="date">{{ formatDisplayDate(order.mfgOrderScheduledStartDate) }}</span>
                          <span class="time">{{ formatDisplayTime(order.mfgOrderScheduledStartTime) }}</span>
                        </div>
                      </div>
                      <div class="date-row">
                        <span class="date-label">До:</span>
                        <div class="date-time-info">
                          <span class="date">{{ formatDisplayDate(order.mfgOrderScheduledEndDate) }}</span>
                          <span class="time">{{ formatDisplayTime(order.mfgOrderScheduledEndTime) }}</span>
                        </div>
                      </div>
                      <div class="duration-info" v-if="calculateDuration(order)">
                        <span class="duration">⏱️ {{ calculateDuration(order) }}</span>
                      </div>
                    </div>
                  </td>

                  <!-- Quantities -->
                  <td class="cell-quantities">
                    <div class="quantities-container">
                      <div class="quantity-row">
                        <span class="quantity-label">Общо:</span>
                        <span class="quantity-value total-qty">
                          {{ formatQuantity(order.totalQuantity) }}
                        </span>
                      </div>
                      <div class="quantity-row">
                        <span class="quantity-label">Потвърдено:</span>
                        <span class="quantity-value confirmed-qty">
                          {{ formatQuantity(order.mfgOrderConfirmedYieldQty) }}
                        </span>
                      </div>
                      <div class="quantity-unit">{{ order.productionUnit || 'бр.' }}</div>
                      <div class="progress-bar" v-if="order.totalQuantity > 0">
                        <div 
                          class="progress-fill"
                          :style="{ width: getCompletionPercentage(order) + '%' }"
                        ></div>
                      </div>
                    </div>
                  </td>

                  <!-- Version -->
                  <td class="cell-version">
                    <span class="version-code">{{ order.productionVersion || 'N/A' }}</span>
                  </td>

                  <!-- Sales Order -->
                  <td class="cell-sales-order">
                    <span class="sales-order-code">{{ order.salesOrder || 'Няма' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Table Summary -->
          <div class="table-summary" v-if="productionOrders.length > 0">
            <div class="summary-cards">
              <div class="summary-card">
                <div class="summary-label">Общо поръчки</div>
                <div class="summary-value">{{ productionOrders.length }}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Пуснати</div>
                <div class="summary-value">{{ releasedOrdersCount }}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Планирани</div>
                <div class="summary-value">{{ scheduledOrdersCount }}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Общо количество</div>
                <div class="summary-value">{{ totalQuantitySum }}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Потвърдено</div>
                <div class="summary-value">{{ confirmedQuantitySum }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <div class="footer-info">
          <span class="last-updated">
            Последно обновяване: {{ lastUpdated }}
          </span>
        </div>
        <div class="footer-actions">
          <button class="btn btn-secondary" @click="handleClose">
            Затвори
          </button>
          <button 
            v-if="!loading && !error"
            class="btn btn-primary" 
            @click="handleRefresh"
            :disabled="loading"
          >
            🔄 Обнови данните
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { productionOrderService, type ProductionOrderDto } from '@/services/productionOrderService'

// Props
interface Props {
  show: boolean
  material: string
  dateFrom: Date | null
  dateTo: Date | null
}

const props = defineProps<Props>()

// Events
interface Emits {
  close: []
}

const emit = defineEmits<Emits>()

// State
const productionOrders = ref<ProductionOrderDto[]>([])
const loading = ref(false)
const error = ref('')
const lastUpdated = ref('')

// Computed Properties
const formattedDateRange = computed(() => {
  if (!props.dateFrom || !props.dateTo) return 'неопределен период'
  
  const startDate = props.dateFrom.toLocaleDateString('bg-BG')
  const endDate = props.dateTo.toLocaleDateString('bg-BG')
  return `${startDate} - ${endDate}`
})

const releasedOrdersCount = computed(() => {
  return productionOrders.value.filter(order => order.orderIsReleased).length
})

const scheduledOrdersCount = computed(() => {
  return productionOrders.value.filter(order => order.orderIsScheduled).length
})

const totalQuantitySum = computed(() => {
  const sum = productionOrders.value.reduce((sum, order) => sum + (order.totalQuantity || 0), 0)
  return formatQuantity(sum)
})

const confirmedQuantitySum = computed(() => {
  const sum = productionOrders.value.reduce((sum, order) => sum + (order.mfgOrderConfirmedYieldQty || 0), 0)
  return formatQuantity(sum)
})

// Methods
const fetchProductionOrders = async () => {
  if (!props.material || !props.dateFrom || !props.dateTo) {
    console.warn('Missing required parameters for fetching production orders')
    return
  }

  loading.value = true
  error.value = ''
  
  try {
    console.log(`🔍 Fetching production orders for material: ${props.material}`)
    
    const orders = await productionOrderService.getProductionOrdersByMaterial(
      props.material,
      props.dateFrom,
      props.dateTo
    )
    
    productionOrders.value = orders
    lastUpdated.value = new Date().toLocaleString('bg-BG')
    
    console.log(`✅ Loaded ${orders.length} production orders for material ${props.material}`)
    
  } catch (err) {
    console.error('❌ Failed to fetch production orders:', err)
    error.value = err instanceof Error ? err.message : 'Грешка при зареждане на производствените поръчки'
    productionOrders.value = []
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  emit('close')
}

const handleRetry = () => {
  fetchProductionOrders()
}

const handleRefresh = () => {
  fetchProductionOrders()
}

const formatDisplayDate = (dateStr: string): string => {
  return productionOrderService.formatDisplayDate(dateStr)
}

const formatDisplayTime = (timeStr: string): string => {
  return productionOrderService.formatDisplayTime(timeStr)
}

const formatQuantity = (quantity: number): string => {
  return productionOrderService.formatQuantity(quantity)
}

const calculateDuration = (order: ProductionOrderDto): string => {
  if (!order.mfgOrderScheduledStartDate || !order.mfgOrderScheduledEndDate) return ''
  
  try {
    const startDate = new Date(order.mfgOrderScheduledStartDate + 'T' + (order.mfgOrderScheduledStartTime || '00:00:00'))
    const endDate = new Date(order.mfgOrderScheduledEndDate + 'T' + (order.mfgOrderScheduledEndTime || '23:59:59'))
    
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 ден'
    if (diffDays > 1) return `${diffDays} дни`
    
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
    if (diffHours === 1) return '1 час'
    if (diffHours > 1) return `${diffHours} часа`
    
    return 'По-малко от час'
  } catch {
    return ''
  }
}

const getCompletionPercentage = (order: ProductionOrderDto): number => {
  if (!order.totalQuantity || order.totalQuantity === 0) return 0
  return Math.min(100, Math.max(0, (order.mfgOrderConfirmedYieldQty / order.totalQuantity) * 100))
}

const exportToCSV = () => {
  if (productionOrders.value.length === 0) return
  
  const headers = [
    'Производствена поръчка',
    'Материал', 
    'Описание',
    'Завод',
    'Пуснат',
    'Планиран',
    'Отговорник',
    'Работен център',
    'Описание на работния център',
    'Начална дата',
    'Начален час',
    'Крайна дата',
    'Краен час',
    'Общо количество',
    'Потвърдено количество',
    'Единица',
    'Версия',
    'Клиентска поръчка'
  ]
  
  const csvData = productionOrders.value.map(order => [
    order.productionOrder,
    order.material,
    order.materialDescription || '',
    order.productionPlant,
    order.orderIsReleased ? 'Да' : 'Не',
    order.orderIsScheduled ? 'Да' : 'Не',
    order.productionSupervisor || '',
    order.workCenter || '',
    order.workCenterDescription || '',
    order.mfgOrderScheduledStartDate || '',
    order.mfgOrderScheduledStartTime || '',
    order.mfgOrderScheduledEndDate || '',
    order.mfgOrderScheduledEndTime || '',
    order.totalQuantity || 0,
    order.mfgOrderConfirmedYieldQty || 0,
    order.productionUnit || '',
    order.productionVersion || '',
    order.salesOrder || ''
  ])
  
  const csvContent = [headers, ...csvData]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `производствени_поръчки_${props.material}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Escape key handler
const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.show) {
    handleClose()
  }
}

// Watchers
watch(() => props.show, (newShow) => {
  if (newShow && props.material) {
    fetchProductionOrders()
    // Prevent body scroll when modal opens
    document.body.classList.add('modal-open')
  } else {
    // Re-enable body scroll when modal closes
    document.body.classList.remove('modal-open')
  }
})

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
  document.body.classList.remove('modal-open')
})
</script>

<style scoped>
@import '@/styles/components/SalesOrders/ProductionOrdersModal.css';
</style>