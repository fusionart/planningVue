// plannedOrderService.ts - UPDATED for new API
import { apiClient } from './apiClient'

export interface UpdatePlannedOrderResponse {
  success: boolean
  message?: string
}

class PlannedOrderService {
  private readonly endpoint = '/api/sap'

  /**
   * Get credentials from sessionStorage
   */
  private getCredentials() {
    try {
      const stored = sessionStorage.getItem('sales_order_credentials')
      if (stored) {
        const credentials = JSON.parse(stored)
        if (credentials.username && credentials.password) {
          return {
            username: atob(credentials.username),
            password: atob(credentials.password)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve stored credentials:', error)
    }
    
    throw new Error('Липсват Credenciali за вход')
  }

  /**
   * Combine date and time into LocalDateTime format
   */
  private combineDateTime(date: string, time: string): string {
    return `${date}T${time}:00`
  }

  /**
   * Get free capacity for scheduling (NEW API - uses order number)
   */
  async getCapacity(
    manufacturingOrder: string,  // Order number
    isProductionOrder: boolean,
    scheduleTime: string
  ): Promise<string> {
    try {
      const credentials = this.getCredentials()

      if (!credentials.username || !credentials.password) {
        throw new Error('Липсват Credenciali за вход')
      }

      const params = {
        username: btoa(credentials.username),
        password: btoa(credentials.password),
        manufacturingOrder,  // Use order number
        isProductionOrder: isProductionOrder.toString(),
        scheduleTime
      }

      const queryString = new URLSearchParams(params).toString()
      const url = `${this.endpoint}/getCapacity?${queryString}`

      console.log('📅 ========================================')
      console.log('📅 CALLING getCapacity API')
      console.log('📅 ========================================')
      console.log('📅 URL:', url.replace(/password=[^&]+/, 'password=[HIDDEN]'))
      console.log('📅 Parameters:', {
        manufacturingOrder,
        isProductionOrder,
        scheduleTime
      })

      // Use GET request
      const response = await apiClient.get<string>(url, {})

      console.log('📅 ========================================')
      console.log('✅ getCapacity API RESPONSE RECEIVED')
      console.log('📅 ========================================')
      console.log('✅ Raw response:', response)
      
      let freeCapacityTime: string
      if (typeof response === 'string') {
        freeCapacityTime = response
      } else if (response && typeof response === 'object') {
        freeCapacityTime = (response as any).data || String(response)
      } else {
        freeCapacityTime = String(response)
      }

      console.log('✅ Extracted free capacity time:', freeCapacityTime)
      console.log('📅 ========================================')

      return freeCapacityTime
    } catch (error) {
      console.error('❌ FAILED TO GET CAPACITY:', error)
      throw error
    }
  }

  /**
   * Dispatch a planned order with capacity check
   */
  async dispatchPlannedOrder(
    plannedOrder: string,
    opLtstSchedldProcgStrtDte: string,
    opLtstSchedldProcgStrtTme: string
  ): Promise<UpdatePlannedOrderResponse> {
    try {
      const credentials = this.getCredentials()

      if (!credentials.username || !credentials.password) {
        throw new Error('Липсват Credenciali за вход')
      }

      const requestedDispatchTime = this.combineDateTime(
        opLtstSchedldProcgStrtDte,
        opLtstSchedldProcgStrtTme
      )

      console.log('📅 Step 1: Checking capacity availability...')
      console.log('   Requested time:', requestedDispatchTime)
      console.log('   Planned Order:', plannedOrder)

      // Call getCapacity with planned order number
      const freeCapacityTime = await this.getCapacity(
        plannedOrder,  // Use planned order number
        false,         // isProductionOrder = false
        requestedDispatchTime
      )

      console.log('✅ Capacity check returned free time:', freeCapacityTime)
      console.log('📅 Step 2: Dispatching with free capacity time...')

      const params = {
        username: btoa(credentials.username),
        password: btoa(credentials.password),
        plannedOrder,
        dispatchTime: freeCapacityTime
      }

      const queryString = new URLSearchParams(params).toString()
      const url = `${this.endpoint}/dispatchPlannedOrder?${queryString}`

      console.log('📄 Calling dispatchPlannedOrder API')

      const response = await apiClient.post<any>(url, null)

      console.log('✅ Planned order dispatch successful')

      return {
        success: true,
        message: `Планираната поръчка ${plannedOrder} беше успешно диспечирана за ${freeCapacityTime}`
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
   * Deallocate a planned order
   */
  async deallocatePlannedOrder(
    plannedOrder: string,
    plndOrderPlannedStartDate: string,
    plndOrderPlannedStartTime: string
  ): Promise<UpdatePlannedOrderResponse> {
    try {
      const credentials = this.getCredentials()

      if (!credentials.username || !credentials.password) {
        throw new Error('Липсват Credenciali за вход')
      }

      const dispatchTime = this.combineDateTime(
        plndOrderPlannedStartDate,
        plndOrderPlannedStartTime
      )

      const params = {
        username: btoa(credentials.username),
        password: btoa(credentials.password),
        plannedOrder,
        dispatchTime
      }

      const queryString = new URLSearchParams(params).toString()
      const url = `${this.endpoint}/deallocatePlannedOrder?${queryString}`

      console.log('📄 Calling deallocatePlannedOrder API')

      const response = await apiClient.post<any>(url, null)

      console.log('✅ Planned order deallocation successful')

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
   * Update planned order quantity
   */
  async updatePlannedOrderQuantity(
    plannedOrder: string,
    quantity: string
  ): Promise<UpdatePlannedOrderResponse> {
    try {
      const credentials = this.getCredentials()

      if (!credentials.username || !credentials.password) {
        throw new Error('Липсват Credenciali за вход')
      }

      const params = {
        username: btoa(credentials.username),
        password: btoa(credentials.password),
        plannedOrder,
        quantity
      }

      const queryString = new URLSearchParams(params).toString()
      const url = `${this.endpoint}/updatePlannedOrderQuantity?${queryString}`

      console.log('📄 Calling updatePlannedOrderQuantity API')

      const response = await apiClient.post<any>(url, null)

      console.log('✅ Planned order quantity update successful')

      return {
        success: true,
        message: `Количеството на поръчка ${plannedOrder} беше успешно актуализирано`
      }

    } catch (error) {
      console.error('❌ Failed to update planned order quantity:', error)
      
      let errorMessage = 'Възникна неочаквана грешка при актуализацията на количеството'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }

      return {
        success: false,
        message: `Неуспешна актуализация на количеството за поръчка ${plannedOrder}: ${errorMessage}`
      }
    }
  }

  /**
   * Update planned order production version
   */
  async updatePlannedOrderProductionVersion(
    plannedOrder: string,
    productionVersion: string
  ): Promise<UpdatePlannedOrderResponse> {
    try {
      const credentials = this.getCredentials()

      if (!credentials.username || !credentials.password) {
        throw new Error('Липсват Credenciali за вход')
      }

      const params = {
        username: btoa(credentials.username),
        password: btoa(credentials.password),
        plannedOrder,
        productionVersion
      }

      const queryString = new URLSearchParams(params).toString()
      const url = `${this.endpoint}/updatePlannedOrderProductionVersion?${queryString}`

      console.log('📄 Calling updatePlannedOrderProductionVersion API')

      const response = await apiClient.post<any>(url, null)

      console.log('✅ Planned order production version update successful')

      return {
        success: true,
        message: `Производствената версия на поръчка ${plannedOrder} беше успешно актуализирана`
      }

    } catch (error) {
      console.error('❌ Failed to update planned order production version:', error)
      
      let errorMessage = 'Възникна неочаквана грешка при актуализацията на производствената версия'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }

      return {
        success: false,
        message: `Неуспешна актуализация на производствената версия за поръчка ${plannedOrder}: ${errorMessage}`
      }
    }
  }

  /**
   * Update planned order details (quantity and/or production version)
   * Only calls APIs for changed values
   */
  async updatePlannedOrderDetails(
    plannedOrder: string,
    productionVersion: string | null,
    quantity: string | null,
    originalProductionVersion?: string,
    originalQuantity?: string
  ): Promise<UpdatePlannedOrderResponse> {
    try {
      const updates: string[] = []
      let hasError = false
      let errorMessages: string[] = []

      // Update production version if it has changed
      if (productionVersion !== null && productionVersion !== originalProductionVersion) {
        console.log('📋 Production version changed, updating...')
        const pvResult = await this.updatePlannedOrderProductionVersion(
          plannedOrder,
          productionVersion
        )
        
        if (pvResult.success) {
          updates.push('производствена версия')
        } else {
          hasError = true
          errorMessages.push(pvResult.message || 'Грешка при актуализация на производствената версия')
        }
      } else if (productionVersion === null || productionVersion === originalProductionVersion) {
        console.log('📋 Production version unchanged, skipping update')
      }

      // Update quantity if it has changed
      if (quantity !== null && quantity !== originalQuantity) {
        console.log('📋 Quantity changed, updating...')
        const qtyResult = await this.updatePlannedOrderQuantity(
          plannedOrder,
          quantity
        )
        
        if (qtyResult.success) {
          updates.push('количество')
        } else {
          hasError = true
          errorMessages.push(qtyResult.message || 'Грешка при актуализация на количеството')
        }
      } else if (quantity === null || quantity === originalQuantity) {
        console.log('📋 Quantity unchanged, skipping update')
      }

      if (hasError) {
        return {
          success: false,
          message: `Частична актуализация на поръчка ${plannedOrder}: ${errorMessages.join('; ')}`
        }
      }

      if (updates.length === 0) {
        return {
          success: true,
          message: `Няма промени за актуализация на поръчка ${plannedOrder}`
        }
      }

      return {
        success: true,
        message: `Планираната поръчка ${plannedOrder} беше успешно актуализирана (${updates.join(', ')})`
      }

    } catch (error) {
      console.error('❌ Failed to update planned order details:', error)
      
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
   * Complete plan operation: update details and dispatch
   */
  async planOrder(
    plannedOrder: string,
    opLtstSchedldProcgStrtDte: string,
    opLtstSchedldProcgStrtTme: string,
    productionVersion: string,
    quantity: string,
    originalProductionVersion?: string,
    originalQuantity?: string
  ): Promise<UpdatePlannedOrderResponse> {
    try {
      // Step 1: Update planned order details (only if changed)
      console.log('📋 Step 1: Updating planned order details...')
      const updateResult = await this.updatePlannedOrderDetails(
        plannedOrder,
        productionVersion,
        quantity,
        originalProductionVersion,
        originalQuantity
      )

      if (!updateResult.success) {
        return updateResult
      }

      // Step 2: Dispatch with capacity check
      console.log('📋 Step 2: Dispatching planned order with capacity check...')
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