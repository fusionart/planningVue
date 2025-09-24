// src/composables/usePlannedOrderConversion.ts

import { ref, computed } from 'vue'
import { productionOrderService, type PlannedOrderConversionResponse } from '@/services/productionOrderService'
import { isFeatureEnabled } from '@/config/env'

export function usePlannedOrderConversion() {
  // State
  const isDialogVisible = ref(false)
  const selectedPlannedOrder = ref('')
  const selectedMaterial = ref('')
  const isConverting = ref(false)
  const conversionResult = ref<PlannedOrderConversionResponse | null>(null)
  const lastConversionError = ref('')

  // Computed
  const hasCredentials = computed(() => {
    return productionOrderService.hasCredentials()
  })

  const canConvert = computed(() => {
    return hasCredentials.value && selectedPlannedOrder.value.trim() !== ''
  })

  // Methods
  const openConversionDialog = (plannedOrder: string, material: string = '') => {
    if (isFeatureEnabled('DEBUG_MODE')) {
      console.log('🔄 Opening planned order conversion dialog:', { plannedOrder, material })
    }

    selectedPlannedOrder.value = plannedOrder
    selectedMaterial.value = material
    isDialogVisible.value = true
    conversionResult.value = null
    lastConversionError.value = ''
    isConverting.value = false
  }

  const closeConversionDialog = () => {
    if (isFeatureEnabled('DEBUG_MODE')) {
      console.log('❌ Closing planned order conversion dialog')
    }

    isDialogVisible.value = false
    selectedPlannedOrder.value = ''
    selectedMaterial.value = ''
    conversionResult.value = null
    lastConversionError.value = ''
    isConverting.value = false
  }

  const convertPlannedOrder = async (plannedOrder: string, manufacturingOrderType: string) => {
    if (!canConvert.value) {
      const errorMsg = 'Cannot convert planned order: Missing credentials or planned order'
      console.error('❌', errorMsg)
      lastConversionError.value = errorMsg
      return false
    }

    if (!manufacturingOrderType.trim()) {
      const errorMsg = 'Manufacturing Order Type is required'
      console.error('❌', errorMsg)
      lastConversionError.value = errorMsg
      return false
    }

    try {
      isConverting.value = true
      lastConversionError.value = ''

      if (isFeatureEnabled('DEBUG_MODE')) {
        console.log('🚀 Starting planned order conversion:', { 
          plannedOrder, 
          manufacturingOrderType: manufacturingOrderType.trim() 
        })
      }

      // Call the production order service
      const result = await productionOrderService.convertPlannedOrder(
        plannedOrder,
        manufacturingOrderType.trim()
      )

      conversionResult.value = result
      isConverting.value = false

      if (result.success) {
        if (isFeatureEnabled('DEBUG_MODE')) {
          console.log('✅ Planned order conversion successful:', result)
        }

        // Show success feedback
        console.log(`✅ ${result.message}`)
        
        // Close dialog after short delay
        setTimeout(() => {
          closeConversionDialog()
        }, 2000)

        return true
      } else {
        if (isFeatureEnabled('DEBUG_MODE')) {
          console.log('❌ Planned order conversion failed:', result)
        }

        lastConversionError.value = result.message || 'Conversion failed for unknown reason'
        return false
      }

    } catch (error) {
      isConverting.value = false
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      console.error('❌ Planned order conversion error:', error)
      lastConversionError.value = `Conversion failed: ${errorMessage}`
      
      conversionResult.value = {
        success: false,
        message: lastConversionError.value
      }

      return false
    }
  }

  const handlePlannedOrderClick = (plannedOrder: string, material: string = '') => {
    if (!hasCredentials.value) {
      console.warn('⚠️ Cannot convert planned order: No SAP credentials available')
      lastConversionError.value = 'SAP credentials are required to convert planned orders'
      return
    }

    openConversionDialog(plannedOrder, material)
  }

  const resetConversionState = () => {
    conversionResult.value = null
    lastConversionError.value = ''
    isConverting.value = false
  }

  const getConversionStatusMessage = (): string => {
    if (conversionResult.value?.success) {
      return conversionResult.value.message || 'Conversion completed successfully'
    }
    
    if (lastConversionError.value) {
      return lastConversionError.value
    }
    
    if (isConverting.value) {
      return 'Converting planned order...'
    }
    
    return ''
  }

  const isConversionInProgress = computed(() => {
    return isConverting.value
  })

  const hasConversionError = computed(() => {
    return !!lastConversionError.value || (conversionResult.value && !conversionResult.value.success)
  })

  const hasConversionSuccess = computed(() => {
    return !!(conversionResult.value && conversionResult.value.success)
  })

  // Utility methods for formatting
  const formatPlannedOrderDisplay = (plannedOrder: string): string => {
    return plannedOrder.trim().toUpperCase()
  }

  const formatMaterialDisplay = (material: string): string => {
    return material.trim().toUpperCase()
  }

  // Debug helpers
  const debugConversionState = () => {
    if (isFeatureEnabled('DEBUG_MODE')) {
      console.log('🔍 Planned Order Conversion State:', {
        isDialogVisible: isDialogVisible.value,
        selectedPlannedOrder: selectedPlannedOrder.value,
        selectedMaterial: selectedMaterial.value,
        isConverting: isConverting.value,
        hasCredentials: hasCredentials.value,
        canConvert: canConvert.value,
        conversionResult: conversionResult.value,
        lastConversionError: lastConversionError.value
      })
    }
  }

  return {
    // State
    isDialogVisible,
    selectedPlannedOrder,
    selectedMaterial,
    isConverting,
    conversionResult,
    lastConversionError,
    
    // Computed
    hasCredentials,
    canConvert,
    isConversionInProgress,
    hasConversionError,
    hasConversionSuccess,
    
    // Methods
    openConversionDialog,
    closeConversionDialog,
    convertPlannedOrder,
    handlePlannedOrderClick,
    resetConversionState,
    getConversionStatusMessage,
    formatPlannedOrderDisplay,
    formatMaterialDisplay,
    debugConversionState
  }
}