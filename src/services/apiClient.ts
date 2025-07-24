// src/services/apiClient.ts - Updated without mock data fallbacks

import { env, validateEnvironment, isDevelopment, isFeatureEnabled } from '@/config/env'
import type { ApiError } from '@/types/api'

// Validate environment on startup
validateEnvironment()

class ApiClient {
  private baseURL: string
  private timeout: number
  private retryAttempts: number
  private defaultHeaders: Record<string, string>

  constructor() {
    this.baseURL = env.API.BASE_URL
    this.timeout = env.API.TIMEOUT
    this.retryAttempts = env.API.RETRY_ATTEMPTS
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-App-Name': env.APP_NAME,
      'X-App-Version': env.APP_VERSION,
      'X-Client-Mode': env.MODE,
    }

    // Add development headers
    if (isDevelopment()) {
      this.defaultHeaders['X-Debug-Mode'] = 'true'
    }

    // Log configuration in debug mode
    if (isFeatureEnabled('DEBUG_MODE')) {
      console.group('🌐 API Client Configuration')
      console.log('Base URL:', this.baseURL)
      console.log('Timeout:', this.timeout)
      console.log('Retry Attempts:', this.retryAttempts)
      console.log('Mock Data Enabled:', false) // Always false now
      console.groupEnd()
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    
    const config: RequestInit = {
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      },
      signal: controller.signal,
      ...options
    }

    try {
      // Log request in debug mode
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.group(`🚀 API Request (attempt ${attempt}/${this.retryAttempts})`)
        console.log('URL:', url)
        console.log('Method:', config.method || 'GET')
        console.log('Headers:', config.headers)
        if (config.body) {
          console.log('Body:', config.body)
        }
        console.groupEnd()
      }

      const response = await fetch(url, config)
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          timestamp: new Date().toISOString()
        }))
        
        // Log error in debug mode
        if (isFeatureEnabled('DEBUG_MODE')) {
          console.error('❌ API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          })
        }
        
        throw new Error(errorData.message || `Request failed with status ${response.status}`)
      }

      const data = await response.json()
      
      // Log successful response in debug mode
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.group('✅ API Success Response')
        console.log('Status:', response.status)
        console.log('Data:', data)
        console.groupEnd()
      }
      
      return data
    } catch (error) {
      clearTimeout(timeoutId)
      
      // Log error details
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.error(`❌ API Request failed (attempt ${attempt}/${this.retryAttempts}):`, {
          url,
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined
        })
      }

      // Retry logic for network errors (but not for 4xx client errors)
      const shouldRetry = attempt < this.retryAttempts && 
                         error instanceof Error && 
                         error.name !== 'AbortError' &&
                         !error.message.includes('4') // Don't retry 4xx errors

      if (shouldRetry) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // Exponential backoff with max 5s
        
        if (isFeatureEnabled('DEBUG_MODE')) {
          console.log(`⏳ Retrying request in ${delay}ms (attempt ${attempt + 1}/${this.retryAttempts})`)
        }
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.request<T>(endpoint, options, attempt + 1)
      }

      // NO MOCK DATA FALLBACK - Always throw the error
      throw error
    }
  }

  // Generic GET method
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`)
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          url.searchParams.append(key, String(params[key]))
        }
      })
    }

    return this.request<T>(url.pathname + url.search)
  }

  // Generic POST method
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  // Generic PUT method
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  // Generic PATCH method
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  // Generic DELETE method
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE'
    })
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`
    
    if (isFeatureEnabled('DEBUG_MODE')) {
      console.log('🔐 Auth token set for API client')
    }
  }

  // Remove authentication token
  removeAuthToken() {
    delete this.defaultHeaders['Authorization']
    
    if (isFeatureEnabled('DEBUG_MODE')) {
      console.log('🔓 Auth token removed from API client')
    }
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.get<{ status: string; timestamp: string }>('/health')
      return response
    } catch (error) {
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.warn('Health check failed, API might be down:', error)
      }
      throw error
    }
  }

  // Get API base URL (useful for debugging)
  getBaseURL(): string {
    return this.baseURL
  }

  // Get current configuration
  getConfig() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      mode: env.MODE,
      features: env.FEATURES
    }
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient()

// Export the class for testing or custom instances
export default ApiClient

// Utility function to check API health on app startup
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await apiClient.healthCheck()
    if (isFeatureEnabled('DEBUG_MODE')) {
      console.log('✅ API health check passed')
    }
    return true
  } catch (error) {
    console.warn('⚠️ API health check failed:', error)
    return false
  }
}