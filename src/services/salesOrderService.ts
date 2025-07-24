import { apiClient } from './apiClient'
import type { SalesOrderDto, SalesOrdersResponse, SalesOrderRequest } from '@/types/api'
import { env, isFeatureEnabled } from '@/config/env'

export interface SalesOrderFilters {
  reqDelDateBegin?: string; // ISO DateTime string
  reqDelDateEnd?: string;   // ISO DateTime string
  // Add other filters if your backend supports them
  salesOrderNumber?: string;
  soldToParty?: string;
}

export interface PaginationParams {
  page?: number
  size?: number
  sort?: string
  direction?: 'asc' | 'desc'
}

// Mock credentials for development/testing
const DEFAULT_CREDENTIALS = {
  username: btoa('niliev'), // base64 encoded
  password: btoa('21Zaq12wsx!!!')  // base64 encoded
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

      // Get credentials (in production, these should come from auth system)
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

      return {
        content: paginatedOrders,
        total: filteredOrders.length
      }

    } catch (error) {
      console.error('Failed to fetch sales orders:', error)
      
      // Return mock data in development if enabled
      if (isFeatureEnabled('MOCK_DATA')) {
        return this.getMockSalesOrders(pagination)
      }
      
      throw error
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

      return {
        totalOrders,
        completedOrders,
        pendingOrders,
        totalValue
      }
    } catch (error) {
      console.error('Failed to get sales orders stats:', error)
      
      // Return mock stats if there's an error
      return {
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        totalValue: 0
      }
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
   * In production, this should integrate with your authentication system
   */
  private getCredentials() {
    // Check if credentials are stored (from login form)
    const storedCredentials = this.getStoredCredentials()
    if (storedCredentials.username && storedCredentials.password) {
      return storedCredentials
    }

    // Fall back to default credentials for development
    if (isFeatureEnabled('MOCK_DATA')) {
      console.warn('🔐 Using default credentials for development')
      return DEFAULT_CREDENTIALS
    }

    throw new Error('No credentials available. Please provide username and password.')
  }

  /**
   * Store credentials (base64 encoded)
   */
  setCredentials(username: string, password: string) {
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
   * Clear stored credentials
   */
  clearCredentials() {
    sessionStorage.removeItem('sales_order_credentials')
    if (isFeatureEnabled('DEBUG_MODE')) {
      console.log('🔐 Credentials cleared')
    }
  }

  /**
   * Mock data for development
   */
  private getMockSalesOrders(pagination: PaginationParams = {}): { content: SalesOrderDto[], total: number } {
    const mockOrders: SalesOrderDto[] = [
      {
        salesOrderNumber: "SO-2025-001",
        soldToParty: "ABC Corporation",
        requestedDeliveryDate: "2025-02-15T00:00:00Z",
        requestedDeliveryWeek: "2025-W07",
        completeDelivery: true,
        toItem: [
          {
            itemNumber: "10",
            materialNumber: "MAT-001",
            materialDescription: "Premium Widget",
            quantity: 100,
            unitOfMeasure: "PC"
          }
        ]
      },
      {
        salesOrderNumber: "SO-2025-002",
        soldToParty: "XYZ Industries",
        requestedDeliveryDate: "2025-02-20T00:00:00Z",
        requestedDeliveryWeek: "2025-W08",
        completeDelivery: false,
        toItem: [
          {
            itemNumber: "10",
            materialNumber: "MAT-002",
            materialDescription: "Standard Component",
            quantity: 50,
            unitOfMeasure: "KG"
          },
          {
            itemNumber: "20",
            materialNumber: "MAT-003",
            materialDescription: "Additional Part",
            quantity: 25,
            unitOfMeasure: "PC"
          }
        ]
      }
    ]

    const page = pagination.page || 0
    const size = pagination.size || 20
    const startIndex = page * size
    const endIndex = startIndex + size

    return {
      content: mockOrders.slice(startIndex, endIndex),
      total: mockOrders.length
    }
  }
}

// Export singleton instance
export const salesOrderService = new SalesOrderService()
export default SalesOrderService