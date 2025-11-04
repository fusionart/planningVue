<!-- WorkCentersTable.vue -->
<template>
  <div class="section">
    <div class="section-header">Работни центрове</div>
    
    <div class="content-wrapper">
      <!-- Left data columns -->
      <div class="data-columns" ref="dataColumnsRef" :style="{ width: dataColumnsWidth + 'px' }">
        <!-- Empty row to match timeline date range row -->
        <div class="spacer-row date-range-spacer"></div>
        
        <!-- Empty row to match timeline date header row -->
        <div class="spacer-row date-header-spacer"></div>
        
        <!-- Main header row (matches timeline hour header) -->
        <div class="header-row">
          <div class="col-workctr">Работен център</div>
          <div class="col-desc">Описание</div>
        </div>
        
        <div 
          v-for="wc in workCenters" 
          :key="wc.id"
          class="data-row"
        >
          <div class="col-workctr link" @click="onWorkCenterClick(wc.id)">
            {{ wc.id }}
          </div>
          <div class="col-desc">{{ wc.description }}</div>
        </div>
        
        <!-- Resize handle -->
        <div 
          class="resize-handle"
          @mousedown="startResize"
          title="Drag to resize columns"
        >
          <div class="resize-handle-line"></div>
        </div>
      </div>

      <!-- Reusable Timeline -->
      <TimelineGrid 
        :current-date="currentDate"
        :timeline="timeline"
        :rows="timelineRows"
        :scroll-left="scrollLeft"
        @scroll="handleTimelineScroll"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, PropType, watch } from 'vue';
import TimelineGrid from './TimelineGrid.vue';

interface WorkCenter {
  id: string;
  capacityCategory: string;
  description: string;
  capacityDescription: string;
  numIndividualCapacity: number;
}

interface TimelineSlot {
  day: string;
  hour: string;
  key: string;
}

interface CapacityAllocation {
  workCenterId: string;
  startPosition: number;      // Position in pixels
  durationMinutes: number;
  widthPixels: number;         // Pre-calculated width
  label: string;
  description: string;
}

const props = defineProps({
  workCenters: {
    type: Array as PropType<WorkCenter[]>,
    required: true
  },
  currentDate: {
    type: String,
    required: true
  },
  timeline: {
    type: Array as PropType<TimelineSlot[]>,
    required: true
  },
  capacityAllocations: {
    type: Array as PropType<CapacityAllocation[]>,
    required: true
  },
  scrollLeft: {
    type: Number,
    default: 0
  },
  dataColumnsWidth: {
    type: Number,
    default: 640
  }
});

const emit = defineEmits([
  'navigate-prev', 
  'navigate-next', 
  'work-center-click', 
  'timeline-scroll',
  'resize-width'
]);

const dataColumnsRef = ref<HTMLElement | null>(null);

// Watch for width changes and log them
watch(() => props.dataColumnsWidth, (newWidth) => {
  console.log('WorkCentersTable width updated:', newWidth);
});

const handleTimelineScroll = (scrollLeft: number) => {
  emit('timeline-scroll', scrollLeft);
};

// NEW: Using pixel-based positioning from parent
const timelineRows = computed(() => {
  return props.workCenters.map(wc => {
    const allocations = props.capacityAllocations.filter(
      alloc => alloc.workCenterId === wc.id
    );
    
    const capacityBars = allocations.map((alloc, idx) => {
      return {
        key: `${wc.id}-${idx}`,
        style: {
          left: `${alloc.startPosition}px`,
          width: `${alloc.widthPixels}px`
        },
        title: alloc.description,
        label: alloc.label
      };
    });

    return {
      id: wc.id,
      capacityBars
    };
  });
});

const startResize = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  const startX = e.clientX;
  const startWidth = props.dataColumnsWidth;
  
  console.log('Start resize:', { startX, startWidth });
  
  const handleMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = moveEvent.clientX - startX;
    const newWidth = Math.max(300, Math.min(1200, startWidth + deltaX));
    emit('resize-width', newWidth);
  };
  
  const handleMouseUp = () => {
    console.log('Resize ended');
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };
  
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const onWorkCenterClick = (workCenterId: string) => {
  emit('work-center-click', workCenterId);
};
</script>

<style scoped>
.section {
  border-bottom: 2px solid black;
}

.section-header {
  background: white;
  border-bottom: 1px solid black;
  padding: 4px 8px;
  font-weight: bold;
  text-align: center;
}

.content-wrapper {
  display: flex;
  position: relative;
}

.data-columns {
  position: relative;
  flex-shrink: 0;
  border-right: 1px solid black;
  background: #e0e0e0;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: -6px;
  width: 12px;
  height: 100%;
  cursor: col-resize;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 0, 0, 0.1);
}

.resize-handle-line {
  width: 3px;
  height: 60px;
  background: #3b82f6;
  border-radius: 2px;
  pointer-events: none;
}

.resize-handle:hover {
  background: rgba(59, 130, 246, 0.2);
}

.resize-handle:hover .resize-handle-line {
  background: #2563eb;
  width: 4px;
}

.spacer-row {
  width: 100%;
  border-bottom: 1px solid black;
}

.date-range-spacer {
  height: 22px;
  min-height: 22px;
  background: white;
}

.date-header-spacer {
  height: 28px;
  min-height: 28px;
  background: #e3f2fd;
}

.header-row {
  display: flex;
  border-bottom: 1px solid black;
  background: #e0e0e0;
  font-weight: bold;
  height: 28px;
  min-height: 28px;
  align-items: center;
}

.data-row {
  display: flex;
  border-bottom: 1px solid #999;
  background: #e0e0e0;
  height: 24px;
  min-height: 24px;
  align-items: center;
}

.data-row:hover {
  background: #e3f2fd;
}

.col-workctr {
  width: 96px;
  padding: 0 8px;
  border-right: 1px solid #999;
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.col-desc {
  flex: 1;
  min-width: 100px;
  padding: 0 8px;
  border-right: 1px solid #999;
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.center {
  text-align: center;
}

.link {
  color: #0066cc;
  text-decoration: underline;
  cursor: pointer;
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  padding: 2px 8px;
  background: #f5f5f5;
  border-top: 1px solid black;
  font-size: 10px;
}

.nav-btn {
  color: #0066cc;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 4px;
}

.nav-btn:hover {
  text-decoration: underline;
}
</style>