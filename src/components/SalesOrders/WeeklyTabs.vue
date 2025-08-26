<!-- WeeklyTabs.vue -->
<template>
  <div class="table-container">
    <div class="table-header">
      <h3>Батерии за седмица {{ activeWeekData?.reqDlvWeek }} - {{ totalRecords }} записа</h3>
      <div class="table-info">
        <span class="data-range">
          Дати: {{ formatDateDisplay(dateFrom) }} - {{ formatDateDisplay(dateTo) }}
        </span>
      </div>
    </div>

    <!-- Delivery Week Tabs -->
    <div v-if="weekData.length > 0" class="delivery-week-tabs">
      <div class="tabs-navigation">
        <nav class="tabs-nav">
          <button
            v-for="(week, index) in weekData"
            :key="week.reqDlvWeek"
            @click="handleTabChange(week.reqDlvWeek, index)"
            :class="[
              'tab-button',
              activeWeek === week.reqDlvWeek ? 'tab-active' : 'tab-inactive'
            ]"
          >
            <div class="tab-content">
              <span class="tab-label">{{ week.reqDlvWeek }}</span>
              <span class="tab-count">
                {{ week.salesOrderMainList.length }} записа
              </span>
            </div>
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SalesOrderByDate } from '@/types/api'

// Props
interface Props {
  weekData: SalesOrderByDate[]
  activeWeek: string
  dateFrom: Date | null
  dateTo: Date | null
}

const props = defineProps<Props>()

// Events
interface Emits {
  'tab-change': [weekName: string, index: number]
}

const emit = defineEmits<Emits>()

// Computed
const activeWeekData = computed(() => {
  return props.weekData.find(week => week.reqDlvWeek === props.activeWeek) || props.weekData[0] || null
})

const totalRecords = computed(() => {
  return activeWeekData.value?.salesOrderMainList.length || 0
})

// Methods
const handleTabChange = (weekName: string, index: number) => {
  emit('tab-change', weekName, index)
}

const formatDateDisplay = (date: Date | null) => {
  if (!date) return ''
  try {
    return date.toLocaleDateString('bg-BG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return date.toString()
  }
}
</script>

<style scoped>
@import '@/styles/components/SalesOrders/WeeklyTabs.css';
</style>