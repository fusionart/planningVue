// src/composables/useSalesOrders.ts - Updated for SalesOrderByDate model with finalBattery and cumulativeQuantity

import { ref, reactive, computed, onMounted } from 'vue'
import { salesOrderService } from '@/services/salesOrderService'
import type { SalesOrderByDate, SalesOrderMain } from '@/types/api'
import type { SalesOrderFilters, PaginationParams } from '@/services/salesOrderService'

export function useSalesOrders() {
  const salesOrdersByDate = ref<SalesOrderByDate[]>([])
  const currentSalesOrder = ref<SalesOrderMain | null>(null)
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
    material: '',
    plant: ''
  })

  // Computed properties
  const hasData = computed(() => salesOrdersByDate.value.length > 0)
  const hasError = computed(() => error.value !== null)
  const isEmpty = computed(() => !loading.value && !hasData.value && !hasError.value)

  // Get all sales orders flattened across all weeks (for backward compatibility)
  const allSalesOrders = computed(() => {
    const allOrders: SalesOrderMain[] = []
    salesOrdersByDate.value.forEach(weekData => {
      allOrders.push(...weekData.salesOrderMainList)
    })
    return allOrders
  })

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

  // Format date for backend (LocalDateTime without timezone)
  const formatDateForBackend = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    // Return LocalDateTime format: YYYY-MM-DDTHH:mm:ss (no timezone)
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
  }

  // Parse date string properly
  const parseDateString = (dateString: string): Date => {
    // Handle both ISO strings and datetime-local input values
    if (dateString.includes('Z') || dateString.includes('+')) {
      // ISO string with timezone - convert to local time
      return new Date(dateString)
    } else if (dateString.includes('T')) {
      // datetime-local format - treat as local time
      return new Date(dateString)
    } else {
      // fallback
      return new Date(dateString)
    }
  }

  // Fetch sales orders by date using current filters and pagination
  const fetchSalesOrders = async () => {
    loading.value = true
    error.value = null
    
    try {
      const activeFilters: SalesOrderFilters = {}
      
      // Convert date strings to proper LocalDateTime format
      if (filters.reqDelDateBegin) {
        const startDate = parseDateString(filters.reqDelDateBegin)
        activeFilters.reqDelDateBegin = formatDateForBackend(startDate)
      }
      
      if (filters.reqDelDateEnd) {
        const endDate = parseDateString(filters.reqDelDateEnd)
        activeFilters.reqDelDateEnd = formatDateForBackend(endDate)
      }
      
      if (filters.material) activeFilters.material = filters.material
      if (filters.plant) activeFilters.plant = filters.plant

      const paginationParams: PaginationParams = {
        page: pagination.page,
        size: pagination.size
      }

      console.log('🔍 Sending date parameters to backend:', {
        reqDelDateBegin: activeFilters.reqDelDateBegin,
        reqDelDateEnd: activeFilters.reqDelDateEnd
      })

      // Use the method that calls getSalesOrdersByDate
      const response = await salesOrderService.getSalesOrdersByDate(activeFilters, paginationParams)
      
      salesOrdersByDate.value = response.content
      updatePaginationInfo(response.total)
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch sales orders'
      salesOrdersByDate.value = []
      updatePaginationInfo(0)
    } finally {
      loading.value = false
    }
  }

  // Fetch single sales order by material
  const fetchSalesOrderByMaterial = async (material: string) => {
    loading.value = true
    error.value = null
    
    try {
      currentSalesOrder.value = await salesOrderService.getSalesOrderByMaterial(material)
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

      salesOrdersByDate.value = response.content
      updatePaginationInfo(response.total)
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to search sales orders'
      salesOrdersByDate.value = []
      updatePaginationInfo(0)
    } finally {
      loading.value = false
    }
  }

  // Set date range with proper formatting
  const setDateRange = (startDate: Date, endDate: Date) => {
    filters.reqDelDateBegin = formatDateForBackend(startDate)
    filters.reqDelDateEnd = formatDateForBackend(endDate)
  }

  // Set current month range
  const setCurrentMonthRange = () => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    
    filters.reqDelDateBegin = formatDateForBackend(startOfMonth)
    filters.reqDelDateEnd = formatDateForBackend(endOfMonth)
  }

  // Create new sales order (not supported by backend)
  const createSalesOrder = async (salesOrderData: Omit<SalesOrderMain, 'material'>) => {
    loading.value = true
    error.value = null
    
    try {
      const newSalesOrder = await salesOrderService.createSalesOrder(salesOrderData)
      // Would need to add to appropriate week - not implemented
      return newSalesOrder
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Create operation not supported'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update sales order (not supported by backend)
  const updateSalesOrder = async (material: string, updates: Partial<SalesOrderMain>) => {
    loading.value = true
    error.value = null
    
    try {
      const updatedSalesOrder = await salesOrderService.updateSalesOrder(material, updates)
      
      // Find and update in the appropriate week
      for (const weekData of salesOrdersByDate.value) {
        const index = weekData.salesOrderMainList.findIndex(so => so.material === material)
        if (index !== -1) {
          weekData.salesOrderMainList[index] = updatedSalesOrder
          break
        }
      }
      
      if (currentSalesOrder.value?.material === material) {
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
  const deleteSalesOrder = async (material: string) => {
    loading.value = true
    error.value = null
    
    try {
      await salesOrderService.deleteSalesOrder(material)
      
      // Remove from the appropriate week
      salesOrdersByDate.value.forEach(weekData => {
        weekData.salesOrderMainList = weekData.salesOrderMainList.filter(so => so.material !== material)
      })
      
      // Remove empty weeks
      salesOrdersByDate.value = salesOrdersByDate.value.filter(weekData => weekData.salesOrderMainList.length > 0)
      
      if (currentSalesOrder.value?.material === material) {
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
    filters.material = ''
    filters.plant = ''
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

  // Get statistics including final battery and cumulative quantity totals
  const getSalesOrdersStatistics = async () => {
    try {
      const stats = await salesOrderService.getSalesOrdersStats()
      return stats
    } catch (err) {
      console.error('Failed to get sales orders statistics:', err)
      throw err
    }
  }

  // Calculate final battery statistics from current data
  const getFinalBatteryStatistics = computed(() => {
    const allOrders = allSalesOrders.value
    
    if (allOrders.length === 0) {
      return {
        totalFinalBattery: 0,
        averageFinalBattery: 0,
        maxFinalBattery: 0,
        minFinalBattery: 0,
        finalBatteryEfficiency: 0 // Percentage of final battery vs requested quantity
      }
    }

    const finalBatteryValues = allOrders
      .map(order => order.finalBattery || 0)
      .filter(value => value > 0)

    const totalFinalBattery = allOrders.reduce((sum, order) => sum + (order.finalBattery || 0), 0)
    const totalRequested = allOrders.reduce((sum, order) => sum + order.requestedQuantity, 0)
    
    return {
      totalFinalBattery,
      averageFinalBattery: finalBatteryValues.length > 0 ? totalFinalBattery / finalBatteryValues.length : 0,
      maxFinalBattery: finalBatteryValues.length > 0 ? Math.max(...finalBatteryValues) : 0,
      minFinalBattery: finalBatteryValues.length > 0 ? Math.min(...finalBatteryValues) : 0,
      finalBatteryEfficiency: totalRequested > 0 ? (totalFinalBattery / totalRequested) * 100 : 0
    }
  })

  // NEW: Calculate cumulative quantity statistics from current data
  const getCumulativeQuantityStatistics = computed(() => {
    const allOrders = allSalesOrders.value
    
    if (allOrders.length === 0) {
      return {
        totalCumulativeQuantity: 0,
        averageCumulativeQuantity: 0,
        maxCumulativeQuantity: 0,
        minCumulativeQuantity: 0,
        cumulativeQuantityEfficiency: 0 // Percentage of cumulative quantity vs requested quantity
      }
    }

    const cumulativeQuantityValues = allOrders
      .map(order => order.cumulativeQuantity || 0)
      .filter(value => value > 0)

    const totalCumulativeQuantity = allOrders.reduce((sum, order) => sum + (order.cumulativeQuantity || 0), 0)
    const totalRequested = allOrders.reduce((sum, order) => sum + order.requestedQuantity, 0)
    
    return {
      totalCumulativeQuantity,
      averageCumulativeQuantity: cumulativeQuantityValues.length > 0 ? totalCumulativeQuantity / cumulativeQuantityValues.length : 0,
      maxCumulativeQuantity: cumulativeQuantityValues.length > 0 ? Math.max(...cumulativeQuantityValues) : 0,
      minCumulativeQuantity: cumulativeQuantityValues.length > 0 ? Math.min(...cumulativeQuantityValues) : 0,
      cumulativeQuantityEfficiency: totalRequested > 0 ? (totalCumulativeQuantity / totalRequested) * 100 : 0
    }
  })

  const getToProduceStatistics = computed(() => {
    const allOrders = allSalesOrders.value
    
    if (allOrders.length === 0) {
      return {
        totalToProduce: 0,
        averageToProduce: 0,
        maxToProduce: 0,
        minToProduce: 0,
        toProduceEfficiency: 0 // Percentage of to produce vs requested quantity
      }
    }

    const toProduceValues = allOrders
      .map(order => order.toProduce || 0)
      .filter(value => value > 0)

    const totalToProduce = allOrders.reduce((sum, order) => sum + (order.toProduce || 0), 0)
    const totalRequested = allOrders.reduce((sum, order) => sum + order.requestedQuantity, 0)
    
    return {
      totalToProduce,
      averageToProduce: toProduceValues.length > 0 ? totalToProduce / toProduceValues.length : 0,
      maxToProduce: toProduceValues.length > 0 ? Math.max(...toProduceValues) : 0,
      minToProduce: toProduceValues.length > 0 ? Math.min(...toProduceValues) : 0,
      toProduceEfficiency: totalRequested > 0 ? (totalToProduce / totalRequested) * 100 : 0
    }
  })

  // NEW: Calculate totalAvailableQuantity statistics from current data
  const getTotalAvailableQuantityStatistics = computed(() => {
    const allOrders = allSalesOrders.value
    
    if (allOrders.length === 0) {
      return {
        totalAvailableQuantitySum: 0,
        averageTotalAvailableQuantity: 0,
        maxTotalAvailableQuantity: 0,
        minTotalAvailableQuantity: 0,
        totalAvailableEfficiency: 0 // Percentage of total available vs requested quantity
      }
    }

    const totalAvailableValues = allOrders
      .map(order => order.totalAvailableQuantity || 0)
      .filter(value => value > 0)

    const totalAvailableQuantitySum = allOrders.reduce((sum, order) => sum + (order.totalAvailableQuantity || 0), 0)
    const totalRequested = allOrders.reduce((sum, order) => sum + order.requestedQuantity, 0)
    
    return {
      totalAvailableQuantitySum,
      averageTotalAvailableQuantity: totalAvailableValues.length > 0 ? totalAvailableQuantitySum / totalAvailableValues.length : 0,
      maxTotalAvailableQuantity: totalAvailableValues.length > 0 ? Math.max(...totalAvailableValues) : 0,
      minTotalAvailableQuantity: totalAvailableValues.length > 0 ? Math.min(...totalAvailableValues) : 0,
      totalAvailableEfficiency: totalRequested > 0 ? (totalAvailableQuantitySum / totalRequested) * 100 : 0
    }
  })

  // Helper function to calculate final battery statistics for a specific week
  const getWeekFinalBatteryStats = (weekData: SalesOrderByDate) => {
    const orders = weekData.salesOrderMainList
    
    if (orders.length === 0) {
      return {
        totalFinalBattery: 0,
        averageFinalBattery: 0,
        ordersWithFinalBattery: 0
      }
    }

    const ordersWithFinalBattery = orders.filter(order => (order.finalBattery || 0) > 0)
    const totalFinalBattery = orders.reduce((sum, order) => sum + (order.finalBattery || 0), 0)
    
    return {
      totalFinalBattery,
      averageFinalBattery: ordersWithFinalBattery.length > 0 ? totalFinalBattery / ordersWithFinalBattery.length : 0,
      ordersWithFinalBattery: ordersWithFinalBattery.length
    }
  }

  // NEW: Helper function to calculate cumulative quantity statistics for a specific week
  const getWeekCumulativeQuantityStats = (weekData: SalesOrderByDate) => {
    const orders = weekData.salesOrderMainList
    
    if (orders.length === 0) {
      return {
        totalCumulativeQuantity: 0,
        averageCumulativeQuantity: 0,
        ordersWithCumulativeQuantity: 0
      }
    }

    const ordersWithCumulativeQuantity = orders.filter(order => (order.cumulativeQuantity || 0) > 0)
    const totalCumulativeQuantity = orders.reduce((sum, order) => sum + (order.cumulativeQuantity || 0), 0)
    
    return {
      totalCumulativeQuantity,
      averageCumulativeQuantity: ordersWithCumulativeQuantity.length > 0 ? totalCumulativeQuantity / ordersWithCumulativeQuantity.length : 0,
      ordersWithCumulativeQuantity: ordersWithCumulativeQuantity.length
    }
  }

  // Get orders sorted by final battery
  const getOrdersSortedByFinalBattery = (descending: boolean = true) => {
    const orders = [...allSalesOrders.value]
    return orders.sort((a, b) => {
      const aValue = a.finalBattery || 0
      const bValue = b.finalBattery || 0
      return descending ? bValue - aValue : aValue - bValue
    })
  }

  // NEW: Get orders sorted by cumulative quantity
  const getOrdersSortedByCumulativeQuantity = (descending: boolean = true) => {
    const orders = [...allSalesOrders.value]
    return orders.sort((a, b) => {
      const aValue = a.cumulativeQuantity || 0
      const bValue = b.cumulativeQuantity || 0
      return descending ? bValue - aValue : aValue - bValue
    })
  }

  const getOrdersSortedByToProduce = (descending: boolean = true) => {
    const orders = [...allSalesOrders.value]
    return orders.sort((a, b) => {
      const aValue = a.toProduce || 0
      const bValue = b.toProduce || 0
      return descending ? bValue - aValue : aValue - bValue
    })
  }

  // NEW: Get orders sorted by totalAvailableQuantity
  const getOrdersSortedByTotalAvailableQuantity = (descending: boolean = true) => {
    const orders = [...allSalesOrders.value]
    return orders.sort((a, b) => {
      const aValue = a.totalAvailableQuantity || 0
      const bValue = b.totalAvailableQuantity || 0
      return descending ? bValue - aValue : aValue - bValue
    })
  }

  // Get orders with specific final battery criteria
  const getOrdersByFinalBatteryCriteria = (criteria: {
    minFinalBattery?: number
    maxFinalBattery?: number
    hasFinalsOnly?: boolean
  }) => {
    return allSalesOrders.value.filter(order => {
      const finalBattery = order.finalBattery || 0
      
      if (criteria.hasFinalsOnly && finalBattery === 0) return false
      if (criteria.minFinalBattery !== undefined && finalBattery < criteria.minFinalBattery) return false
      if (criteria.maxFinalBattery !== undefined && finalBattery > criteria.maxFinalBattery) return false
      
      return true
    })
  }

  // NEW: Get orders with specific cumulative quantity criteria
  const getOrdersByCumulativeQuantityCriteria = (criteria: {
    minCumulativeQuantity?: number
    maxCumulativeQuantity?: number
    hasCumulativeOnly?: boolean
  }) => {
    return allSalesOrders.value.filter(order => {
      const cumulativeQuantity = order.cumulativeQuantity || 0
      
      if (criteria.hasCumulativeOnly && cumulativeQuantity === 0) return false
      if (criteria.minCumulativeQuantity !== undefined && cumulativeQuantity < criteria.minCumulativeQuantity) return false
      if (criteria.maxCumulativeQuantity !== undefined && cumulativeQuantity > criteria.maxCumulativeQuantity) return false
      
      return true
    })
  }

  // NEW: Get orders with specific toProduce criteria
  const getOrdersByToProduceCriteria = (criteria: {
    minToProduce?: number
    maxToProduce?: number
    hasToProduceOnly?: boolean
  }) => {
    return allSalesOrders.value.filter(order => {
      const toProduce = order.toProduce || 0
      
      if (criteria.hasToProduceOnly && toProduce === 0) return false
      if (criteria.minToProduce !== undefined && toProduce < criteria.minToProduce) return false
      if (criteria.maxToProduce !== undefined && toProduce > criteria.maxToProduce) return false
      
      return true
    })
  }

  // NEW: Get orders with specific totalAvailableQuantity criteria
  const getOrdersByTotalAvailableCriteria = (criteria: {
    minTotalAvailable?: number
    maxTotalAvailable?: number
    hasTotalAvailableOnly?: boolean
  }) => {
    return allSalesOrders.value.filter(order => {
      const totalAvailable = order.totalAvailableQuantity || 0
      
      if (criteria.hasTotalAvailableOnly && totalAvailable === 0) return false
      if (criteria.minTotalAvailable !== undefined && totalAvailable < criteria.minTotalAvailable) return false
      if (criteria.maxTotalAvailable !== undefined && totalAvailable > criteria.maxTotalAvailable) return false
      
      return true
    })
  }

  // Calculate final battery vs availability comparison
  const getFinalBatteryAvailabilityComparison = computed(() => {
    const orders = allSalesOrders.value
    
    if (orders.length === 0) {
      return {
        ordersWithHigherFinalBattery: 0,
        ordersWithLowerFinalBattery: 0,
        ordersWithEqualFinalBattery: 0,
        averageFinalBatteryRatio: 0
      }
    }

    let higherCount = 0
    let lowerCount = 0
    let equalCount = 0
    let totalRatio = 0

    orders.forEach(order => {
      const finalBattery = order.finalBattery || 0
      const totalAvailable = order.availableNotCharged + order.availableCharged
      
      if (finalBattery > totalAvailable) {
        higherCount++
      } else if (finalBattery < totalAvailable) {
        lowerCount++
      } else {
        equalCount++
      }
      
      if (totalAvailable > 0) {
        totalRatio += finalBattery / totalAvailable
      }
    })

    return {
      ordersWithHigherFinalBattery: higherCount,
      ordersWithLowerFinalBattery: lowerCount,
      ordersWithEqualFinalBattery: equalCount,
      averageFinalBatteryRatio: orders.length > 0 ? (totalRatio / orders.length) * 100 : 0
    }
  })

  // NEW: Calculate cumulative quantity vs availability comparison
  const getCumulativeQuantityAvailabilityComparison = computed(() => {
    const orders = allSalesOrders.value
    
    if (orders.length === 0) {
      return {
        ordersWithHigherCumulativeQuantity: 0,
        ordersWithLowerCumulativeQuantity: 0,
        ordersWithEqualCumulativeQuantity: 0,
        averageCumulativeQuantityRatio: 0
      }
    }

    let higherCount = 0
    let lowerCount = 0
    let equalCount = 0
    let totalRatio = 0

    orders.forEach(order => {
      const cumulativeQuantity = order.cumulativeQuantity || 0
      const totalAvailable = order.availableNotCharged + order.availableCharged
      
      if (cumulativeQuantity > totalAvailable) {
        higherCount++
      } else if (cumulativeQuantity < totalAvailable) {
        lowerCount++
      } else {
        equalCount++
      }
      
      if (totalAvailable > 0) {
        totalRatio += cumulativeQuantity / totalAvailable
      }
    })

    return {
      ordersWithHigherCumulativeQuantity: higherCount,
      ordersWithLowerCumulativeQuantity: lowerCount,
      ordersWithEqualCumulativeQuantity: equalCount,
      averageCumulativeQuantityRatio: orders.length > 0 ? (totalRatio / orders.length) * 100 : 0
    }
  })

  const getToProduceRequestedComparison = computed(() => {
    const orders = allSalesOrders.value
    
    if (orders.length === 0) {
      return {
        ordersWithHigherToProduce: 0,
        ordersWithLowerToProduce: 0,
        ordersWithEqualToProduce: 0,
        averageToProduceRatio: 0
      }
    }

    let higherCount = 0
    let lowerCount = 0
    let equalCount = 0
    let totalRatio = 0

    orders.forEach(order => {
      const toProduce = order.toProduce || 0
      const requested = order.requestedQuantity || 0
      
      if (toProduce > requested) {
        higherCount++
      } else if (toProduce < requested) {
        lowerCount++
      } else {
        equalCount++
      }
      
      if (requested > 0) {
        totalRatio += toProduce / requested
      }
    })

    return {
      ordersWithHigherToProduce: higherCount,
      ordersWithLowerToProduce: lowerCount,
      ordersWithEqualToProduce: equalCount,
      averageToProduceRatio: orders.length > 0 ? (totalRatio / orders.length) * 100 : 0
    }
  })

  return {
    // State - Updated for new structure
    salesOrdersByDate, // New: SalesOrderByDate[]
    allSalesOrders, // Computed: flattened SalesOrderMain[] for backward compatibility
    currentSalesOrder,
    loading,
    error,
    pagination,
    filters,
    
    // Computed
    hasData,
    hasError,
    isEmpty,
    
    // Final Battery Computed Properties
    finalBatteryStatistics: getFinalBatteryStatistics,
    finalBatteryAvailabilityComparison: getFinalBatteryAvailabilityComparison,
    
    // NEW: Cumulative Quantity Computed Properties
    cumulativeQuantityStatistics: getCumulativeQuantityStatistics,
    cumulativeQuantityAvailabilityComparison: getCumulativeQuantityAvailabilityComparison,

      // NEW: ToProduce Computed Properties
    toProduceStatistics: getToProduceStatistics,
    toProduceRequestedComparison: getToProduceRequestedComparison,
    
    // NEW: TotalAvailableQuantity Computed Properties
    totalAvailableQuantityStatistics: getTotalAvailableQuantityStatistics,
    
    // Methods
    fetchSalesOrders,
    fetchSalesOrderByMaterial,
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
    clearCredentials,
    
    // Final Battery Methods
    getSalesOrdersStatistics,
    getWeekFinalBatteryStats,
    getOrdersSortedByFinalBattery,
    getOrdersByFinalBatteryCriteria,
    
    // NEW: Cumulative Quantity Methods
    getWeekCumulativeQuantityStats,
    getOrdersSortedByCumulativeQuantity,
    getOrdersByCumulativeQuantityCriteria,

    // NEW: ToProduce Methods
    getOrdersSortedByToProduce,
    getOrdersByToProduceCriteria,
    
    // NEW: TotalAvailableQuantity Methods,
    getOrdersSortedByTotalAvailableQuantity,
    getOrdersByTotalAvailableCriteria,
    
    // Utility methods
    formatDateForBackend: (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    } // Export this helper
  }
}