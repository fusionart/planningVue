<!-- TablePagination.vue -->
<template>
  <div class="pagination-controls">
    <div class="pagination-info">
      Показване {{ startRecord }} до {{ endRecord }} от {{ totalRecords }} записа
      <span v-if="globalFilter">(филтрирани от {{ totalDataLength }} записа)</span>
    </div>
    <div class="pagination-buttons">
      <button 
        class="btn btn-secondary pagination-btn"
        :disabled="currentPage === 1"
        @click="$emit('page-change', 1)"
      >
        Първа
      </button>
      <button 
        class="btn btn-secondary pagination-btn"
        :disabled="currentPage === 1"
        @click="$emit('page-change', currentPage - 1)"
      >
        Предишна
      </button>
      <span class="page-numbers">
        Страница {{ currentPage }} от {{ totalPages }}
      </span>
      <button 
        class="btn btn-secondary pagination-btn"
        :disabled="currentPage === totalPages"
        @click="$emit('page-change', currentPage + 1)"
      >
        Следваща
      </button>
      <button 
        class="btn btn-secondary pagination-btn"
        :disabled="currentPage === totalPages"
        @click="$emit('page-change', totalPages)"
      >
        Последна
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  currentPage: number
  totalPages: number
  totalRecords: number
  startRecord: number
  endRecord: number
  globalFilter: string
  totalDataLength: number
}

defineProps<Props>()

interface Emits {
  'page-change': [page: number]
}

defineEmits<Emits>()
</script>

<style scoped>
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.pagination-info {
  color: #6b7280;
  font-size: 0.875rem;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-btn {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
}

.page-numbers {
  margin: 0 1rem;
  font-weight: 500;
  color: #374151;
}

@media (max-width: 768px) {
  .pagination-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .pagination-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>