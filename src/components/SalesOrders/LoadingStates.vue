<!-- LoadingStates.vue -->
<template>
  <!-- Credentials Required Notice -->
  <div v-if="!hasCredentials && !showCredentialsModal && !localCredentialsState" class="credentials-notice">
    <div class="notice-content">
      <div class="notice-icon">🔐</div>
      <div class="notice-text">
        <h3>SAP изискват се идентификационни данни</h3>
        <p>Моля въведете вашите потребителско име и парола за SAP.</p>
      </div>
      <button class="btn btn-primary" @click="$emit('show-credentials')">
        Въведете потребител и парола
      </button>
    </div>
  </div>

  <!-- Loading State -->
  <div v-if="loading" class="loading-state">
    <div class="loading-spinner"></div>
    <p>Зареждане на данни от SAP ...</p>
    <p class="loading-sub">Моля изчакайте ...</p>
  </div>

  <!-- Error State -->
  <div v-else-if="hasError" class="error-state">
    <div class="error-icon">❌</div>
    <p class="error-message">{{ error }}</p>
    <div class="error-actions">
      <button class="btn btn-primary" @click="$emit('clear-error')">
        Dismiss
      </button>
      <button class="btn btn-secondary" @click="$emit('show-credentials')">
        Check Credentials
      </button>
      <button class="btn btn-secondary" @click="$emit('clear-credentials')">
        Clear Credentials
      </button>
    </div>
  </div>

  <!-- Empty State -->
  <div v-else-if="isEmpty && (hasCredentials || localCredentialsState)" class="empty-state">
    <div class="empty-icon">📋</div>
    <p>No sales orders found for the selected date range.</p>
    <p class="empty-sub">Try adjusting the date range or load data for a different period.</p>
    <button class="btn btn-primary" @click="$emit('load-current-month')">
      Load Current Month
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  hasCredentials: boolean
  showCredentialsModal: boolean
  localCredentialsState: boolean
  loading: boolean
  hasError: boolean
  error: string
  isEmpty: boolean
}

defineProps<Props>()

interface Emits {
  'show-credentials': []
  'clear-error': []
  'clear-credentials': []
  'load-current-month': []
}

defineEmits<Emits>()
</script>

<style scoped>
@import '@/styles/components/SalesOrders/LoadingStates.css';
</style>