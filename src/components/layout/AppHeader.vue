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
          <button class="nav-item">Notifications</button>
          <button class="nav-item">Logout</button>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { apiClient } from '@/services/apiClient';

const loading = ref(false);

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
    alert(response.message || 'Production versions updated successfully');
    
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
</script>

<style scoped>
@import '@/styles/components/header.css';

.nav-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>