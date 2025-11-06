// plannedOrderService.ts
import { apiClient } from './apiClient'
import { isFeatureEnabled } from '@/config/env'

export interface UpdatePlannedOrderResponse {
  success: boolean
  message?: string
}

class PlannedOrderService {
  private readonly endpoint = '/api/sap'

  /**
   * Get credentials from sessionStorage (same as other services)
   */
  private getCredentials() {
    try {
      const stored = sessionStorage.getItem('sales_order_credentials')
      if (stored) {
        const credentials = JSON.parse(stored)
        if (credentials.username && credentials.password) {
          // Decode from Base64 storage to get plain text
          return {
            username: atob(credentials.username),
            password: atob(credentials.password)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve stored credentials:', error)
    }
    
    throw new Error('Липсват креденциали за вход')
  }

  /**
   * Combine date and time into LocalDateTime format for backend
   */
  private combineDateTime(date: string, time: string): string {
    // date is in YYYY-MM-DD format, time is in HH:mm format
    // Combine them into LocalDateTime format: YYYY-MM-DDTHH:mm:ss
    // Spring's LocalDateTime requires seconds
    return `${date}T${time}:00`
  }

  /**
   * Dispatch a planned order with scheduling information
   */
  async dispatchPlannedOrder(
    plannedOrder: string,
    opLtstSchedldProcgStrtDte: string,
    opLtstSchedldProcgStrtTme: string
  ): Promise<UpdatePlannedOrderResponse> {
    try {
      const credentials = this.getCredentials()

      if (!credentials.username || !credentials.password) {
        throw new Error('Липсват креденциали за вход')
      }

      // Combine date and time for dispatch time (using processing start)
      const dispatchTime = this.combineDateTime(
        opLtstSchedldProcgStrtDte,
        opLtstSchedldProcgStrtTme
      )

      // Use EXACT same pattern as productionOrderService.convertPlannedOrder
      const params = {
        username: btoa(credentials.username),
        password: btoa(credentials.password),
        plannedOrder,
        dispatchTime
      }

      // Build query string manually EXACTLY like productionOrderService
      const queryString = new URLSearchParams(params).toString()
      const url = `${this.endpoint}/dispatchPlannedOrder?${queryString}`

      console.log('📄 Calling dispatchPlannedOrder with URL:', url.replace(/password=[^&]+/, 'password=[HIDDEN]'))
      console.log('📅 Dispatch DateTime:', dispatchTime)

      // Use the same POST call pattern
      const response = await apiClient.post<any>(url, null)

      console.log('✅ Planned order dispatch successful, response:', response)

      return {
        success: true,
        message: `Планираната поръчка ${plannedOrder} беше успешно диспечирана`
      }

    } catch (error) {
      console.error('❌ Failed to dispatch planned order:', error)
      
      let errorMessage = 'Възникна неочаквана грешка при диспечирането'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }

      return {
        success: false,
        message: `Неуспешно диспечиране на поръчка ${plannedOrder}: ${errorMessage}`
      }
    }
  }

  /**
   * Deallocate (allocate) a planned order with scheduling information
   */
  async deallocatePlannedOrder(
    plannedOrder: string,
    plndOrderPlannedStartDate: string,
    plndOrderPlannedStartTime: string
  ): Promise<UpdatePlannedOrderResponse> {
    try {
      console.log('🔄 deallocatePlannedOrder called with:', {
        plannedOrder,
        plndOrderPlannedStartDate,
        plndOrderPlannedStartTime
      })

      const credentials = this.getCredentials()

      if (!credentials.username || !credentials.password) {
        throw new Error('Липсват креденциали за вход')
      }

      // Combine date and time for dispatch time
      const dispatchTime = this.combineDateTime(
        plndOrderPlannedStartDate,
        plndOrderPlannedStartTime
      )

      // Use EXACT same pattern as other API calls
      const params = {
        username: btoa(credentials.username),
        password: btoa(credentials.password),
        plannedOrder,
        dispatchTime
      }

      // Build query string manually
      const queryString = new URLSearchParams(params).toString()
      const url = `${this.endpoint}/deallocatePlannedOrder?${queryString}`

      console.log('🔄 Calling deallocatePlannedOrder API')
      console.log('   URL:', url.replace(/password=[^&]+/, 'password=[HIDDEN]'))
      console.log('   Dispatch DateTime:', dispatchTime)
      console.log('   Planned Order:', plannedOrder)

      // Use the same POST call pattern
      const response = await apiClient.post<any>(url, null)

      console.log('✅ Planned order deallocation successful, response:', response)

      return {
        success: true,
        message: `Планираната поръчка ${plannedOrder} беше успешно алокирана`
      }

    } catch (error) {
      console.error('❌ Failed to deallocate planned order:', error)
      
      let errorMessage = 'Възникна неочаквана грешка при алокирането'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }

      return {
        success: false,
        message: `Неуспешно алокиране на поръчка ${plannedOrder}: ${errorMessage}`
      }
    }
  }

  /**
   * Update a planned order with production version and quantity
   */
  async updatePlannedOrderDetails(
    plannedOrder: string,
    productionVersion: string,
    quantity: string
  ): Promise<UpdatePlannedOrderResponse> {
    try {
      const credentials = this.getCredentials()

      if (!credentials.username || !credentials.password) {
        throw new Error('Липсват креденциали за вход')
      }

      // Use EXACT same pattern as productionOrderService
      const params = {
        username: btoa(credentials.username),
        password: btoa(credentials.password),
        plannedOrder,
        productionVersion,
        quantity
      }

      // Build query string manually
      const queryString = new URLSearchParams(params).toString()
      const url = `${this.endpoint}/updatePlannedOrder?${queryString}`

      console.log('📄 Calling updatePlannedOrder with URL:', url.replace(/password=[^&]+/, 'password=[HIDDEN]'))
      console.log('📦 Production Version:', productionVersion)
      console.log('📦 Quantity:', quantity)

      // Use the same POST call pattern
      const response = await apiClient.post<any>(url, null)

      console.log('✅ Planned order update successful, response:', response)

      return {
        success: true,
        message: `Планираната поръчка ${plannedOrder} беше успешно актуализирана`
      }

    } catch (error) {
      console.error('❌ Failed to update planned order:', error)
      
      let errorMessage = 'Възникна неочаквана грешка при актуализацията'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }

      return {
        success: false,
        message: `Неуспешна актуализация на поръчка ${plannedOrder}: ${errorMessage}`
      }
    }
  }

  /**
   * Complete plan operation: dispatch order and then update details
   */
  async planOrder(
    plannedOrder: string,
    opLtstSchedldProcgStrtDte: string,
    opLtstSchedldProcgStrtTme: string,
    productionVersion: string,
    quantity: string
  ): Promise<UpdatePlannedOrderResponse> {
    try {
      // Step 1: Update planned order with production version and quantity FIRST
      console.log('📋 Step 1: Updating planned order details...')
      const updateResult = await this.updatePlannedOrderDetails(
        plannedOrder,
        productionVersion,
        quantity
      )

      if (!updateResult.success) {
        return updateResult
      }

      // Step 2: Dispatch the planned order AFTER successful update
      console.log('📋 Step 2: Dispatching planned order...')
      const dispatchResult = await this.dispatchPlannedOrder(
        plannedOrder,
        opLtstSchedldProcgStrtDte,
        opLtstSchedldProcgStrtTme
      )

      if (!dispatchResult.success) {
        return dispatchResult
      }

      return {
        success: true,
        message: `Планираната поръчка ${plannedOrder} беше успешно планирана`
      }

    } catch (error) {
      console.error('❌ Failed to plan order:', error)
      
      let errorMessage = 'Възникна неочаквана грешка при планирането'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }

      return {
        success: false,
        message: `Неуспешно планиране на поръчка ${plannedOrder}: ${errorMessage}`
      }
    }
  }
}

export const plannedOrderService = new PlannedOrderService()