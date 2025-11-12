<!-- PoolOrdersTable.vue -->
<template>
  <div class="section pool-section">
    <div class="section-header">Поръчки (не планирани)</div>
    
    <div class="content-wrapper">
      <!-- Left data columns - USING INLINE STYLE BINDING -->
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
          :class="{ 'highlighted': order.highlighted }"
          @contextmenu.prevent="handleContextMenu($event, order)"
        >
          <div class="col-date" :class="{ 'highlight-text': order.highlighted }">
            {{ order.startDate }}
          </div>
          <div class="col-material link" :class="{ 'highlight-text': order.highlighted }" 
               @click="onMaterialClick(order.material)">
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

      <!-- Reusable Timeline (empty for pool orders) -->
      <TimelineGrid 
        :current-date="currentDate"
        :timeline="timeline"
        :rows="timelineRows"
        :scroll-left="scrollLeft"
        @scroll="handleTimelineScroll"
      />
    </div>

    <!-- Context Menu -->
    <PoolOrderContextMenu
      :visible="contextMenuVisible"
      :x="contextMenuX"
      :y="contextMenuY"
      :order="selectedOrder"
      @plan-order="handlePlanOrder"
      @close="closeContextMenu"
    />

    <!-- Plan Order Dialog -->
    <PlanOrderDialog
      v-model:visible="planOrderDialogVisible"
      :order="selectedOrder"
      :plant="plant"
      @success="handlePlanOrderSuccess"
      @cancel="closePlanOrderDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, PropType, watch, onMounted, onUnmounted } from 'vue';
import TimelineGrid from './TimelineGrid.vue';
import PoolOrderContextMenu from './PoolOrderContextMenu.vue';
import PlanOrderDialog from './PlanOrderDialog.vue';

interface PoolOrder {
  orderNo: string;
  material: string;
  materialDescription: string;
  startDate: string;
  workCenter: string;
  operations: number;
  highlighted: boolean;
  type: 'production' | 'planned';
  quantity: number;
  productionVersion: string; // ✅ Changed from optional to required (both order types now have it)
}

interface TimelineSlot {
  day: string;
  hour: string;
  key: string;
}

const props = defineProps({
  orders: {
    type: Array as PropType<PoolOrder[]>,
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
  },
  plant: {
    type: String,
    default: ''
  }
});

const emit = defineEmits([
  'navigate-prev', 
  'navigate-next', 
  'order-click', 
  'material-click', 
  'work-center-click',
  'timeline-scroll',
  'resize-width',
  'refresh' // NEW: Add refresh event
]);

const dataColumnsRef = ref<HTMLElement | null>(null);

// Context Menu state
const contextMenuVisible = ref(false);
const contextMenuX = ref<number | null>(null);
const contextMenuY = ref<number | null>(null);
const selectedOrder = ref<PoolOrder | null>(null);

// Plan Order Dialog state
const planOrderDialogVisible = ref(false);

// Watch for width changes and log them
watch(() => props.dataColumnsWidth, (newWidth) => {
  console.log('PoolOrdersTable width updated:', newWidth);
});

const handleTimelineScroll = (scrollLeft: number) => {
  emit('timeline-scroll', scrollLeft);
};

// Pool orders have no capacity bars (not scheduled yet)
const timelineRows = computed(() => {
  return props.orders.map(order => ({
    id: order.orderNo,
    capacityBars: []
  }));
});

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
  emit('work-center-click', workCenter);
};

// Context Menu handlers
const handleContextMenu = (event: MouseEvent, order: PoolOrder) => {
  event.preventDefault();
  event.stopPropagation();
  
  selectedOrder.value = order;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
};

const closeContextMenu = () => {
  contextMenuVisible.value = false;
  // Don't clear selectedOrder immediately to allow for animation
  setTimeout(() => {
    contextMenuX.value = null;
    contextMenuY.value = null;
  }, 200);
};

const handlePlanOrder = (order: PoolOrder) => {
  selectedOrder.value = order;
  planOrderDialogVisible.value = true;
};

const closePlanOrderDialog = () => {
  planOrderDialogVisible.value = false;
};

const handlePlanOrderSuccess = () => {
  planOrderDialogVisible.value = false;
  // Emit refresh event to parent to reload data
  emit('refresh');
};

// Close context menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (contextMenuVisible.value) {
    closeContextMenu();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('contextmenu', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('contextmenu', handleClickOutside);
});
</script>

<style scoped>
.section {
  border-bottom: 2px solid black;
}

.pool-section {
  flex: 1;
  overflow: auto;
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
  cursor: context-menu;
}

.data-row:hover {
  background: #e3f2fd;
}

.data-row.highlighted {
  background: #c8e6c9;
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
  min-width: 120px;
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

.center {
  text-align: center;
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

.highlight-text {
  color: #2e7d32;
  font-weight: bold;
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