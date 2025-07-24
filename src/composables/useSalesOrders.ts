// src/composables/useSalesOrders.ts

import { ref, reactive, computed, onMounted } from 'vue'
import { salesOrderService } from '@/services/salesOrderService'
import type { SalesOrderDto, PaginatedResponse } from '@/types/api'
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
    salesOrderNumber: '',
    soldToParty: '',
    requestedDeliveryWeek: '',
    completeDelivery: undefined,
    dateFrom: '',
    dateTo: ''
  })

  // Computed properties
  const hasData = computed(() => salesOrders.value.length > 0)
  const hasError = computed(() => error.value !== null)
  const isEmpty = computed(() => !loading.value && !hasData.value && !hasError.value)

  // Clear error
  const clearError = () => {
    error.value = null
  }

  // Fetch sales orders with current filters and pagination
  const fetchSalesOrders = async () => {
    loading.value = true
    error.value = null
    
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '' && value !== undefined)
      )

      const paginationParams: PaginationParams = {
        page: pagination.page,
        size: pagination.size
      }

      const response: PaginatedResponse<SalesOrderDto> = await salesOrderService.getSalesOrders(
        activeFilters,
        paginationParams
      )

      salesOrders.value = response.content
      pagination.totalElements = response.totalElements
      pagination.totalPages = response.totalPages
      pagination.first = response.first
      pagination.last = response.last
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch sales orders'
      salesOrders.value = []
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
      pagination.totalElements = response.totalElements
      pagination.totalPages = response.totalPages
      pagination.first = response.first
      pagination.last = response.last
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to search sales orders'
      salesOrders.value = []
    } finally {
      loading.value = false
    }
  }

  // Create new sales order
  const createSalesOrder = async (salesOrderData: Omit<SalesOrderDto, 'salesOrderNumber'>) => {
    loading.value = true
    error.value = null
    
    try {
      const newSalesOrder = await salesOrderService.createSalesOrder(salesOrderData)
      salesOrders.value.unshift(newSalesOrder)
      return newSalesOrder
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create sales order'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update sales order
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
      error.value = err instanceof Error ? err.message : 'Failed to update sales order'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete sales order
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
      error.value = err instanceof Error ? err.message : 'Failed to delete sales order'
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
    Object.keys(filters).forEach(key => {
      filters[key as keyof SalesOrderFilters] = key === 'completeDelivery' ? undefined : ''
    })
    pagination.page = 0
    fetchSalesOrders()
  }

  // Refresh data
  const refresh = () => {
    fetchSalesOrders()
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
    refresh
  }
}