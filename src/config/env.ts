// src/config/env.ts - Practical configuration for your sales order project

export const env = {
  // App Information
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Sales Order Management System',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // API Configuration for your Spring Boot backend
  API: {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
    RETRY_ATTEMPTS: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3,
    // Sales Order specific endpoints
    SALES_ORDERS_ENDPOINT: '/sales-orders',
    SALES_STATS_ENDPOINT: '/sales-orders/stats',
  },
  
  // Feature Flags specific to your project
  FEATURES: {
    DEBUG_MODE: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
    MOCK_DATA: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
    ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    DEV_TOOLS: import.meta.env.VITE_SHOW_DEV_TOOLS === 'true',
    // Sales Order specific features
    ENABLE_ORDER_EDITING: import.meta.env.VITE_ENABLE_ORDER_EDITING === 'true',
    ENABLE_BULK_OPERATIONS: import.meta.env.VITE_ENABLE_BULK_OPERATIONS === 'true',
    ENABLE_EXPORT_FEATURES: import.meta.env.VITE_ENABLE_EXPORT_FEATURES === 'true',
    ENABLE_REAL_TIME_UPDATES: import.meta.env.VITE_ENABLE_REAL_TIME_UPDATES === 'true',
  },
  
  // UI Configuration for Sales Orders
  UI: {
    ITEMS_PER_PAGE: parseInt(import.meta.env.VITE_ITEMS_PER_PAGE) || 20,
    MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 5242880, // 5MB
    DEFAULT_DATE_FORMAT: import.meta.env.VITE_DATE_FORMAT || 'YYYY-MM-DD',
    CURRENCY: import.meta.env.VITE_CURRENCY || 'USD',
    TIMEZONE: import.meta.env.VITE_TIMEZONE || 'UTC',
    // Refresh intervals
    DASHBOARD_REFRESH_INTERVAL: parseInt(import.meta.env.VITE_DASHBOARD_REFRESH_INTERVAL) || 30000, // 30 seconds
    ORDERS_AUTO_REFRESH: parseInt(import.meta.env.VITE_ORDERS_AUTO_REFRESH) || 60000, // 1 minute
  },
  
  // Authentication (if your backend requires it)
  AUTH: {
    PROVIDER: import.meta.env.VITE_AUTH_PROVIDER || 'local',
    SKIP_AUTH: import.meta.env.VITE_SKIP_AUTH === 'true',
    TOKEN_STORAGE_KEY: 'sales_order_auth_token',
    REFRESH_TOKEN_KEY: 'sales_order_refresh_token',
  },
  
  // Logging Configuration
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
  
  // Environment Detection
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
} as const

// Validation function for your specific project
export const validateEnvironment = () => {
  const required = [
    'VITE_API_BASE_URL',
  ]
  
  const optional = [
    'VITE_APP_NAME',
    'VITE_ITEMS_PER_PAGE',
    'VITE_ENABLE_DEBUG_MODE',
  ]
  
  const missing = required.filter(key => !import.meta.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Log configuration in development
  if (env.IS_DEVELOPMENT && env.FEATURES.DEBUG_MODE) {
    console.group('🔧 Environment Configuration')
    console.log('Mode:', env.MODE)
    console.log('API Base URL:', env.API.BASE_URL)
    console.log('Features:', env.FEATURES)
    console.log('UI Config:', env.UI)
    console.groupEnd()
  }
}

// Helper functions for your sales order application
export const isDevelopment = () => env.IS_DEVELOPMENT
export const isProduction = () => env.IS_PRODUCTION
export const getApiUrl = () => env.API.BASE_URL
export const getSalesOrdersEndpoint = () => `${env.API.BASE_URL}${env.API.SALES_ORDERS_ENDPOINT}`
export const getSalesStatsEndpoint = () => `${env.API.BASE_URL}${env.API.SALES_STATS_ENDPOINT}`
export const isFeatureEnabled = (feature: keyof typeof env.FEATURES) => env.FEATURES[feature]
export const getItemsPerPage = () => env.UI.ITEMS_PER_PAGE
export const getCurrency = () => env.UI.CURRENCY
export const getDateFormat = () => env.UI.DEFAULT_DATE_FORMAT

// Initialize environment validation
try {
  validateEnvironment()
} catch (error) {
  console.error('Environment validation failed:', error)
  if (env.IS_PRODUCTION) {
    throw error // Fail fast in production
  }
}