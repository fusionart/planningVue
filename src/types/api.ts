// src/types/api.ts - Updated for SalesOrderByDate model with finalBattery and cumulativeQuantity

export interface SalesOrderMainItem {
  quantity?: number;
  plannedOrder?: string;
  productionOrder?: string;
  customer?: string;           // Customer field
  completeDelivery?: boolean;  // Complete delivery flag
}

// Main model that matches your SalesOrderMain Java class
export interface SalesOrderMain {
  material: string;
  requestedQuantity: number;
  cumulativeQuantity: number;   // NEW: Cumulative quantity field
  availableNotCharged: number;
  availableCharged: number;
  finalBattery: number;        // Final battery field
  requestedQuantityUnit: string;
  plant: string;
  // Now including dynamicSoItems
  dynamicSoItems?: Record<string, SalesOrderMainItem>;
}

// New model that matches your SalesOrderByDate Java class
export interface SalesOrderByDate {
  reqDlvWeek: string;
  salesOrderMainList: SalesOrderMain[];
}

// Keep the old interfaces for backward compatibility if needed elsewhere
export interface SalesOrderItem {
  itemNumber?: string;
  materialNumber?: string;
  materialDescription?: string;
  quantity?: number;
  unitOfMeasure?: string;
  requestedDeliveryDate?: string;
  confirmedDeliveryDate?: string;
  plant?: string;
  storageLocation?: string;
}

export interface SalesOrderHeader {
  salesOrderNumber: string;
  soldToParty: string;
  requestedDeliveryDate: string;
  requestedDeliveryWeek: string;
  overallTotalDeliveryStatus?: string;
  toItem: SalesOrderItem[];
}

// Backend response format based on your controller
export interface SalesOrdersResponse {
  success: boolean;
  data: SalesOrderHeader[];
  message?: string;
}

// DTO that matches the backend MapToSalesOrderDto service output
export interface SalesOrderDto {
  salesOrderNumber: string;
  soldToParty: string;
  requestedDeliveryDate: string;
  requestedDeliveryWeek: string;
  completeDelivery: boolean;
  toItem: SalesOrderItem[];
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// API Error interface
export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
  path?: string;
}

// Backend request parameters for SalesOrderItemsController
export interface SalesOrderItemsRequest {
  username: string;
  password: string;
  reqDelDateBegin: string; // LocalDateTime format
  reqDelDateEnd: string;   // LocalDateTime format
}