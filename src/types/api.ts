// src/types/api.ts

export interface ToItem {
  // Add properties based on your ToItem structure
  // Example properties (adjust according to your actual ToItem structure):
  itemNumber?: string;
  materialNumber?: string;
  materialDescription?: string;
  quantity?: number;
  unitOfMeasure?: string;
  requestedDeliveryDate?: string;
  confirmedDeliveryDate?: string;
  plant?: string;
  storageLocation?: string;
  // Add other properties as needed based on your backend ToItem structure
}

export interface SalesOrderDto {
  salesOrderNumber: string;
  soldToParty: string;
  requestedDeliveryDate: string; // ISO string format from API
  requestedDeliveryWeek: string;
  completeDelivery: boolean;
  toItem: ToItem[];
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