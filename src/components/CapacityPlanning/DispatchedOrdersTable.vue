<!-- DispatchedOrdersTable.vue -->
<template>
  <div class="section">
    <div class="section-header">Поръчки (планирани)</div>
    
    <div class="content-wrapper">
      <!-- Left data columns -->
      <div class="data-columns" ref="dataColumnsRef" :style="{ width: dataColumnsWidth + 'px' }">
        <!-- Empty row to match timeline date range row -->
        <div class="spacer-row date-range-spacer"></div>
        
        <!-- Empty row to match timeline date header row -->
        <div class="spacer-row date-header-spacer"></div>
        
        <!-- Main header row (matches timeline hour header) -->
        <div class="header-row">
          <div class="col-date">Начална дата</div>
          <div class="col-material">Материал</div>
          <div class="col-matdesc">Описание</div>
          <div class="col-order">Поръчка</div>
          <div class="col-workctr2">Работен център</div>
          <div class="col-quantity">Количество</div>
        </div>
        
        <div 
          v-for="order in orders"
          :key="order.orderNo"
          class="data-row"
        >
          <div class="col-date">{{ order.startDate }}</div>
          <div class="col-material link" @click="onMaterialClick(order.material)">
            {{ order.material }}
          </div>
          <div class="col-matdesc">{{ order.materialDescription }}</div>
          <div 
            class="col-order link" 
            :class="{ 
              'order-planned': order.type === 'planned',
              'order-production': order.type === 'production'
            }"
            @click="onOrderClick(order.orderNo)"
          >
            {{ order.orderNo }}
          </div>
          <div class="col-workctr2 link" @click="onWorkCenterClick(order.workCenter)">
            {{ order.workCenter }}
          </div>
          <div class="col-quantity">{{ formatQuantity(order.quantity) }}</div>
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

interface DispatchedOrder {
  orderNo: string;
  material: string;
  materialDescription: string;
  startDate: string;
  workCenter: string;
  startDateTime: string;
  endDateTime: string;
  durationMinutes: number;
  startPosition: number;  // Position in pixels
  label: string;
  type: 'production' | 'planned';
  quantity: number;
}

interface TimelineSlot {
  day: string;
  hour: string;
  key: string;
}

const props = defineProps({
  orders: {
    type: Array as PropType<DispatchedOrder[]>,
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
  'order-click', 
  'material-click', 
  'work-center-click',
  'timeline-scroll',
  'resize-width'
]);

const dataColumnsRef = ref<HTMLElement | null>(null);

// Watch for width changes and log them
watch(() => props.dataColumnsWidth, (newWidth) => {
  console.log('DispatchedOrdersTable width updated:', newWidth);
});

const handleTimelineScroll = (scrollLeft: number) => {
  emit('timeline-scroll', scrollLeft);
};

// NEW: Using pixel-based positioning from parent
const timelineRows = computed(() => {
  const pixelsPerMinute = 40 / 60; // 40px per hour = 0.666px per minute
  
  return props.orders.map(order => {
    return {
      id: order.orderNo,
      capacityBars: [{
        key: order.orderNo,
        style: {
          left: `${order.startPosition}px`,
          width: `${order.durationMinutes * pixelsPerMinute}px`
        },
        title: `${order.materialDescription} (${formatDuration(order.durationMinutes)})`,
        label: order.label
      }]
    };
  });
});

// Helper to format duration for display
const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
};

const formatQuantity = (quantity: number): string => {
  if (quantity === null || quantity === undefined) return '0';
  return quantity.toLocaleString('bg-BG');
};

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

const onOrderClick = (orderNo: string) => {
  emit('order-click', orderNo);
};

const onMaterialClick = (material: string) => {
  emit('material-click', material);
};

const onWorkCenterClick = (workCenter: string) => {
  emit('work-center-click', 'timeline-scroll', workCenter);
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

.col-date {
  width: 96px;
  padding: 0 8px;
  border-right: 1px solid #999;
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.col-material {
  width: 128px;
  padding: 0 8px;
  border-right: 1px solid #999;
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.col-matdesc {
  flex: 1;
  min-width: 150px;
  padding: 0 8px;
  border-right: 1px solid #999;
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-order {
  width: 96px;
  padding: 0 8px;
  border-right: 1px solid #999;
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.col-workctr2 {
  width: 96px;
  padding: 0 8px;
  border-right: 1px solid #999;
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.col-quantity {
  width: 80px;
  padding: 0 8px;
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
  text-align: right;
}

.link {
  color: #0066cc;
  text-decoration: underline;
  cursor: pointer;
}

.order-planned {
  color: #22c55e !important;
  font-weight: 600;
}

.order-production {
  color: #0066cc !important;
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