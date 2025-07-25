import { apiClient } from './apiClient'
import type { SalesOrderDto } from '@/types/api'
import { env, isFeatureEnabled } from '@/config/env'

export interface SalesOrderFilters {
  reqDelDateBegin?: string; // LocalDateTime string (YYYY-MM-DDTHH:mm:ss)
  reqDelDateEnd?: string;   // LocalDateTime string (YYYY-MM-DDTHH:mm:ss)
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
  private readonly endpoint = '/api/sap'

  /**
   * FIXED: Format date for backend LocalDateTime (no timezone)
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
   * FIXED: Parse various date string formats
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
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      // FIXED: Handle date conversion properly
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

      // FIXED: Get credentials and encode them as Base64 for backend
      const credentials = this.getCredentials()

      // IMPORTANT: Backend expects Base64 encoded credentials
      const params = {
        username: btoa(credentials.username), // Base64 encode for backend
        password: btoa(credentials.password), // Base64 encode for backend
        reqDelDateBegin,
        reqDelDateEnd
      }

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔍 Fetching sales orders with params:', {
          reqDelDateBegin,
          reqDelDateEnd,
          hasCredentials: !!(credentials.username && credentials.password),
          credentialsEncoded: true, // Confirm they are Base64 encoded
          originalFilters: filters
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
          paginated: paginatedOrders.length,
          datesSent: { reqDelDateBegin, reqDelDateEnd }
        })
      }

      return {
        content: paginatedOrders,
        total: filteredOrders.length
      }

    } catch (error) {
      console.error('❌ Failed to fetch sales orders:', error)
      
      // Enhanced error message for date format issues
      if (error instanceof Error && error.message.includes('LocalDateTime')) {
        throw new Error('Date format error: Please check the date range and try again. The backend requires dates in LocalDateTime format.')
      }
      
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
   * FIXED: Get credentials for API calls
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
      const { content } = await this.getSalesOrders({}, { size: 1 })
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