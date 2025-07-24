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
  requestedDeliveryDate: string; // ISO string format from API
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

// Backend request parameters
export interface SalesOrderRequest {
  username: string;
  password: string;
  reqDelDateBegin: string; // ISO DateTime format
  reqDelDateEnd: string;   // ISO DateTime format
}