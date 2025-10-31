<!-- TimelineGrid.vue -->
<template>
  <div class="timeline-wrapper" ref="timelineRef" @scroll="handleScroll">
    <div class="timeline-content">
      <!-- Date range row -->
      <div class="date-row">{{ currentDate }}</div>
      
      <!-- Date headers (one per day) -->
      <div class="date-header">
        <div 
          v-for="(t, idx) in timeline" 
          :key="`date-${t.key}`"
          v-show="idx % 24 === 0"
          class="date-cell"
          :style="{ width: '480px' }"
        >
          {{ formatFullDate(t.fullDate) }}
        </div>
      </div>
      
      <!-- Hour headers -->
      <div class="timeline-header">
        <div 
          v-for="(t, idx) in timeline" 
          :key="t.key"
          class="hour-cell"
          :class="{ 'day-start': idx % 24 === 0 }"
        >
          {{ t.hour }}
        </div>
      </div>
      
      <!-- Timeline rows with capacity bars -->
      <div 
        v-for="(row, index) in rows"
        :key="`timeline-row-${index}`"
        class="timeline-row"
      >
        <div 
          v-for="t in timeline"
          :key="`cell-${index}-${t.key}`"
          class="timeline-cell"
          :class="{ 'day-start-cell': timeline.indexOf(t) % 24 === 0 }"
        ></div>
        
        <!-- Render capacity bars for this row -->
        <div 
          v-for="bar in row.capacityBars"
          :key="bar.key"
          class="capacity-bar"
          :style="bar.style"
          :title="bar.title"
        >
          {{ bar.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, PropType } from 'vue';

interface TimelineSlot {
  day: string;
  month?: string;
  hour: string;
  key: string;
  fullDate?: Date;
}

interface CapacityBar {
  key: string;
  style: Record<string, string>;
  title: string;
  label: string;
}

interface TimelineRow {
  id: string;
  capacityBars: CapacityBar[];
}

const props = defineProps({
  currentDate: {
    type: String,
    required: true
  },
  timeline: {
    type: Array as PropType<TimelineSlot[]>,
    required: true
  },
  rows: {
    type: Array as PropType<TimelineRow[]>,
    required: true
  },
  scrollLeft: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits<{
  scroll: [scrollLeft: number]
}>();

const timelineRef = ref<HTMLElement | null>(null);
const isScrolling = ref(false);

// Handle scroll event from this timeline
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!isScrolling.value) {
    emit('scroll', target.scrollLeft);
  }
};

// Watch for external scroll changes
watch(() => props.scrollLeft, (newScrollLeft) => {
  if (timelineRef.value && timelineRef.value.scrollLeft !== newScrollLeft) {
    isScrolling.value = true;
    timelineRef.value.scrollLeft = newScrollLeft;
    
    // Reset flag after a short delay
    setTimeout(() => {
      isScrolling.value = false;
    }, 50);
  }
});

// Format date as DD.MM.YYYY
const formatFullDate = (date?: Date): string => {
  if (!date) return '';
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}.${month}.${year}`;
};
</script>

<style scoped>
.timeline-wrapper {
  flex: 1;
  overflow-x: auto;
}

.timeline-content {
  min-width: max-content;
}

.date-row {
  padding: 4px 8px;
  text-align: center;
  font-size: 10px;
  background: white;
  border-bottom: 1px solid black;
  font-weight: bold;
}

.date-header {
  display: flex;
  background: #e3f2fd;
  border-bottom: 1px solid black;
}

.date-cell {
  padding: 6px 4px;
  text-align: center;
  font-size: 10px;
  font-weight: bold;
  border-right: 2px solid black;
  background: #e3f2fd;
  color: #1565c0;
}

.timeline-header {
  display: flex;
  border-bottom: 1px solid black;
  background: #ffeb3b;
}

.hour-cell {
  width: 20px;
  padding: 4px 2px;
  border-right: 1px solid black;
  text-align: center;
  font-size: 9px;
  font-weight: bold;
}

.hour-cell.day-start {
  background: #ffd700;
  border-left: 2px solid black;
}

.timeline-row {
  display: flex;
  border-bottom: 1px solid #999;
  position: relative;
  height: 20px;
}

.timeline-cell {
  width: 20px;
  border-right: 1px dotted #999;
}

.timeline-cell.day-start-cell {
  border-left: 2px solid black;
}

.capacity-bar {
  position: absolute;
  height: 100%;
  background: #d32f2f;
  color: white;
  font-size: 9px;
  padding: 0 4px;
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  align-items: center;
  border-right: 1px solid white;
  box-sizing: border-box;
}
</style>