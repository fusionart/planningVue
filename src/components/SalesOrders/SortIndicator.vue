<!-- SortIndicator.vue -->
<template>
  <span class="sort-indicator">
    <span v-if="isActive" class="sort-arrow">
      {{ direction === 'asc' ? '↑' : '↓' }}
    </span>
    <span v-else class="sort-arrows">↕</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  column: string
  direction: 'asc' | 'desc'
  current: string
}

const props = defineProps<Props>()

const isActive = computed(() => props.column === props.current)
</script>

<style scoped>
.sort-indicator {
  display: inline-block;
  margin-left: 4px;
  font-size: 10px;
  opacity: 0.7;
}

.sort-active .sort-indicator {
  opacity: 1;
  color: var(--color-primary, #3b82f6) !important;
}

.sort-arrow {
  font-weight: bold;
}

.sort-arrows {
  opacity: 0.5;
}
</style>