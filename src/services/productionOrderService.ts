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

// NEW: PlannedOrder interface based on PlannedOrderDto.java
export interface PlannedOrderDto {
  plannedOrder: string
  material: string
  productionPlan: string
  totalQuantity: number
  salesOrder: string
  productionSupervisor: string
  plndOrderPlannedStartDate: string // LocalDate
  plndOrderPlannedStartTime: string // LocalTime
  plndOrderPlannedEndDate: string // LocalDate
  plndOrderPlannedEndTime: string // LocalTime
  plannedOrderCapacityIsDsptchd: boolean
  workCenter: string
  etag: string
  productionVersion: string
}

export interface ProductionVersionDto {
  id: string
  material: string
  plant: number
  productionVersionNumber: number
  routingGroup: string
  routingGroupCounter: number
  description: string
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

export interface ProductionOrderCreateResponse {
  success: boolean
  message?: string
  productionOrder?: string
}

export interface StorageLocationUpdateResponse {
  success: boolean
  message?: string
}

export interface ProductionVersionUpdateResponse {
  success: boolean
  message?: string
}

export interface ProductionSupervisor {
  plant: string;
  supervisor: string;
  supervisorName: string;
}

export interface WorkCenter {
  id: string;
  workCenter: string;
  description: string;
  plant: string;
  productionSupervisor: string;
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
   * Create LocalDateTime string from date and time strings
   */
  private createLocalDateTime(dateStr: string, timeStr: string): string {
    // Ensure timeStr is a string and handle different formats
    const timeString = String(timeStr || '00:00')
    const timeParts = timeString.split(':')
    const hours = timeParts[0].padStart(2, '0')
    const minutes = timeParts[1] ? timeParts[1].padStart(2, '0') : '00'
    
    return `${dateStr}T${hours}:${minutes}:00`
  }

  /**
   * NEW: Get planned orders within the specified date range
   */
  async getPlannedOrders(
    reqDelDateBegin: Date,
    reqDelDateEnd: Date
  ): Promise<PlannedOrderDto[]> {
    try {
      // Get credentials
      const credentials = this.getCredentials()

      // Format dates for backend
      const formattedDateBegin = this.formatDateForBackend(reqDelDateBegin)
      const formattedDateEnd = this.formatDateForBackend(reqDelDateEnd)

      const params = {
        username: btoa(credentials.username), // Base64 encode for backend
        password: btoa(credentials.password), // Base64 encode for backend
        reqDelDateBegin: formattedDateBegin,
        reqDelDateEnd: formattedDateEnd
      }

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔍 Fetching planned orders:', {
          reqDelDateBegin: formattedDateBegin,
          reqDelDateEnd: formattedDateEnd,
          hasCredentials: !!(credentials.username && credentials.password)
        })
      }

      // Call the endpoint: /api/sap/getPlannedOrders
      const response = await apiClient.get<PlannedOrderDto[]>(
        `${this.endpoint}/getPlannedOrders`, 
        params
      )
      
      const plannedOrders = Array.isArray(response) ? response : []

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('📊 Planned orders fetched successfully:', {
          ordersCount: plannedOrders.length,
          orders: plannedOrders
        })
      }

      return plannedOrders

    } catch (error) {
      console.error('❌ Failed to fetch planned orders:', error)
      
      if (error instanceof Error) {
        throw new Error(`Failed to fetch planned orders: ${error.message}`)
      }
      throw new Error('Failed to fetch planned orders: Unknown error')
    }
  }

  /**
   * Get planned orders by production supervisor
   */
  async getPlannedOrdersByProductionSupervisor(
    productionSupervisor: string,
    reqDelDateBegin: Date,
    reqDelDateEnd: Date
  ): Promise<PlannedOrderDto[]> {
    try {
      // Get credentials
      const credentials = this.getCredentials()

      // Format dates for backend
      const formattedDateBegin = this.formatDateForBackend(reqDelDateBegin)
      const formattedDateEnd = this.formatDateForBackend(reqDelDateEnd)

      const params = {
        username: btoa(credentials.username), // Base64 encode for backend
        password: btoa(credentials.password), // Base64 encode for backend
        productionSupervisor,
        reqDelDateBegin: formattedDateBegin,
        reqDelDateEnd: formattedDateEnd
      }

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔍 Fetching planned orders for supervisor:', {
          productionSupervisor,
          reqDelDateBegin: formattedDateBegin,
          reqDelDateEnd: formattedDateEnd,
          hasCredentials: !!(credentials.username && credentials.password)
        })
      }

      // Call the endpoint: /api/sap/getPlannedOrdersByProductionSupervisor
      const response = await apiClient.get<PlannedOrderDto[]>(
        `${this.endpoint}/getPlannedOrdersByProductionSupervisor`, 
        params
      )
      
      const plannedOrders = Array.isArray(response) ? response : []

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('📊 Planned orders fetched successfully:', {
          productionSupervisor,
          ordersCount: plannedOrders.length,
          orders: plannedOrders
        })
      }

      return plannedOrders

    } catch (error) {
      console.error('❌ Failed to fetch planned orders by supervisor:', error)
      
      if (error instanceof Error) {
        throw new Error(`Failed to fetch planned orders for supervisor ${productionSupervisor}: ${error.message}`)
      }
      throw new Error(`Failed to fetch planned orders for supervisor ${productionSupervisor}: Unknown error`)
    }
  }

  /**
   * Get production versions by material and plant
   */
  async getProductionVersionsByMaterial(
    material: string,
    plant: string
  ): Promise<ProductionVersionDto[]> {
    try {
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔍 Fetching production versions:', {
          material,
          plant
        })
      }

      const params = {
        material,
        plant
      }

      // Call the endpoint: /api/sap/getProductionVersionByMaterial
      const response = await apiClient.get<ProductionVersionDto[]>(
        `${this.endpoint}/getProductionVersionByMaterial`, 
        params
      )
      
      const productionVersions = Array.isArray(response) ? response : []

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('📊 Production versions fetched successfully:', {
          material,
          plant,
          versionsCount: productionVersions.length,
          versions: productionVersions
        })
      }

      return productionVersions

    } catch (error) {
      console.error('❌ Failed to fetch production versions:', error)
      
      if (error instanceof Error) {
        throw new Error(`Failed to fetch production versions for material ${material}: ${error.message}`)
      }
      throw new Error(`Failed to fetch production versions for material ${material}: Unknown error`)
    }
  }

  /**
   * Get production orders by production supervisor
   */
  async getProductionOrdersByProductionSupervisor(
    productionSupervisor: string,
    reqDelDateBegin: Date,
    reqDelDateEnd: Date
  ): Promise<ProductionOrderDto[]> {
    try {
      // Get credentials
      const credentials = this.getCredentials()

      // Format dates for backend
      const formattedDateBegin = this.formatDateForBackend(reqDelDateBegin)
      const formattedDateEnd = this.formatDateForBackend(reqDelDateEnd)

      const params = {
        username: btoa(credentials.username), // Base64 encode for backend
        password: btoa(credentials.password), // Base64 encode for backend
        productionSupervisor,
        reqDelDateBegin: formattedDateBegin,
        reqDelDateEnd: formattedDateEnd
      }

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔍 Fetching production orders for supervisor:', {
          productionSupervisor,
          reqDelDateBegin: formattedDateBegin,
          reqDelDateEnd: formattedDateEnd,
          hasCredentials: !!(credentials.username && credentials.password)
        })
      }

      // Call the endpoint: /api/sap/getProductionOrdersByProductionSupervisor
      const response = await apiClient.get<ProductionOrderDto[]>(
        `${this.endpoint}/getProductionOrdersByProductionSupervisor`, 
        params
      )
      
      const productionOrders = Array.isArray(response) ? response : []

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('📊 Production orders fetched successfully:', {
          productionSupervisor,
          ordersCount: productionOrders.length,
          orders: productionOrders
        })
      }

      return productionOrders

    } catch (error) {
      console.error('❌ Failed to fetch production orders by supervisor:', error)
      
      if (error instanceof Error) {
        throw new Error(`Failed to fetch production orders for supervisor ${productionSupervisor}: ${error.message}`)
      }
      throw new Error(`Failed to fetch production orders for supervisor ${productionSupervisor}: Unknown error`)
    }
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

  async getProductionSupervisors(): Promise<ProductionSupervisor[]> {
    try {
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔍 Fetching production supervisors')
      }

      // Call the endpoint: /api/sap/getProductionSupervisor
      const response = await apiClient.get<ProductionSupervisor[]>(
        `${this.endpoint}/getProductionSupervisor`
      )
      
      const supervisors = Array.isArray(response) ? response : []

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('📊 Production supervisors fetched successfully:', {
          supervisorsCount: supervisors.length,
          supervisors
        })
      }

      return supervisors

    } catch (error) {
      console.error('❌ Failed to fetch production supervisors:', error)
      
      if (error instanceof Error) {
        throw new Error(`Failed to fetch production supervisors: ${error.message}`)
      }
      throw new Error('Failed to fetch production supervisors: Unknown error')
    }
  }

  /**
   * Get work centers by production supervisor
   */
  async getWorkCentersByProductionSupervisor(
    productionSupervisor: string
  ): Promise<WorkCenter[]> {
    try {
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔍 Fetching work centers for supervisor:', productionSupervisor)
      }

      const params = {
        productionSupervisor
      }

      // Call the endpoint: /api/sap/getWorkCentersByProductionSupervisor
      const response = await apiClient.get<WorkCenter[]>(
        `${this.endpoint}/getWorkCentersByProductionSupervisor`,
        params
      )
      
      const workCenters = Array.isArray(response) ? response : []

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('📊 Work centers fetched successfully:', {
          productionSupervisor,
          workCentersCount: workCenters.length,
          workCenters
        })
      }

      return workCenters

    } catch (error) {
      console.error('❌ Failed to fetch work centers:', error)
      
      if (error instanceof Error) {
        throw new Error(`Failed to fetch work centers for supervisor ${productionSupervisor}: ${error.message}`)
      }
      throw new Error(`Failed to fetch work centers for supervisor ${productionSupervisor}: Unknown error`)
    }
  }

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
      const response = await apiClient.post<string>(url, null)

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('✅ Planned order converted successfully:', {
          plannedOrder,
          manufacturingOrderType,
          response
        })
      }

      // The backend returns a string which is the production order number
      const productionOrderNumber = typeof response === 'string' ? response : response?.toString() || ''

      return {
        success: true,
        message: `Планираната поръчка ${plannedOrder} беше успешно конвертирана към производствена поръчка ${productionOrderNumber}`,
        productionOrder: productionOrderNumber
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
   * Create production order with production version
   */
  async createProductionOrder(
    material: string,
    productionPlant: string,
    manufacturingOrderType: string,
    totalQuantity: string,
    productionVersion?: string
  ): Promise<ProductionOrderCreateResponse> {
    try {
      // Get credentials
      const credentials = this.getCredentials()

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('➕ Creating production order:', {
          material,
          productionPlant,
          manufacturingOrderType,
          totalQuantity,
          productionVersion,
          hasCredentials: !!(credentials.username && credentials.password)
        })
      }

      // Ensure credentials are not empty
      if (!credentials.username || !credentials.password) {
        throw new Error('Username or password is empty')
      }

      const params: any = {
        username: btoa(credentials.username), // Base64 encode for backend
        password: btoa(credentials.password), // Base64 encode for backend
        material,
        productionPlant,
        manufacturingOrderType,
        totalQuantity
      }

      // Add production version if provided (as string)
      if (productionVersion !== undefined && productionVersion !== null && productionVersion !== '') {
        params.productionVersion = productionVersion
      }

      // Build query string manually
      const queryString = new URLSearchParams(params).toString()

      const url = `${this.endpoint}/createProductionOrder?${queryString}`

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('➕ Calling createProductionOrder API:', {
          url: url.replace(/password=[^&]+/, 'password=[HIDDEN]'),
          material,
          productionPlant,
          manufacturingOrderType,
          totalQuantity,
          productionVersion
        })
      }

      // Call the endpoint using POST with query string in URL
      const response = await apiClient.post<string>(url, null)

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('✅ Production order created successfully:', {
          material,
          productionPlant,
          response
        })
      }

      // The backend returns a string which is the production order number
      const productionOrderNumber = typeof response === 'string' ? response : response?.toString() || ''

      return {
        success: true,
        message: `Производствената поръчка ${productionOrderNumber} беше успешно създадена за материал ${material}`,
        productionOrder: productionOrderNumber
      }

    } catch (error) {
      console.error('❌ Failed to create production order:', error)
      
      let errorMessage = 'Възникна неочаквана грешка при създаването'
      
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
        message: `Неуспешно създаване на производствена поръчка за материал ${material}: ${errorMessage}`
      }
    }
  }

  /**
   * Update production order with scheduled start date/time and schedule flag
   */
  /**
 * Update production order with scheduled start date/time and schedule flag
 */
async updateProductionOrder(
  productionOrder: string,
  scheduledStartDateTime: string,
  schedule: boolean = true
): Promise<ProductionOrderUpdateResponse> {
  try {
    const credentials = this.getCredentials()

    if (!credentials.username || !credentials.password) {
      throw new Error('Username or password is empty')
    }

    // Build query string
    const queryString = new URLSearchParams({
      username: btoa(credentials.username),
      password: btoa(credentials.password),
      productionOrder: productionOrder,
      scheduledStartDateTime: scheduledStartDateTime,
      schedule: schedule.toString()
    }).toString()

    const url = `${this.endpoint}/updateProductionOrder?${queryString}`

    if (isFeatureEnabled('DEBUG_MODE')) {
      console.log('🔄 Calling updateProductionOrder:', {
        productionOrder,
        scheduledStartDateTime,
        schedule
      })
    }

    const response = await apiClient.post<any>(url, null)

    return {
      success: true,
      message: `Производствената поръчка ${productionOrder} беше успешно ${schedule ? 'планирана' : 'премахната от плана'}`
    }

  } catch (error) {
    console.error('❌ Failed to update production order:', error)
    
    let errorMessage = 'Възникна неочаквана грешка при актуализацията'
    
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return {
      success: false,
      message: `Неуспешна актуализация на производствена поръчка ${productionOrder}: ${errorMessage}`
    }
  }
}

  /**
   * Update production version for a production order
   */
  async updateProductionVersion(
    productionOrder: string,
    productionVersion: string
  ): Promise<ProductionVersionUpdateResponse> {
    try {
      // Get credentials
      const credentials = this.getCredentials()

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔧 Updating production version for production order:', {
          productionOrder,
          productionVersion,
          hasCredentials: !!(credentials.username && credentials.password)
        })
      }

      // Ensure credentials are not empty
      if (!credentials.username || !credentials.password) {
        throw new Error('Username or password is empty')
      }

      const params = {
        username: btoa(credentials.username),
        password: btoa(credentials.password),
        productionOrder,
        productionVersion
      }

      // Build query string manually
      const queryString = new URLSearchParams({
        username: params.username,
        password: params.password,
        productionOrder: params.productionOrder,
        productionVersion: params.productionVersion
      }).toString()

      const url = `${this.endpoint}/updateProductionVersion?${queryString}`

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔧 Calling updateProductionVersion API:', {
          url: url.replace(/password=[^&]+/, 'password=[HIDDEN]'),
          productionOrder,
          productionVersion
        })
      }

      // Call the endpoint using POST with query string in URL
      const response = await apiClient.post<any>(url, null)

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('✅ Production version updated successfully:', {
          productionOrder,
          productionVersion,
          response
        })
      }

      return {
        success: true,
        message: `Производствената версия за поръчка ${productionOrder} беше успешно актуализирана на ${productionVersion}`
      }

    } catch (error) {
      console.error('❌ Failed to update production version:', error)
      
      let errorMessage = 'Възникна неочаквана грешка при актуализацията на версията'
      
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
        message: `Неуспешна актуализация на версията за поръчка ${productionOrder}: ${errorMessage}`
      }
    }
  }

  /**
   * Update production order quantity
   */
  async updateProductionOrderQuantity(
    productionOrder: string,
    quantity: string
  ): Promise<ProductionOrderUpdateResponse> {
    try {
      // Get credentials
      const credentials = this.getCredentials()

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('📦 Updating production order quantity:', {
          productionOrder,
          quantity,
          hasCredentials: !!(credentials.username && credentials.password)
        })
      }

      // Ensure credentials are not empty
      if (!credentials.username || !credentials.password) {
        throw new Error('Username or password is empty')
      }

      const params = {
        username: btoa(credentials.username),
        password: btoa(credentials.password),
        productionOrderOrder: productionOrder, // Note: parameter name is productionOrderOrder
        quantity
      }

      // Build query string manually
      const queryString = new URLSearchParams({
        username: params.username,
        password: params.password,
        productionOrderOrder: params.productionOrderOrder,
        quantity: params.quantity
      }).toString()

      const url = `${this.endpoint}/updateProductionOrderQuantity?${queryString}`

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('📦 Calling updateProductionOrderQuantity API:', {
          url: url.replace(/password=[^&]+/, 'password=[HIDDEN]'),
          productionOrder,
          quantity
        })
      }

      // Call the endpoint using POST with query string in URL
      const response = await apiClient.post<any>(url, null)

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('✅ Production order quantity updated successfully:', {
          productionOrder,
          quantity,
          response
        })
      }

      return {
        success: true,
        message: `Количеството за поръчка ${productionOrder} беше успешно актуализирано на ${quantity}`
      }

    } catch (error) {
      console.error('❌ Failed to update production order quantity:', error)
      
      let errorMessage = 'Възникна неочаквана грешка при актуализацията на количеството'
      
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
        message: `Неуспешна актуализация на количеството за поръчка ${productionOrder}: ${errorMessage}`
      }
    }
  }

  /**
   * Update storage location for a manufacturing order
   */
  async updateStorageLocation(
    manufacturingOrder: string,
    newStorageLocation: string
  ): Promise<StorageLocationUpdateResponse> {
    try {
      // Get credentials
      const credentials = this.getCredentials()

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('📦 Updating storage location:', {
          manufacturingOrder,
          newStorageLocation,
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
        manufacturingOrder,
        newStorageLocation
      }

      // Build query string manually
      const queryString = new URLSearchParams({
        username: params.username,
        password: params.password,
        manufacturingOrder: params.manufacturingOrder,
        newStorageLocation: params.newStorageLocation
      }).toString()

      const url = `${this.endpoint}/updateStorageLocation?${queryString}`

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('📦 Calling updateStorageLocation API:', {
          url: url.replace(/password=[^&]+/, 'password=[HIDDEN]'),
          manufacturingOrder,
          newStorageLocation
        })
      }

      // Call the endpoint using POST with query string in URL
      const response = await apiClient.post<string>(url, null)

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('✅ Storage location updated successfully:', {
          manufacturingOrder,
          newStorageLocation,
          response
        })
      }

      return {
        success: true,
        message: `Складът за поръчка ${manufacturingOrder} беше успешно актуализиран на ${newStorageLocation}`
      }

    } catch (error) {
      console.error('❌ Failed to update storage location:', error)
      
      let errorMessage = 'Възникна неочаквана грешка при актуализацията на склада'
      
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
        message: `Неуспешна актуализация на склада за поръчка ${manufacturingOrder}: ${errorMessage}`
      }
    }
  }

  /**
   * Update production version for a manufacturing order
   */
  async updateProductionVersionForManufacturingOrder(
    manufacturingOrder: string,
    productionVersion: string
  ): Promise<ProductionVersionUpdateResponse> {
    try {
      // Get credentials
      const credentials = this.getCredentials()

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔧 Updating production version:', {
          manufacturingOrder,
          productionVersion,
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
        manufacturingOrder,
        productionVersion
      }

      // Build query string manually
      const queryString = new URLSearchParams({
        username: params.username,
        password: params.password,
        manufacturingOrder: params.manufacturingOrder,
        productionVersion: params.productionVersion
      }).toString()

      const url = `${this.endpoint}/updateProductionVersion?${queryString}`

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔧 Calling updateProductionVersion API:', {
          url: url.replace(/password=[^&]+/, 'password=[HIDDEN]'),
          manufacturingOrder,
          productionVersion
        })
      }

      // Call the endpoint using POST with query string in URL
      const response = await apiClient.post<any>(url, null)

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('✅ Production version updated successfully:', {
          manufacturingOrder,
          productionVersion,
          response
        })
      }

      return {
        success: true,
        message: `Производствената версия за поръчка ${manufacturingOrder} беше успешно актуализирана на ${productionVersion}`
      }

    } catch (error) {
      console.error('❌ Failed to update production version:', error)
      
      let errorMessage = 'Възникна неочаквана грешка при актуализацията на версията'
      
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
        message: `Неуспешна актуализация на версията за поръчка ${manufacturingOrder}: ${errorMessage}`
      }
    }
  }

  /**
   * Update production order scheduling status (to remove from plan)
   * Sets schedule = false to unschedule the production order
   */
  async unscheduleProductionOrder(
    productionOrder: string,
    scheduledStartDate: string,
    scheduledStartTime: string
  ): Promise<ProductionOrderUpdateResponse> {
    try {
      const credentials = this.getCredentials()

      if (!credentials.username || !credentials.password) {
        throw new Error('Липсват креденциали за вход')
      }

      // Validate and ensure time is a string
      const timeStr = String(scheduledStartTime || '00:00')

      // Combine date and time for scheduledStartDateTime
      const scheduledStartDateTime = this.createLocalDateTime(
        scheduledStartDate,
        timeStr
      )

      // Build query string with proper parameter separation - matching updateProductionOrder pattern
      const queryString = new URLSearchParams({
        username: btoa(credentials.username),
        password: btoa(credentials.password),
        productionOrder: productionOrder,
        scheduledStartDateTime: scheduledStartDateTime,
        schedule: 'false' // Set to false to unschedule/remove from plan
      }).toString()
      const url = `${this.endpoint}/updateProductionOrder?${queryString}`

      console.log('📄 Calling updateProductionOrder with URL:', url.replace(/password=[^&]+/, 'password=[HIDDEN]'))
      console.log('📅 Scheduled Start DateTime:', scheduledStartDateTime)
      console.log('📦 Schedule flag:', false)

      // Use the same POST call pattern
      const response = await apiClient.post<any>(url, null)

      console.log('✅ Production order update successful, response:', response)

      return {
        success: true,
        message: `Производствената поръчка ${productionOrder} беше успешно премахната от плана`
      }

    } catch (error) {
      console.error('❌ Failed to update production order:', error)
      
      let errorMessage = 'Възникна неочаквана грешка при актуализацията'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }

      return {
        success: false,
        message: `Неуспешна актуализация на поръчка ${productionOrder}: ${errorMessage}`
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
}

// Export singleton instance
export const productionOrderService = new ProductionOrderService()
export default ProductionOrderService