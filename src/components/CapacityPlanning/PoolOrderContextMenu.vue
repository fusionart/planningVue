<!-- PoolOrderContextMenu.vue -->
<template>
  <div 
    v-if="visible && x !== null && y !== null"
    class="context-menu"
    :style="{ left: x + 'px', top: y + 'px' }"
    @click.stop
  >
    <div 
      class="context-menu-item"
      :class="{ 'context-menu-item-disabled': !isPlannedOrder }"
      @click="handlePlanOrder"
    >
      <span class="context-menu-icon">📅</span>
      <span class="context-menu-text">Планирай</span>
      <span v-if="!isPlannedOrder" class="context-menu-hint">
        (Само за планови поръчки)
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible: boolean
  x: number | null
  y: number | null
  order: any | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'plan-order': [order: any]
  'close': []
}>()

const isPlannedOrder = computed(() => {
  return props.order?.type === 'planned'
})

const handlePlanOrder = () => {
  if (!isPlannedOrder.value) {
    return
  }
  emit('plan-order', props.order)
  emit('close')
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 0.25rem;
  min-width: 200px;
  z-index: 10000;
  animation: contextMenuFadeIn 0.15s ease-out;
}

@keyframes contextMenuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
  font-size: 0.9rem;
  color: #374151;
}

.context-menu-item:hover:not(.context-menu-item-disabled) {
  background: #f3f4f6;
  color: #10b981;
}

.context-menu-item-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.context-menu-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.context-menu-text {
  font-weight: 500;
  flex: 1;
}

.context-menu-hint {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
}
</style>