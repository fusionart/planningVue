// src/types/productionOrder.ts

/**
 * Production Order DTO interface matching the Java ProductionOrderDto
 */
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
  mfgOrderScheduledStartDate: string // LocalDate as string (YYYY-MM-DD)
  mfgOrderScheduledStartTime: string // LocalTime as string (HH:mm:ss)
  mfgOrderScheduledEndDate: string   // LocalDate as string (YYYY-MM-DD)
  mfgOrderScheduledEndTime: string   // LocalTime as string (HH:mm:ss)
  productionUnit: string
  totalQuantity: number
  mfgOrderConfirmedYieldQty: number
  salesOrder: string
}

/**
 * Filters for production order requests
 */
export interface ProductionOrderFilters {
  material: string
  reqDelDateBegin: string // LocalDateTime string (YYYY-MM-DDTHH:mm:ss)
  reqDelDateEnd: string   // LocalDateTime string (YYYY-MM-DDTHH:mm:ss)
}

/**
 * Production order statistics
 */
export interface ProductionOrderStats {
  totalOrders: number
  releasedOrders: number
  scheduledOrders: number
  totalQuantity: number
  confirmedQuantity: number
  completionPercentage: number
  averageDuration: number // in days
  uniquePlants: number
  uniqueWorkCenters: number
}

/**
 * Production order status
 */
export type ProductionOrderStatus = 'released' | 'not-released' | 'scheduled' | 'not-scheduled'

/**
 * Production order with computed fields
 */
export interface ProductionOrderWithMetadata extends ProductionOrderDto {
  duration?: number // calculated duration in days
  completionPercentage?: number // calculated completion percentage
  status?: {
    released: boolean
    scheduled: boolean
    displayText: string
  }
  formattedDates?: {
    startDate: string
    startTime: string
    endDate: string
    endTime: string
  }
  formattedQuantities?: {
    total: string
    confirmed: string
    unit: string
  }
}

/**
 * API response wrapper for production orders
 */
export interface ProductionOrderResponse {
  content: ProductionOrderDto[]
  total: number
  success: boolean
  message?: string
}

/**
 * Production order service error
 */
export interface ProductionOrderError {
  code: string
  message: string
  details?: any
}

/**
 * Export options for production orders
 */
export interface ProductionOrderExportOptions {
  format: 'csv' | 'excel' | 'pdf'
  includeStats: boolean
  dateRange: {
    from: Date
    to: Date
  }
  material: string
}