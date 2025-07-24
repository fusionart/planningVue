import { apiClient } from './apiClient'
import type { SalesOrderDto } from '@/types/api'
import { env, isFeatureEnabled } from '@/config/env'

export interface SalesOrderFilters {
  reqDelDateBegin?: string; // ISO DateTime string
  reqDelDateEnd?: string;   // ISO DateTime string
  // Additional filters for client-side filtering
  salesOrderNumber?: string;
  soldToParty?: string;
}

export interface PaginationParams {
  page?: number
  size?: number
  sort?: string
  direction?: 'asc' | 'desc'
}

class SalesOrderService {
  private readonly endpoint = '/sap'

  /**
   * Get sales orders from your Spring Boot backend
   */
  async getSalesOrders(
    filters: SalesOrderFilters = {},
    pagination: PaginationParams = {}
  ): Promise<{ content: SalesOrderDto[], total: number }> {
    try {
      // Prepare date range - default to current month if not specified
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const reqDelDateBegin = filters.reqDelDateBegin || startOfMonth.toISOString()
      const reqDelDateEnd = filters.reqDelDateEnd || endOfMonth.toISOString()

      // Get credentials - this will throw error if not available
      const credentials = this.getCredentials()

      const params = {
        username: credentials.username,
        password: credentials.password,
        reqDelDateBegin,
        reqDelDateEnd
      }

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔍 Fetching sales orders with params:', {
          reqDelDateBegin,
          reqDelDateEnd,
          hasCredentials: !!(credentials.username && credentials.password)
        })
      }

      const response = await apiClient.get<SalesOrderDto[]>(`${this.endpoint}/getSalesOrders`, params)
      
      // The backend returns an array directly, so we need to format it for pagination
      const salesOrders = Array.isArray(response) ? response : []
      
      // Apply client-side filtering if needed
      let filteredOrders = salesOrders
      
      if (filters.salesOrderNumber) {
        filteredOrders = filteredOrders.filter(order => 
          order.salesOrderNumber.toLowerCase().includes(filters.salesOrderNumber!.toLowerCase())
        )
      }
      
      if (filters.soldToParty) {
        filteredOrders = filteredOrders.filter(order => 
          order.soldToParty.toLowerCase().includes(filters.soldToParty!.toLowerCase())
        )
      }

      // Apply client-side pagination
      const page = pagination.page || 0
      const size = pagination.size || 20
      const startIndex = page * size
      const endIndex = startIndex + size
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('📊 Sales orders fetched successfully:', {
          total: salesOrders.length,
          filtered: filteredOrders.length,
          paginated: paginatedOrders.length
        })
      }

      return {
        content: paginatedOrders,
        total: filteredOrders.length
      }

    } catch (error) {
      console.error('❌ Failed to fetch sales orders:', error)
      
      // Re-throw the error without mock data fallback
      if (error instanceof Error) {
        throw new Error(`Failed to fetch sales orders: ${error.message}`)
      }
      throw new Error('Failed to fetch sales orders: Unknown error')
    }
  }

  /**
   * Get a single sales order by number (not implemented in backend, using client-side filtering)
   */
  async getSalesOrderByNumber(salesOrderNumber: string): Promise<SalesOrderDto> {
    const { content } = await this.getSalesOrders({ salesOrderNumber })
    const order = content.find(o => o.salesOrderNumber === salesOrderNumber)
    
    if (!order) {
      throw new Error(`Sales order ${salesOrderNumber} not found`)
    }
    
    return order
  }

  /**
   * Search sales orders (using client-side search)
   */
  async searchSalesOrders(
    query: string,
    pagination: PaginationParams = {}
  ): Promise<{ content: SalesOrderDto[], total: number }> {
    const { content: allOrders } = await this.getSalesOrders({}, { size: 1000 }) // Get all orders
    
    const searchResults = allOrders.filter(order => 
      order.salesOrderNumber.toLowerCase().includes(query.toLowerCase()) ||
      order.soldToParty.toLowerCase().includes(query.toLowerCase())
    )

    // Apply pagination to search results
    const page = pagination.page || 0
    const size = pagination.size || 20
    const startIndex = page * size
    const endIndex = startIndex + size
    const paginatedResults = searchResults.slice(startIndex, endIndex)

    return {
      content: paginatedResults,
      total: searchResults.length
    }
  }

  /**
   * Get sales orders by delivery week (client-side filtering)
   */
  async getSalesOrdersByDeliveryWeek(week: string): Promise<SalesOrderDto[]> {
    const { content } = await this.getSalesOrders({}, { size: 1000 })
    return content.filter(order => order.requestedDeliveryWeek === week)
  }

  /**
   * Get sales orders statistics (calculated client-side)
   */
  async getSalesOrdersStats(): Promise<{
    totalOrders: number
    completedOrders: number
    pendingOrders: number
    totalValue: number
  }> {
    try {
      const { content } = await this.getSalesOrders({}, { size: 1000 })
      
      const totalOrders = content.length
      const completedOrders = content.filter(order => order.completeDelivery).length
      const pendingOrders = totalOrders - completedOrders
      
      // Since we don't have order values, we'll calculate a mock total
      const totalValue = totalOrders * 15000 // Mock average order value

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('📈 Sales orders statistics calculated:', {
          totalOrders,
          completedOrders,
          pendingOrders,
          totalValue
        })
      }

      return {
        totalOrders,
        completedOrders,
        pendingOrders,
        totalValue
      }
    } catch (error) {
      console.error('❌ Failed to get sales orders stats:', error)
      throw new Error('Failed to calculate sales orders statistics')
    }
  }

  // Create, Update, Delete operations are not implemented in your backend
  // These methods will throw errors to indicate they're not available
  
  async createSalesOrder(salesOrder: Omit<SalesOrderDto, 'salesOrderNumber'>): Promise<SalesOrderDto> {
    throw new Error('Create sales order is not implemented in the backend')
  }

  async updateSalesOrder(salesOrderNumber: string, salesOrder: Partial<SalesOrderDto>): Promise<SalesOrderDto> {
    throw new Error('Update sales order is not implemented in the backend')
  }

  async deleteSalesOrder(salesOrderNumber: string): Promise<void> {
    throw new Error('Delete sales order is not implemented in the backend')
  }

  /**
   * Get credentials for API calls
   * Throws error if credentials are not available
   */
  private getCredentials() {
    // Check if credentials are stored (from login form)
    const storedCredentials = this.getStoredCredentials()
    if (storedCredentials.username && storedCredentials.password) {
      return storedCredentials
    }

    // No fallback to default credentials - always require proper credentials
    throw new Error('SAP credentials not found. Please provide username and password via the credentials modal.')
  }

  /**
   * Store credentials (base64 encoded)
   */
  setCredentials(username: string, password: string) {
    if (!username || !password) {
      throw new Error('Username and password are required')
    }

    const credentials = {
      username: btoa(username),
      password: btoa(password)
    }
    
    // Store in sessionStorage for security
    sessionStorage.setItem('sales_order_credentials', JSON.stringify(credentials))
    
    if (isFeatureEnabled('DEBUG_MODE')) {
      console.log('🔐 Credentials stored for API calls')
    }
  }

  /**
   * Get stored credentials
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
   * Test credentials by making a small API call
   */
  async testCredentials(username: string, password: string): Promise<boolean> {
    try {
      const tempCredentials = {
        username: btoa(username),
        password: btoa(password)
      }

      // Try to fetch a small amount of data
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const params = {
        username: tempCredentials.username,
        password: tempCredentials.password,
        reqDelDateBegin: yesterday.toISOString(),
        reqDelDateEnd: now.toISOString()
      }

      await apiClient.get<SalesOrderDto[]>(`${this.endpoint}/getSalesOrders`, params)
      return true
    } catch (error) {
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.error('🔐 Credentials test failed:', error)
      }
      return false
    }
  }
}

// Export singleton instance
export const salesOrderService = new SalesOrderService()
export default SalesOrderService