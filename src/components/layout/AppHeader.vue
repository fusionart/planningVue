<template>
  <header class="app-header">
    <div class="header-container">
      <div class="header-brand">
        <h1 class="brand-title">Планиране</h1>
      </div>
      <nav class="header-nav">
        <div class="nav-items">
          <button class="nav-item" @click="handleProfileClick" :disabled="loading">
            {{ loading ? 'Loading...' : 'Profile' }}
          </button>
          <button 
            class="nav-item" 
            :class="hasCredentials ? 'has-credentials' : 'no-credentials'"
            @click="handleCredentialsClick"
          >
            {{ hasCredentials ? '🔐 Credentials' : '🔓 Credentials' }}
          </button>
          <button class="nav-item">Logout</button>
        </div>
      </nav>
    </div>

    <!-- Credentials Modal -->
    <CredentialsModal
      :show="showCredentialsModal"
      @login-success="handleLoginSuccess"
      @close="handleCloseCredentialsModal"
    />

    <!-- Success Toast -->
    <div 
      v-if="showToast"
      class="toast toast-success"
    >
      <div class="toast-content">
        <span class="toast-icon">✅</span>
        <span class="toast-message">{{ toastMessage }}</span>
        <button 
          class="toast-close"
          @click="showToast = false"
        >
          ✕
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { apiClient } from '@/services/apiClient';
import { salesOrderService } from '@/services/salesOrderService';
import CredentialsModal from '@/components/SalesOrders/CredentialsModal.vue';

const loading = ref(false);
const showCredentialsModal = ref(false);

// Toast state
const showToast = ref(false);
const toastMessage = ref('');

/**
 * Get stored credentials (Base64 encoded) - same pattern as productionOrderService
 */
const getStoredCredentials = () => {
  try {
    const stored = sessionStorage.getItem('sales_order_credentials');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to retrieve stored credentials:', error);
  }
  
  return { username: '', password: '' };
};

/**
 * Get credentials for API calls (reuse from productionOrderService pattern)
 */
const getCredentials = () => {
  // Check if credentials are stored (they are already Base64 encoded in storage)
  const storedCredentials = getStoredCredentials();
  if (storedCredentials.username && storedCredentials.password) {
    return {
      // Decode from storage to get plain text for API call
      username: atob(storedCredentials.username),
      password: atob(storedCredentials.password)
    };
  }

  throw new Error('SAP credentials not found. Please provide username and password via the credentials modal.');
};

/**
 * Check if credentials exist
 */
const hasCredentials = computed(() => {
  return salesOrderService.hasCredentials();
});

/**
 * Handle Profile button click - imports production versions
 */
const handleProfileClick = async () => {
  try {
    loading.value = true;
    
    // Get credentials using the same pattern as productionOrderService
    const credentials = getCredentials();
    
    // Ensure credentials are not empty
    if (!credentials.username || !credentials.password) {
      throw new Error('Username or password is empty');
    }

    // Build query string with Base64 encoded credentials
    const params = {
      username: btoa(credentials.username),
      password: btoa(credentials.password)
    };

    const queryString = new URLSearchParams(params).toString();
    const url = `/api/sap/importProductionVersions?${queryString}`;

    console.log('🔄 Calling getProductionVersions API');

    // Call the endpoint using apiClient
    const response = await apiClient.get<{ message: string }>(url);

    console.log('✅ Production versions updated successfully:', response);
    
    // Show success message
    showSuccessToast(response.message || 'Production versions updated successfully');
    
  } catch (error) {
    console.error('❌ Failed to update production versions:', error);
    
    let errorMessage = 'Failed to update production versions';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      const apiError = error as any;
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      } else if (apiError.response?.data) {
        errorMessage = JSON.stringify(apiError.response.data);
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }
    }
    
    alert(errorMessage);
  } finally {
    loading.value = false;
  }
};

/**
 * Handle Credentials button click - opens the modal
 */
const handleCredentialsClick = () => {
  console.log('🔐 Credentials button clicked in header, opening modal');
  showCredentialsModal.value = true;
};

/**
 * Handle successful login from CredentialsModal
 */
const handleLoginSuccess = (credentials: { username: string; password: string }) => {
  console.log('✅ Login successful, saving credentials');
  
  // Save credentials using salesOrderService
  salesOrderService.setCredentials(credentials.username, credentials.password);
  
  // Show success toast
  showSuccessToast('Идентификационните данни са запазени успешно!');
  
  // Dispatch custom event so child components know credentials were updated
  window.dispatchEvent(new CustomEvent('credentials-updated'));
};

/**
 * Handle credentials modal close
 */
const handleCloseCredentialsModal = () => {
  console.log('🔐 Credentials modal closed');
  showCredentialsModal.value = false;
};

/**
 * Show success toast message
 */
const showSuccessToast = (message: string) => {
  toastMessage.value = message;
  showToast.value = true;
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    showToast.value = false;
  }, 5000);
};
</script>

<style scoped>
@import '@/styles/components/header.css';

.nav-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.nav-item.has-credentials {
  color: #10b981; /* Green for has credentials */
  font-weight: 500;
}

.nav-item.no-credentials {
  color: #f59e0b; /* Orange for no credentials */
  font-weight: 500;
}

.nav-item.has-credentials:hover {
  background-color: rgba(16, 185, 129, 0.1);
}

.nav-item.no-credentials:hover {
  background-color: rgba(245, 158, 11, 0.1);
}

/* Toast styles */
.toast {
  position: fixed;
  top: 5rem;
  right: 2rem;
  z-index: 1002;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(4px);
  animation: slideIn 0.3s ease-out;
  max-width: 400px;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-success {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border: 1px solid #22c55e;
  color: #15803d;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toast-icon {
  font-size: 1.25rem;
}

.toast-message {
  font-weight: 600;
  flex: 1;
}

.toast-close {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  color: inherit;
}

.toast-close:hover {
  opacity: 1;
}

@media (max-width: 640px) {
  .toast {
    top: 4rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
}
</style>