// src/main.ts - Updated main application file with environment-aware initialization

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { env, isDevelopment, isFeatureEnabled } from '@/config/env'
import { checkApiHealth } from '@/services/apiClient'
import './styles/main.css'

// Initialize application with environment-specific configuration
async function initializeApp() {
  // Show loading indicator
  const loadingElement = document.getElementById('loading')
  if (loadingElement) {
    loadingElement.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        font-family: Arial, sans-serif;
      ">
        <div style="font-size: 24px; margin-bottom: 16px;">🚀</div>
        <div>Loading ${env.APP_NAME}...</div>
        <div style="font-size: 12px; color: #666; margin-top: 8px;">
          Environment: ${env.MODE}
        </div>
      </div>
    `
  }

  try {
    // Environment-specific initialization
    if (isDevelopment()) {
      await initializeDevelopmentMode()
    }

    if (env.IS_PRODUCTION) {
      await initializeProductionMode()
    }

    // Check API health if not in mock mode
    if (!isFeatureEnabled('MOCK_DATA')) {
      const apiHealthy = await checkApiHealth()
      if (!apiHealthy && env.IS_PRODUCTION) {
        throw new Error('API health check failed in production')
      }
    }

    // Initialize analytics if enabled
    if (isFeatureEnabled('ANALYTICS')) {
      await initializeAnalytics()
    }

    // Create and mount Vue app
    const app = createApp(App)
    app.use(router)

    // Add global properties for environment access
    app.config.globalProperties.$env = env
    app.config.globalProperties.$isFeatureEnabled = isFeatureEnabled

    // Error handling
    app.config.errorHandler = (err, vm, info) => {
      console.error('Vue Error:', err, info)
      
      // Send to analytics in production
      if (isFeatureEnabled('ANALYTICS')) {
        // analyticsService.trackError(err, info)
      }
    }

    app.mount('#app')

    // Hide loading indicator
    if (loadingElement) {
      loadingElement.style.display = 'none'
    }

    // Log successful initialization
    if (isFeatureEnabled('DEBUG_MODE')) {
      console.log(`✅ ${env.APP_NAME} v${env.APP_VERSION} initialized successfully`)
      console.log('Environment:', env.MODE)
      console.log('Features enabled:', Object.entries(env.FEATURES)
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => feature)
      )
    }

  } catch (error) {
    console.error('Failed to initialize application:', error)
    
    // Show error message to user
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div style="
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          font-family: Arial, sans-serif;
          color: #ef4444;
        ">
          <div style="font-size: 24px; margin-bottom: 16px;">❌</div>
          <div>Failed to load application</div>
          <div style="font-size: 14px; margin-top: 8px;">
            ${error instanceof Error ? error.message : 'Unknown error occurred'}
          </div>
          <button onclick="location.reload()" style="
            margin-top: 16px;
            padding: 8px 16px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">
            Retry
          </button>
        </div>
      `
    }
  }
}

// Development mode initialization
async function initializeDevelopmentMode() {
  if (!isFeatureEnabled('DEBUG_MODE')) return

  console.group('🔧 Development Mode Initialization')
  
  // Add development tools
  if (isFeatureEnabled('DEV_TOOLS')) {
    // Add Vue DevTools detection
    if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('✅ Vue DevTools detected')
    } else {
      console.log('⚠️ Vue DevTools not detected - install the browser extension')
    }

    // Add performance monitoring
    if ('performance' in window) {
      console.log('✅ Performance API available')
    }
  }

  // Log environment variables (safe ones only)
  console.log('Environment Variables:')
  console.table({
    'App Name': env.APP_NAME,
    'App Version': env.APP_VERSION,
    'API Base URL': env.API.BASE_URL,
    'Items Per Page': env.UI.ITEMS_PER_PAGE,
    'Mock Data': isFeatureEnabled('MOCK_DATA'),
    'Debug Mode': isFeatureEnabled('DEBUG_MODE'),
  })

  console.groupEnd()
}

// Production mode initialization
async function initializeProductionMode() {
  console.log(`🚀 Initializing ${env.APP_NAME} v${env.APP_VERSION} in production mode`)

  // Disable console logs in production (except errors)
  if (!isFeatureEnabled('DEBUG_MODE')) {
    console.log = () => {} // Disable console.log
    console.info = () => {} // Disable console.info
    console.warn = () => {} // Disable console.warn
    // Keep console.error for important issues
  }

  // Add production-specific optimizations
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered successfully')
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }
}

// Initialize analytics
async function initializeAnalytics() {
  if (!isFeatureEnabled('ANALYTICS')) return

  console.log('📊 Initializing analytics...')

  try {
    // Initialize Google Analytics if configured
    if (env.ANALYTICS?.GOOGLE_ANALYTICS_ID) {
      // Load Google Analytics
      const script = document.createElement('script')
      script.src = `https://www.googletagmanager.com/gtag/js?id=${env.ANALYTICS.GOOGLE_ANALYTICS_ID}`
      script.async = true
      document.head.appendChild(script)

      // Initialize gtag
      window.dataLayer = window.dataLayer || []
      function gtag(...args: any[]) {
        window.dataLayer.push(args)
      }
      gtag('js', new Date())
      gtag('config', env.ANALYTICS.GOOGLE_ANALYTICS_ID)

      console.log('✅ Google Analytics initialized')
    }

    // Initialize other analytics services as needed
    // if (env.ANALYTICS?.MIXPANEL_TOKEN) { ... }

  } catch (error) {
    console.error('Failed to initialize analytics:', error)
  }
}

// Start the application
initializeApp()

// Export for testing purposes
export { initializeApp, initializeDevelopmentMode, initializeProductionMode }