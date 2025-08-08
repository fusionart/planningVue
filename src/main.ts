// src/main.ts - Updated main application file with PrimeVue

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { env, isDevelopment, isFeatureEnabled } from '@/config/env'
import { checkApiHealth } from '@/services/apiClient'
import './styles/main.css'

// PrimeVue imports
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import DatePicker from 'primevue/datepicker'
import 'primeicons/primeicons.css'

// Import PrimeVue specific styles
import './styles/components/primevue-custom.css'

import 'datatables.net-dt/css/dataTables.dataTables.css'

// Initialize application with real API connection
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
          Environment: ${env.MODE} | Mock Data: DISABLED
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

    // Always check API health - no mock data fallback
    console.log('🔍 Checking API health...')
    const apiHealthy = await checkApiHealth()
    if (!apiHealthy) {
      console.warn('⚠️ API health check failed - but continuing startup')
      // Don't throw error here as users might not have credentials yet
    }

    // Initialize analytics if enabled
    if (isFeatureEnabled('ANALYTICS')) {
      await initializeAnalytics()
    }

    // Create and mount Vue app
    const app = createApp(App)
    
    // Configure PrimeVue
    app.use(PrimeVue, {
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: 'system',
          cssLayer: false
        }
      },
      locale: {
        firstDayOfWeek: 1, // Monday as first day
        dayNames: ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'],
        dayNamesShort: ['Нед', 'Пон', 'Вто', 'Сря', 'Чет', 'Пет', 'Съб'],
        dayNamesMin: ['Н', 'П', 'В', 'С', 'Ч', 'П', 'С'],
        monthNames: [
          'Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни',
          'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'
        ],
        monthNamesShort: [
          'Ян', 'Фев', 'Мар', 'Апр', 'Май', 'Юни',
          'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек'
        ],
        today: 'Днес',
        clear: 'Изчисти',
        weekHeader: 'Седм'
      }
    })

    // Register PrimeVue components globally
    app.component('DatePicker', DatePicker)
    
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
      console.log(`✅ ${env.APP_NAME} v${env.APP_VERSION} initialized successfully with PrimeVue`)
      console.log('Environment:', env.MODE)
      console.log('Mock Data:', env.FEATURES.MOCK_DATA) // Should be false
      console.log('API Base URL:', env.API.BASE_URL)
      console.log('PrimeVue Theme:', 'Aura')
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
          <div style="font-size: 12px; margin-top: 8px; color: #666;">
            Check console for more details
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
    'Mock Data': env.FEATURES.MOCK_DATA, // Should be false
    'Debug Mode': env.FEATURES.DEBUG_MODE,
    'SAP Connection': env.FEATURES.SAP_CONNECTION,
    'PrimeVue': 'Enabled with Aura theme'
  })

  console.groupEnd()
}

// Production mode initialization
async function initializeProductionMode() {
  console.log(`🚀 Initializing ${env.APP_NAME} v${env.APP_VERSION} in production mode with PrimeVue`)

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

  } catch (error) {
    console.error('Failed to initialize analytics:', error)
  }
}

// Start the application
initializeApp()

// Export for testing purposes
export { initializeApp, initializeDevelopmentMode, initializeProductionMode }