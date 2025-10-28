<!-- TimelineGrid.vue -->
<template>
  <div class="timeline-wrapper" ref="timelineRef">
    <div class="timeline-content">
      <!-- Date row -->
      <div class="date-row">{{ currentDate }}</div>
      
      <!-- Hour headers -->
      <div class="timeline-header">
        <div 
          v-for="(t, idx) in timeline" 
          :key="t.key"
          class="hour-cell"
        >
          {{ idx % 24 === 0 ? t.day : t.hour }}
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
import { ref, computed, PropType } from 'vue';

interface TimelineSlot {
  day: string;
  hour: string;
  key: string;
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
  }
});

const timelineRef = ref<HTMLElement | null>(null);
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
}
</style>