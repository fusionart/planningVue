import { ref, reactive, computed, onMounted } from 'vue'
import { salesOrderService } from '@/services/salesOrderService'
import type { SalesOrderDto } from '@/types/api'
import type { SalesOrderFilters, PaginationParams } from '@/services/salesOrderService'

export function useSalesOrders() {
  const salesOrders = ref<SalesOrderDto[]>([])
  const currentSalesOrder = ref<SalesOrderDto | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const pagination = reactive({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true
  })

  const filters = reactive<SalesOrderFilters>({
    reqDelDateBegin: '',
    reqDelDateEnd: '',
    salesOrderNumber: '',
    soldToParty: ''
  })

  // Computed properties
  const hasData = computed(() => salesOrders.value.length > 0)
  const hasError = computed(() => error.value !== null)
  const isEmpty = computed(() => !loading.value && !hasData.value && !hasError.value)

  // Clear error
  const clearError = () => {
    error.value = null
  }

  // Calculate pagination info
  const updatePaginationInfo = (total: number) => {
    pagination.totalElements = total
    pagination.totalPages = Math.ceil(total / pagination.size)
    pagination.first = pagination.page === 0
    pagination.last = pagination.page >= pagination.totalPages - 1
  }

  // Fetch sales orders with current filters and pagination
  const fetchSalesOrders = async () => {
    loading.value = true
    error.value = null
    
    try {
      const activeFilters: SalesOrderFilters = {}
      
      // Only include non-empty filters
      if (filters.reqDelDateBegin) activeFilters.reqDelDateBegin = filters.reqDelDateBegin
      if (filters.reqDelDateEnd) activeFilters.reqDelDateEnd = filters.reqDelDateEnd
      if (filters.salesOrderNumber) activeFilters.salesOrderNumber = filters.salesOrderNumber
      if (filters.soldToParty) activeFilters.soldToParty = filters.soldToParty

      const paginationParams: PaginationParams = {
        page: pagination.page,
        size: pagination.size
      }

      const response = await salesOrderService.getSalesOrders(activeFilters, paginationParams)
      
      salesOrders.value = response.content
      updatePaginationInfo(response.total)
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch sales orders'
      salesOrders.value = []
      updatePaginationInfo(0)
    } finally {
      loading.value = false
    }
  }

  // Fetch single sales order by number
  const fetchSalesOrderByNumber = async (salesOrderNumber: string) => {
    loading.value = true
    error.value = null
    
    try {
      currentSalesOrder.value = await salesOrderService.getSalesOrderByNumber(salesOrderNumber)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch sales order'
      currentSalesOrder.value = null
    } finally {
      loading.value = false
    }
  }

  // Search sales orders
  const searchSalesOrders = async (query: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await salesOrderService.searchSalesOrders(query, {
        page: pagination.page,
        size: pagination.size
      })

      salesOrders.value = response.content
      updatePaginationInfo(response.total)
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to search sales orders'
      salesOrders.value = []
      updatePaginationInfo(0)
    } finally {
      loading.value = false
    }
  }

  // Set date range filter
  const setDateRange = (startDate: Date, endDate: Date) => {
    filters.reqDelDateBegin = formatDateForBackend(startDate)
    filters.reqDelDateEnd = formatDateForBackend(endDate)
  }

  // Set current month as default date range
  const setCurrentMonthRange = () => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    filters.reqDelDateBegin = formatDateForBackend(startOfMonth)
    filters.reqDelDateEnd = formatDateForBackend(endOfMonth)
  }

  // Create new sales order (not supported by backend)
  const createSalesOrder = async (salesOrderData: Omit<SalesOrderDto, 'salesOrderNumber'>) => {
    loading.value = true
    error.value = null
    
    try {
      const newSalesOrder = await salesOrderService.createSalesOrder(salesOrderData)
      salesOrders.value.unshift(newSalesOrder)
      return newSalesOrder
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Create operation not supported'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update sales order (not supported by backend)
  const updateSalesOrder = async (salesOrderNumber: string, updates: Partial<SalesOrderDto>) => {
    loading.value = true
    error.value = null
    
    try {
      const updatedSalesOrder = await salesOrderService.updateSalesOrder(salesOrderNumber, updates)
      
      const index = salesOrders.value.findIndex(so => so.salesOrderNumber === salesOrderNumber)
      if (index !== -1) {
        salesOrders.value[index] = updatedSalesOrder
      }
      
      if (currentSalesOrder.value?.salesOrderNumber === salesOrderNumber) {
        currentSalesOrder.value = updatedSalesOrder
      }
      
      return updatedSalesOrder
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Update operation not supported'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete sales order (not supported by backend)
  const deleteSalesOrder = async (salesOrderNumber: string) => {
    loading.value = true
    error.value = null
    
    try {
      await salesOrderService.deleteSalesOrder(salesOrderNumber)
      salesOrders.value = salesOrders.value.filter(so => so.salesOrderNumber !== salesOrderNumber)
      
      if (currentSalesOrder.value?.salesOrderNumber === salesOrderNumber) {
        currentSalesOrder.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Delete operation not supported'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Pagination methods
  const nextPage = () => {
    if (!pagination.last) {
      pagination.page++
      fetchSalesOrders()
    }
  }

  const prevPage = () => {
    if (!pagination.first) {
      pagination.page--
      fetchSalesOrders()
    }
  }

  const goToPage = (page: number) => {
    if (page >= 0 && page < pagination.totalPages) {
      pagination.page = page
      fetchSalesOrders()
    }
  }

  // Apply filters
  const applyFilters = () => {
    pagination.page = 0 // Reset to first page when filtering
    fetchSalesOrders()
  }

  // Clear filters
  const clearFilters = () => {
    filters.reqDelDateBegin = ''
    filters.reqDelDateEnd = ''
    filters.salesOrderNumber = ''
    filters.soldToParty = ''
    pagination.page = 0
    fetchSalesOrders()
  }

  // Set credentials for API calls
  const setCredentials = (username: string, password: string) => {
    salesOrderService.setCredentials(username, password)
  }

  // Clear credentials
  const clearCredentials = () => {
    salesOrderService.clearCredentials()
  }

  // Refresh data
  const refresh = () => {
    fetchSalesOrders()
  }

  // Initialize with current month by default
  const initialize = () => {
    setCurrentMonthRange()
    fetchSalesOrders()
  }

const formatDateForBackend = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

  return {
    // State
    salesOrders,
    currentSalesOrder,
    loading,
    error,
    pagination,
    filters,
    
    // Computed
    hasData,
    hasError,
    isEmpty,
    
    // Methods
    fetchSalesOrders,
    fetchSalesOrderByNumber,
    searchSalesOrders,
    createSalesOrder,
    updateSalesOrder,
    deleteSalesOrder,
    nextPage,
    prevPage,
    goToPage,
    applyFilters,
    clearFilters,
    clearError,
    refresh,
    initialize,
    setDateRange,
    setCurrentMonthRange,
    setCredentials,
    clearCredentials
  }
}