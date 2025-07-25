// src/services/apiClient.ts - Improved version with better error handling

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
      console.log('Mode:', env.MODE)
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
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'omit', // Don't send cookies
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
        console.log('Mode:', config.mode)
        if (config.body) {
          console.log('Body:', config.body)
        }
        console.groupEnd()
      }

      const response = await fetch(url, config)
      clearTimeout(timeoutId)
      
      // Log response details in debug mode
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.group(`📡 API Response (attempt ${attempt})`)
        console.log('Status:', response.status)
        console.log('Status Text:', response.statusText)
        console.log('Headers:', Object.fromEntries(response.headers.entries()))
        console.log('OK:', response.ok)
        console.groupEnd()
      }
      
      if (!response.ok) {
        let errorData: ApiError
        
        try {
          errorData = await response.json()
        } catch (parseError) {
          // If we can't parse the error response, create a generic error
          errorData = {
            message: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status,
            timestamp: new Date().toISOString()
          }
        }
        
        // Log error in debug mode
        if (isFeatureEnabled('DEBUG_MODE')) {
          console.error('❌ API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            url: url
          })
        }
        
        throw new Error(errorData.message || `Request failed with status ${response.status}`)
      }

      const data = await response.json()
      
      // Log successful response in debug mode
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.group('✅ API Success Response')
        console.log('Status:', response.status)
        console.log('Data Type:', Array.isArray(data) ? 'Array' : typeof data)
        console.log('Data Length:', Array.isArray(data) ? data.length : 'N/A')
        console.log('Sample Data:', Array.isArray(data) ? data.slice(0, 2) : data)
        console.groupEnd()
      }
      
      return data
    } catch (error) {
      clearTimeout(timeoutId)
      
      // Enhanced error logging
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.group(`❌ API Request Failed (attempt ${attempt}/${this.retryAttempts})`)
        console.log('URL:', url)
        console.log('Error Type:', error?.constructor?.name)
        console.log('Error Message:', error instanceof Error ? error.message : error)
        console.log('Error Stack:', error instanceof Error ? error.stack : undefined)
        
        // Check for specific error types
        if (error instanceof TypeError && error.message.includes('fetch')) {
          console.log('🔍 This looks like a network/CORS error!')
          console.log('💡 Possible causes:')
          console.log('   1. Backend server is not running')
          console.log('   2. CORS is not configured on the backend')
          console.log('   3. Wrong API URL in configuration')
          console.log('   4. Network connectivity issues')
        }
        
        if (error?.name === 'AbortError') {
          console.log('⏰ Request timed out after', this.timeout, 'ms')
        }
        
        console.groupEnd()
      }

      // Determine if we should retry
      const shouldRetry = attempt < this.retryAttempts && 
                         error instanceof Error && 
                         error.name !== 'AbortError' &&
                         // Don't retry client errors (4xx)
                         !error.message.includes('4') &&
                         // Don't retry CORS/Network errors on first attempt (they won't resolve)
                         !(error instanceof TypeError && attempt === 1)

      if (shouldRetry) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // Exponential backoff with max 5s
        
        if (isFeatureEnabled('DEBUG_MODE')) {
          console.log(`⏳ Retrying request in ${delay}ms (attempt ${attempt + 1}/${this.retryAttempts})`)
        }
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.request<T>(endpoint, options, attempt + 1)
      }

      // Enhance error message with helpful information
      let enhancedMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        enhancedMessage = `Network error: Unable to connect to the backend server at ${this.baseURL}. Please check:
1. Is your backend server running on port 8080?
2. Is CORS configured on your backend?
3. Is the API URL correct in your .env file?

Original error: ${error.message}`
      } else if (error?.name === 'AbortError') {
        enhancedMessage = `Request timeout: The request took longer than ${this.timeout}ms to complete. The backend might be slow or unresponsive.`
      }
      
      throw new Error(enhancedMessage)
    }
  }

  // Generic GET method with better URL handling
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let finalUrl = endpoint
    
    if (params) {
      const url = new URL(`${this.baseURL}${endpoint}`)
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          url.searchParams.append(key, String(params[key]))
        }
      })
      finalUrl = url.pathname + url.search
    }

    return this.request<T>(finalUrl)
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

  // Enhanced health check method
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🏥 Performing health check...')
      }
      
      const response = await this.get<{ status: string; timestamp: string }>('/health')
      
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('✅ Health check passed:', response)
      }
      
      return response
    } catch (error) {
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.warn('❌ Health check failed:', error)
      }
      throw error
    }
  }

  // Test connection method
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck()
      return true
    } catch (error) {
      return false
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

  // Debug method to test CORS
  async testCORS(): Promise<{ cors: boolean; error?: string }> {
    try {
      // Try a simple GET request
      const response = await fetch(`${this.baseURL}/health`, {
        mode: 'cors',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      return { cors: true }
    } catch (error) {
      return { 
        cors: false, 
        error: error instanceof Error ? error.message : 'Unknown CORS error' 
      }
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

// Utility function to test CORS configuration
export const testCORSConfiguration = async (): Promise<void> => {
  if (isFeatureEnabled('DEBUG_MODE')) {
    console.log('🔍 Testing CORS configuration...')
    const result = await apiClient.testCORS()
    if (result.cors) {
      console.log('✅ CORS is working correctly')
    } else {
      console.error('❌ CORS test failed:', result.error)
      console.log('💡 To fix CORS issues, add this to your Spring Boot backend:')
      console.log(`
@Configuration
@EnableWebMvc
public class CorsConfiguration implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173", "http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false)
                .maxAge(3600);
    }
}`)
    }
  }
}