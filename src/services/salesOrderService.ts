// src/services/salesOrderService.ts

import { apiClient } from './apiClient'
import type { SalesOrderDto, PaginatedResponse } from '@/types/api'

export interface SalesOrderFilters {
  salesOrderNumber?: string
  soldToParty?: string
  requestedDeliveryWeek?: string
  completeDelivery?: boolean
  dateFrom?: string
  dateTo?: string
}

export interface PaginationParams {
  page?: number
  size?: number
  sort?: string
  direction?: 'asc' | 'desc'
}

class SalesOrderService {
  private readonly endpoint = '/sales-orders'

  /**
   * Fetch all sales orders with optional filtering and pagination
   */
  async getSalesOrders(
    filters: SalesOrderFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<SalesOrderDto>> {
    const params = {
      ...filters,
      page: pagination.page || 0,
      size: pagination.size || 20,
      sort: pagination.sort || 'salesOrderNumber',
      direction: pagination.direction || 'asc'
    }

    return apiClient.get<PaginatedResponse<SalesOrderDto>>(this.endpoint, params)
  }

  /**
   * Fetch a single sales order by its number
   */
  async getSalesOrderByNumber(salesOrderNumber: string): Promise<SalesOrderDto> {
    return apiClient.get<SalesOrderDto>(`${this.endpoint}/${salesOrderNumber}`)
  }

  /**
   * Create a new sales order
   */
  async createSalesOrder(salesOrder: Omit<SalesOrderDto, 'salesOrderNumber'>): Promise<SalesOrderDto> {
    return apiClient.post<SalesOrderDto>(this.endpoint, salesOrder)
  }

  /**
   * Update an existing sales order
   */
  async updateSalesOrder(salesOrderNumber: string, salesOrder: Partial<SalesOrderDto>): Promise<SalesOrderDto> {
    return apiClient.put<SalesOrderDto>(`${this.endpoint}/${salesOrderNumber}`, salesOrder)
  }

  /**
   * Delete a sales order
   */
  async deleteSalesOrder(salesOrderNumber: string): Promise<void> {
    return apiClient.delete<void>(`${this.endpoint}/${salesOrderNumber}`)
  }

  /**
   * Search sales orders by text query
   */
  async searchSalesOrders(
    query: string,
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<SalesOrderDto>> {
    const params = {
      q: query,
      page: pagination.page || 0,
      size: pagination.size || 20
    }

    return apiClient.get<PaginatedResponse<SalesOrderDto>>(`${this.endpoint}/search`, params)
  }

  /**
   * Get sales orders by delivery week
   */
  async getSalesOrdersByDeliveryWeek(week: string): Promise<SalesOrderDto[]> {
    return apiClient.get<SalesOrderDto[]>(`${this.endpoint}/delivery-week/${week}`)
  }

  /**
   * Get sales orders statistics
   */
  async getSalesOrdersStats(): Promise<{
    totalOrders: number
    completedOrders: number
    pendingOrders: number
    totalValue: number
  }> {
    return apiClient.get<{
      totalOrders: number
      completedOrders: number
      pendingOrders: number
      totalValue: number
    }>(`${this.endpoint}/stats`)
  }
}

// Export singleton instance
export const salesOrderService = new SalesOrderService()
export default SalesOrderService