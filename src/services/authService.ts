// src/services/authService.ts

import { apiClient } from './apiClient'
import { isFeatureEnabled } from '@/config/env'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  username: string | null
}

export interface SessionInfo {
  loggedIn: boolean
  username: string | null
}

class AuthService {
  private readonly endpoint = '/api/auth'

  /**
   * Login user with username and password
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔐 Attempting login for user:', username)
      }

      // Base64 encode credentials for backend
      const loginRequest: LoginRequest = {
        username: btoa(username),
        password: btoa(password)
      }

      // Call the login endpoint
      const response = await apiClient.post<LoginResponse>(
        `${this.endpoint}/login`,
        loginRequest
      )

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('✅ Login response:', {
          success: response.success,
          message: response.message,
          username: response.username
        })
      }

      // Store credentials in session storage if login is successful
      if (response.success) {
        this.storeCredentials(username, password)
      }

      return response

    } catch (error) {
      console.error('❌ Login failed:', error)
      
      let errorMessage = 'Възникна грешка при влизане в системата'
      
      if (error instanceof Error) {
        // Check if it's a 401 Unauthorized error
        if (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')) {
          errorMessage = 'Невалидно потребителско име или парола'
        } else {
          errorMessage = error.message
        }
      }

      return {
        success: false,
        message: errorMessage,
        username: null
      }
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<LoginResponse> {
    try {
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🚪 Logging out user')
      }

      // Call the logout endpoint
      const response = await apiClient.post<LoginResponse>(
        `${this.endpoint}/logout`,
        null
      )

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('✅ Logout response:', response)
      }

      // Clear stored credentials
      this.clearCredentials()

      return response

    } catch (error) {
      console.error('❌ Logout failed:', error)
      
      // Clear credentials anyway
      this.clearCredentials()

      return {
        success: false,
        message: 'Възникна грешка при излизане от системата',
        username: null
      }
    }
  }

  /**
   * Get current session info
   */
  async getSessionInfo(): Promise<SessionInfo> {
    try {
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🔍 Fetching session info')
      }

      // Call the session endpoint
      const response = await apiClient.get<SessionInfo>(
        `${this.endpoint}/session`
      )

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('📊 Session info:', response)
      }

      return response

    } catch (error) {
      console.error('❌ Failed to fetch session info:', error)
      
      return {
        loggedIn: false,
        username: null
      }
    }
  }

  /**
   * Store credentials in session storage (Base64 encoded for consistency with existing code)
   */
  private storeCredentials(username: string, password: string) {
    try {
      const credentials = {
        username: btoa(username), // Base64 encode
        password: btoa(password)  // Base64 encode
      }
      
      sessionStorage.setItem('sales_order_credentials', JSON.stringify(credentials))
      
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('💾 Credentials stored in session storage')
      }
    } catch (error) {
      console.error('❌ Failed to store credentials:', error)
    }
  }

  /**
   * Clear credentials from session storage
   */
  private clearCredentials() {
    try {
      sessionStorage.removeItem('sales_order_credentials')
      
      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🗑️ Credentials cleared from session storage')
      }
    } catch (error) {
      console.error('❌ Failed to clear credentials:', error)
    }
  }

  /**
   * Get stored credentials (Base64 encoded)
   */
  getStoredCredentials(): { username: string; password: string } {
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
   * Check if user has stored credentials
   */
  hasStoredCredentials(): boolean {
    const stored = this.getStoredCredentials()
    return !!(stored.username && stored.password)
  }

  /**
   * Get decoded credentials (plain text)
   */
  getDecodedCredentials(): { username: string; password: string } {
    const stored = this.getStoredCredentials()
    
    if (stored.username && stored.password) {
      try {
        return {
          username: atob(stored.username),
          password: atob(stored.password)
        }
      } catch (error) {
        console.error('Failed to decode credentials:', error)
      }
    }
    
    return { username: '', password: '' }
  }
}

// Export singleton instance
export const authService = new AuthService()
export default AuthService