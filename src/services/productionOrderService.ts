// src/services/productionOrderService.ts

import { apiClient } from './apiClient'
import { env, isFeatureEnabled } from '@/config/env'

export interface ProductionOrderDto {
  material: string
  materialDescription: string
  productionOrder: string
  productionPlant: string
  orderIsReleased: boolean
  orderIsScheduled: boolean
  productionSupervisor: string
  productionVersion: string
  workCenter: string
  workCenterDescription: string
  mfgOrderScheduledStartDate: string // LocalDate
  mfgOrderScheduledStartTime: string // LocalTime
  mfgOrderScheduledEndDate: string // LocalDate
  mfgOrderScheduledEndTime: string // LocalTime
  productionUnit: string
  totalQuantity: number
  mfgOrderConfirmedYieldQty: number
  salesOrder: string
}

export interface ProductionOrderFilters {
  material: string
  reqDelDateBegin: string // LocalDateTime string (YYYY-MM-DDTHH:mm:ss)
  reqDelDateEnd: string   // LocalDateTime string (YYYY-MM-DDTHH:mm:ss)
}

export interface PlannedOrderConversionRequest {
  plannedOrder: string
  manufacturingOrderType: string
}

export interface PlannedOrderConversionResponse {
  success: boolean
  message?: string
  productionOrder?: string
}

export interface ProductionOrderUpdateResponse {
  success: boolean
  message?: string
}

class ProductionOrderService {
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
   * Get production orders by material from ProductionOrderByMaterialController
   */
  async getProductionOrdersByMaterial(
    material: string,
    reqDelDateBegin: Date,
    reqDelDateEnd: Date
  ): Promise<ProductionOrderDto[]> {
    try {
      // Get credentials from salesOrderService (reuse the same credentials)
      const credentials = this.getCredentials()

      // Format dates for backend
      const formattedDateBegin = this.formatDateForBackend(reqDelDateBegin)
      const formattedDateEnd = this.formatDateForBackend(reqDelDateEnd)

      const params = {
        username: btoa(credentials.username), // Base64 encode for backend
        password: btoa(credentials.password), // Base64 encode for backend
        material,
        reqDelDateBegin: formattedDateBegin,
        reqDelDateEnd: formattedDateEnd
      }

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔍 Fetching production orders for material:', {
          material,
          reqDelDateBegin: formattedDateBegin,
          reqDelDateEnd: formattedDateEnd,
          hasCredentials: !!(credentials.username && credentials.password)
        })
      }

      // Call the endpoint: /api/sap/getProductionOrdersByMaterial
      const response = await apiClient.get<ProductionOrderDto[]>(
        `${this.endpoint}/getProductionOrdersByMaterial`, 
        params
      )
      
      const productionOrders = Array.isArray(response) ? response : []

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('📊 Production orders fetched successfully:', {
          material,
          ordersCount: productionOrders.length,
          orders: productionOrders
        })
      }

      return productionOrders

    } catch (error) {
      console.error('❌ Failed to fetch production orders:', error)
      
      if (error instanceof Error) {
        throw new Error(`Failed to fetch production orders for material ${material}: ${error.message}`)
      }
      throw new Error(`Failed to fetch production orders for material ${material}: Unknown error`)
    }
  }

  /**
   * Convert planned order to production order
   */
  /**
 * Convert planned order to production order
 */
  async convertPlannedOrder(
    plannedOrder: string,
    manufacturingOrderType: string
  ): Promise<PlannedOrderConversionResponse> {
    try {
      // Get credentials
      const credentials = this.getCredentials()

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔄 Converting planned order with credentials check:', {
          plannedOrder,
          manufacturingOrderType,
          hasUsername: !!credentials.username,
          hasPassword: !!credentials.password,
          usernameLength: credentials.username?.length || 0,
          passwordLength: credentials.password?.length || 0
        })
      }

      // Ensure credentials are not empty
      if (!credentials.username || !credentials.password) {
        throw new Error('Username or password is empty')
      }

      const params = {
        username: btoa(credentials.username), // Base64 encode for backend
        password: btoa(credentials.password), // Base64 encode for backend
        plannedOrder,
        manufacturingOrderType
      }

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔄 API call parameters:', {
          hasEncodedUsername: !!params.username,
          hasEncodedPassword: !!params.password,
          encodedUsernameLength: params.username?.length || 0,
          encodedPasswordLength: params.password?.length || 0,
          plannedOrder: params.plannedOrder,
          manufacturingOrderType: params.manufacturingOrderType
        })
      }

      // Build query string manually
      const queryString = new URLSearchParams({
        username: params.username,
        password: params.password,
        plannedOrder: params.plannedOrder,
        manufacturingOrderType: params.manufacturingOrderType
      }).toString()

      const url = `${this.endpoint}/convertPlannedOrder?${queryString}`

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔄 Built URL with query string:', url.replace(/password=[^&]+/, 'password=[HIDDEN]'))
      }

      // Call the endpoint using POST with query string in URL
      const response = await apiClient.post<any>(url, null)

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('✅ Planned order converted successfully:', {
          plannedOrder,
          manufacturingOrderType,
          response
        })
      }

      return {
        success: true,
        message: `Планираната поръчка ${plannedOrder} беше успешно конвертирана към производствена поръчка от тип ${manufacturingOrderType}`,
        productionOrder: response?.productionOrder || undefined
      }

    } catch (error) {
      console.error('❌ Failed to convert planned order:', error)
      
      let errorMessage = 'Възникна неочаквана грешка при конвертирането'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        // Handle API error responses
        const apiError = error as any
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message
        } else if (apiError.response?.data) {
          errorMessage = JSON.stringify(apiError.response.data)
        } else if (apiError.message) {
          errorMessage = apiError.message
        }
      }

      return {
        success: false,
        message: `Неуспешно конвертиране на планирана поръчка ${plannedOrder}: ${errorMessage}`
      }
    }
  }

  /**
   * Get credentials for API calls (reuse from salesOrderService pattern)
   */
  private getCredentials() {
    // Check if credentials are stored (they are already Base64 encoded in storage)
    const storedCredentials = this.getStoredCredentials()
    if (storedCredentials.username && storedCredentials.password) {
      return {
        // Decode from storage to get plain text for API call
        username: atob(storedCredentials.username),
        password: atob(storedCredentials.password)
      }
    }

    throw new Error('SAP credentials not found. Please provide username and password via the credentials modal.')
  }

  /**
   * Get stored credentials (Base64 encoded) - same pattern as salesOrderService
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
   * Format date for display
   */
  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return 'N/A'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('bg-BG')
    } catch {
      return dateStr
    }
  }

  /**
   * Format time for display
   */
  formatDisplayTime(timeStr: string): string {
    if (!timeStr) return 'N/A'
    try {
      // Handle time strings like "10:30:00"
      const timeParts = timeStr.split(':')
      if (timeParts.length >= 2) {
        return `${timeParts[0]}:${timeParts[1]}`
      }
      return timeStr
    } catch {
      return timeStr
    }
  }

  /**
   * Format quantity for display
   */
  formatQuantity(quantity: number): string {
    if (quantity === null || quantity === undefined) return '0'
    return quantity.toLocaleString('bg-BG')
  }

  async updateProductionOrder(productionOrder: string): Promise<ProductionOrderUpdateResponse> {
  try {
    // Get credentials
    const credentials = this.getCredentials()

    if (isFeatureEnabled('DEBUG_MODE')) {
      console.log('🔄 Updating production order:', {
        productionOrder,
        hasCredentials: !!(credentials.username && credentials.password)
      })
    }

    // Ensure credentials are not empty
    if (!credentials.username || !credentials.password) {
      throw new Error('Username or password is empty')
    }

    const params = {
      username: btoa(credentials.username), // Base64 encode for backend
      password: btoa(credentials.password), // Base64 encode for backend
      productionOrder
    }

    // Build query string manually
    const queryString = new URLSearchParams({
      username: params.username,
      password: params.password,
      productionOrder: params.productionOrder
    }).toString()

    const url = `${this.endpoint}/updateProductionOrder?${queryString}`

    if (isFeatureEnabled('DEBUG_MODE')) {
      console.log('🔄 Calling updateProductionOrder API:', url.replace(/password=[^&]+/, 'password=[HIDDEN]'))
    }

    // Call the endpoint using POST with query string in URL
    const response = await apiClient.post<any>(url, null)

    if (isFeatureEnabled('DEBUG_MODE')) {
      console.log('✅ Production order updated successfully:', {
        productionOrder,
        response
      })
    }

    return {
      success: true,
      message: `Производствената поръчка ${productionOrder} беше успешно актуализирана`
    }

  } catch (error) {
    console.error('❌ Failed to update production order:', error)
    
    let errorMessage = 'Възникна неочаквана грешка при актуализацията'
    
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'object' && error !== null) {
      // Handle API error responses
      const apiError = error as any
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message
      } else if (apiError.response?.data) {
        errorMessage = JSON.stringify(apiError.response.data)
      } else if (apiError.message) {
        errorMessage = apiError.message
      }
    }

    return {
      success: false,
      message: `Неуспешна актуализация на производствена поръчка ${productionOrder}: ${errorMessage}`
    }
  }
}
}

// Export singleton instance
export const productionOrderService = new ProductionOrderService()
export default ProductionOrderService