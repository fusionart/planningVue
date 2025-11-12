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
      @click="handlePlanOrder"
    >
      <span class="context-menu-icon">📅</span>
      <span class="context-menu-text">
        {{ isPlannedOrder ? 'Планирай' : 'Планирай' }}
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

.context-menu-item:hover {
  background: #f3f4f6;
  color: #10b981;
}

.context-menu-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.context-menu-text {
  font-weight: 500;
  flex: 1;
}
</style>