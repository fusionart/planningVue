// src/services/salesOrderService.ts - Updated for SalesOrderByDate with finalBattery and cumulativeQuantity

import { apiClient } from './apiClient'
import type { SalesOrderByDate, SalesOrderMain, SalesOrderItemsRequest } from '@/types/api'
import { env, isFeatureEnabled } from '@/config/env'

export interface SalesOrderFilters {
  reqDelDateBegin?: string; // LocalDateTime string (YYYY-MM-DDTHH:mm:ss)
  reqDelDateEnd?: string;   // LocalDateTime string (YYYY-MM-DDTHH:mm:ss)
  // Additional filters for client-side filtering
  material?: string;
  plant?: string;
}

export interface PaginationParams {
  page?: number
  size?: number
  sort?: string
  direction?: 'asc' | 'desc'
}

class SalesOrderService {
  private readonly endpoint = '/api/sap'

  /**
   * Format date for backend LocalDateTime (no timezone)
   */
  private formatDateForBackend(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
  }

  /**
   * Parse various date string formats
   */
  private parseDateString(dateString: string): Date {
    if (dateString.includes('Z') || dateString.includes('+')) {
      // ISO string with timezone
      return new Date(dateString)
    } else if (dateString.includes('T')) {
      // datetime-local format or LocalDateTime format
      return new Date(dateString)
    } else {
      // fallback
      return new Date(dateString)
    }
  }

  /**
   * Get sales orders by date from your SalesOrderItemsController
   * This calls the /getSalesOrdersItems endpoint and returns SalesOrderByDate[]
   */
  async getSalesOrdersByDate(
    filters: SalesOrderFilters = {},
    pagination: PaginationParams = {}
  ): Promise<{ content: SalesOrderByDate[], total: number }> {
    try {
      // Prepare date range - default to current month if not specified
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      // Handle date conversion properly
      let reqDelDateBegin: string
      let reqDelDateEnd: string

      if (filters.reqDelDateBegin) {
        const startDate = this.parseDateString(filters.reqDelDateBegin)
        reqDelDateBegin = this.formatDateForBackend(startDate)
      } else {
        reqDelDateBegin = this.formatDateForBackend(startOfMonth)
      }

      if (filters.reqDelDateEnd) {
        const endDate = this.parseDateString(filters.reqDelDateEnd)
        reqDelDateEnd = this.formatDateForBackend(endDate)
      } else {
        reqDelDateEnd = this.formatDateForBackend(endOfMonth)
      }

      // Get credentials and encode them as Base64 for backend
      const credentials = this.getCredentials()

      // Backend expects Base64 encoded credentials
      const params = {
        username: btoa(credentials.username), // Base64 encode for backend
        password: btoa(credentials.password), // Base64 encode for backend
        reqDelDateBegin,
        reqDelDateEnd
      }

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔍 Fetching sales orders by date with params:', {
          reqDelDateBegin,
          reqDelDateEnd,
          hasCredentials: !!(credentials.username && credentials.password),
          credentialsEncoded: true,
          originalFilters: filters
        })
      }

      // Call the endpoint: /api/sap/getSalesOrdersItems
      const response = await apiClient.get<SalesOrderByDate[]>(`${this.endpoint}/getSalesOrdersItems`, params)
      
      // The backend returns SalesOrderByDate[] directly
      const salesOrdersByDate = Array.isArray(response) ? response : []
      
      // Apply client-side filtering if needed (filter within each week's data)
      let filteredOrdersByDate = salesOrdersByDate
      
      if (filters.material || filters.plant) {
        filteredOrdersByDate = salesOrdersByDate.map(weekData => ({
          ...weekData,
          salesOrderMainList: weekData.salesOrderMainList.filter(order => {
            let matches = true
            
            if (filters.material) {
              matches = matches && order.material.toLowerCase().includes(filters.material.toLowerCase())
            }
            
            if (filters.plant) {
              matches = matches && order.plant.toLowerCase().includes(filters.plant.toLowerCase())
            }
            
            return matches
          })
        })).filter(weekData => weekData.salesOrderMainList.length > 0) // Remove weeks with no matching orders
      }

      // Calculate total items across all weeks
      const totalItems = filteredOrdersByDate.reduce((total, weekData) => 
        total + weekData.salesOrderMainList.length, 0)

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('📊 Sales orders by date fetched successfully:', {
          totalWeeks: salesOrdersByDate.length,
          filteredWeeks: filteredOrdersByDate.length,
          totalItems: totalItems,
          datesSent: { reqDelDateBegin, reqDelDateEnd }
        })
      }

      return {
        content: filteredOrdersByDate,
        total: totalItems
      }

    } catch (error) {
      console.error('❌ Failed to fetch sales orders by date:', error)
      
      // Enhanced error message for date format issues
      if (error instanceof Error && error.message.includes('LocalDateTime')) {
        throw new Error('Date format error: Please check the date range and try again. The backend requires dates in LocalDateTime format.')
      }
      
      // Re-throw the error without mock data fallback
      if (error instanceof Error) {
        throw new Error(`Failed to fetch sales orders by date: ${error.message}`)
      }
      throw new Error('Failed to fetch sales orders by date: Unknown error')
    }
  }

  /**
   * Get a single sales order by material (using client-side filtering across all weeks)
   */
  async getSalesOrderByMaterial(material: string): Promise<SalesOrderMain> {
    const { content } = await this.getSalesOrdersByDate({ material })
    
    // Search across all weeks
    for (const weekData of content) {
      const order = weekData.salesOrderMainList.find(o => o.material === material)
      if (order) {
        return order
      }
    }
    
    throw new Error(`Sales order with material ${material} not found`)
  }

  /**
   * Search sales orders (using client-side search across all weeks)
   */
  async searchSalesOrders(
    query: string,
    pagination: PaginationParams = {}
  ): Promise<{ content: SalesOrderByDate[], total: number }> {
    const { content: allOrdersByDate } = await this.getSalesOrdersByDate({}, { size: 1000 }) // Get all orders
    
    // Filter each week's data based on search query
    const searchResults = allOrdersByDate.map(weekData => ({
      ...weekData,
      salesOrderMainList: weekData.salesOrderMainList.filter(order => 
        order.material.toLowerCase().includes(query.toLowerCase()) ||
        order.plant.toLowerCase().includes(query.toLowerCase()) ||
        order.requestedQuantityUnit.toLowerCase().includes(query.toLowerCase())
      )
    })).filter(weekData => weekData.salesOrderMainList.length > 0) // Remove weeks with no matching orders

    // Calculate total matching items
    const totalItems = searchResults.reduce((total, weekData) => 
      total + weekData.salesOrderMainList.length, 0)

    return {
      content: searchResults,
      total: totalItems
    }
  }

  /**
   * Get sales orders by plant (client-side filtering across all weeks)
   */
  async getSalesOrdersByPlant(plant: string): Promise<SalesOrderMain[]> {
    const { content } = await this.getSalesOrdersByDate({}, { size: 1000 })
    const result: SalesOrderMain[] = []
    
    // Collect all orders from all weeks that match the plant
    content.forEach(weekData => {
      const plantOrders = weekData.salesOrderMainList.filter(order => order.plant === plant)
      result.push(...plantOrders)
    })
    
    return result
  }

  /**
   * Get sales orders statistics (calculated client-side across all weeks)
   * UPDATED: Now includes finalBattery and cumulativeQuantity totals
   */
  async getSalesOrdersStats(): Promise<{
    totalOrders: number
    totalRequestedQuantity: number
    totalCumulativeQuantity: number  // NEW: Total cumulative quantity
    totalAvailableNotCharged: number
    totalAvailableCharged: number
    totalFinalBattery: number  // Total final battery
    uniquePlants: number
    uniqueMaterials: number
    weekCount: number
  }> {
    try {
      const { content } = await this.getSalesOrdersByDate({}, { size: 1000 })
      
      // Flatten all orders from all weeks
      const allOrders: SalesOrderMain[] = []
      content.forEach(weekData => {
        allOrders.push(...weekData.salesOrderMainList)
      })
      
      const totalOrders = allOrders.length
      const totalRequestedQuantity = allOrders.reduce((sum, order) => sum + order.requestedQuantity, 0)
      const totalCumulativeQuantity = allOrders.reduce((sum, order) => sum + (order.cumulativeQuantity || 0), 0) // NEW
      const totalAvailableNotCharged = allOrders.reduce((sum, order) => sum + order.availableNotCharged, 0)
      const totalAvailableCharged = allOrders.reduce((sum, order) => sum + order.availableCharged, 0)
      const totalFinalBattery = allOrders.reduce((sum, order) => sum + (order.finalBattery || 0), 0)
      
      const uniquePlants = new Set(allOrders.map(order => order.plant)).size
      const uniqueMaterials = new Set(allOrders.map(order => order.material)).size
      const weekCount = content.length

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('📈 Sales orders statistics calculated:', {
          totalOrders,
          totalRequestedQuantity,
          totalCumulativeQuantity,  // NEW
          totalAvailableNotCharged,
          totalAvailableCharged,
          totalFinalBattery,
          uniquePlants,
          uniqueMaterials,
          weekCount
        })
      }

      return {
        totalOrders,
        totalRequestedQuantity,
        totalCumulativeQuantity,  // NEW
        totalAvailableNotCharged,
        totalAvailableCharged,
        totalFinalBattery,
        uniquePlants,
        uniqueMaterials,
        weekCount
      }
    } catch (error) {
      console.error('❌ Failed to get sales orders stats:', error)
      throw new Error('Failed to calculate sales orders statistics')
    }
  }

  // Create, Update, Delete operations are not implemented in your backend
  // These methods will throw errors to indicate they're not available
  
  async createSalesOrder(salesOrder: Omit<SalesOrderMain, 'material'>): Promise<SalesOrderMain> {
    throw new Error('Create sales order is not implemented in the backend')
  }

  async updateSalesOrder(material: string, salesOrder: Partial<SalesOrderMain>): Promise<SalesOrderMain> {
    throw new Error('Update sales order is not implemented in the backend')
  }

  async deleteSalesOrder(material: string): Promise<void> {
    throw new Error('Delete sales order is not implemented in the backend')
  }

  /**
   * Get credentials for API calls
   * Returns plain text credentials (backend will Base64 encode them)
   */
  private getCredentials() {
    // Check if credentials are stored (they are already Base64 encoded in storage)
    const storedCredentials = this.getStoredCredentials()
    if (storedCredentials.username && storedCredentials.password) {
      return {
        // Decode from storage to get plain text for API call
        // (The API call will re-encode them for the backend)
        username: atob(storedCredentials.username),
        password: atob(storedCredentials.password)
      }
    }

    // No fallback to default credentials - always require proper credentials
    throw new Error('SAP credentials not found. Please provide username and password via the credentials modal.')
  }

  /**
   * Store credentials (Base64 encoded for security in storage)
   */
  setCredentials(username: string, password: string) {
    if (!username || !password) {
      throw new Error('Username and password are required')
    }

    // Store credentials as Base64 encoded in sessionStorage for security
    const credentials = {
      username: btoa(username), // Base64 encode for storage
      password: btoa(password)  // Base64 encode for storage
    }
    
    // Store in sessionStorage for security
    sessionStorage.setItem('sales_order_credentials', JSON.stringify(credentials))
    
    if (isFeatureEnabled('DEBUG_MODE')) {
      console.log('🔐 Credentials stored (Base64 encoded) for API calls')
    }
  }

  /**
   * Get stored credentials (Base64 encoded)
   */
  private getStoredCredentials() {
    try {
      const stored = sessionStorage.getItem('sales_order_credentials')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to retrieve stored credentials:', error)
    }
    
    return { username: '', password: '' }
  }

  /**
   * Check if credentials are available
   */
  hasCredentials(): boolean {
    const stored = this.getStoredCredentials()
    return !!(stored.username && stored.password)
  }

  /**
   * Clear stored credentials
   */
  clearCredentials() {
    sessionStorage.removeItem('sales_order_credentials')
    if (isFeatureEnabled('DEBUG_MODE')) {
      console.log('🔐 Credentials cleared')
    }
  }

  /**
   * Test credentials without making a full API call
   */
  async testCredentials(): Promise<boolean> {
    try {
      // Try to get a small amount of data to test credentials
      const { content } = await this.getSalesOrdersByDate({}, { size: 1 })
      return true
    } catch (error) {
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔐 Credential test failed:', error)
      }
      return false
    }
  }
}

// Export singleton instance
export const salesOrderService = new SalesOrderService()
export default SalesOrderService