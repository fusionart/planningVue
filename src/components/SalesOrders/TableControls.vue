<!-- TableControls.vue -->
<template>
  <div class="table-controls">
    <div class="controls-left">
      <!-- Plant Filter -->
      <div class="plant-filter-container">
        <label class="plant-filter-label">
          Филтър по завод:
        </label>
        <select
          :value="selectedPlant"
          @change="updatePlant"
          class="plant-filter-select"
        >
          <option value="All">Всички заводи</option>
          <option 
            v-for="plant in plants" 
            :key="plant" 
            :value="plant"
          >
            {{ plant }}
          </option>
        </select>
      </div>
    </div>

    <div class="controls-right">
      <div class="search-container">
        <label class="search-label">
          Търсене: 
        </label>
        <input
          type="text"
          :value="searchValue"
          @input="updateSearch"
          placeholder="Търсене в настоящата седмица ..."
          class="search-input"
        />
      </div>
      
      <div class="page-size-container">
        <label class="page-size-label">
          Покажи 
        </label>
        <select
          :value="rowsPerPage"
          @change="updateRowsPerPage"
          class="page-size-select"
        >
          <option :value="10">10</option>
          <option :value="15">15</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span class="page-size-suffix">записа</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props
interface Props {
  plants: string[]
  selectedPlant: string
  searchValue: string
  rowsPerPage: number
}

const props = defineProps<Props>()

// Events
interface Emits {
  'update:selectedPlant': [plant: string]
  'update:searchValue': [search: string]
  'update:rowsPerPage': [rows: number]
}

const emit = defineEmits<Emits>()

// Methods
const updatePlant = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:selectedPlant', target.value)
}

const updateSearch = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:searchValue', target.value)
}

const updateRowsPerPage = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:rowsPerPage', Number(target.value))
}
</script>

<style scoped>
@import '@/styles/components/SalesOrders/TableControls.css';
</style>