<!-- PoolOrdersTable.vue -->
<template>
  <div class="section pool-section">
    <div class="section-header">Orders (pool)</div>
    
    <div class="content-wrapper">
      <!-- Left data columns -->
      <div class="data-columns">
        <div class="header-row">
          <div class="col-date">LStrtDate</div>
          <div class="col-material">Material</div>
          <div class="col-matdesc">Material Description</div>
          <div class="col-order">Order</div>
          <div class="col-workctr2">Work ctr</div>
          <div class="col-oper">Operati</div>
        </div>
        
        <div 
          v-for="order in orders"
          :key="order.orderNo"
          class="data-row"
          :class="{ 'highlighted': order.highlighted }"
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
          <div class="col-oper center">{{ order.operations }}</div>
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

    <div class="nav-buttons">
      <button class="nav-btn" @click="$emit('navigate-prev')">&lt;</button>
      <button class="nav-btn" @click="$emit('navigate-next')">&gt;</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue';
import TimelineGrid from './TimelineGrid.vue';

interface PoolOrder {
  orderNo: string;
  material: string;
  materialDescription: string;
  startDate: string;
  workCenter: string;
  operations: number;
  highlighted: boolean;
  type: 'production' | 'planned';
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
  }
});

const emit = defineEmits([
  'navigate-prev', 
  'navigate-next', 
  'order-click', 
  'material-click', 
  'work-center-click',
  'timeline-scroll'
]);

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
}

.data-columns {
  flex-shrink: 0;
  border-right: 1px solid black;
  background: #e0e0e0;
}

.header-row {
  display: flex;
  border-bottom: 1px solid black;
  background: #e0e0e0;
  font-weight: bold;
}

.data-row {
  display: flex;
  border-bottom: 1px solid #999;
  background: #e0e0e0;
}

.data-row:hover {
  background: #e3f2fd;
}

.data-row.highlighted {
  background: #c8e6c9;
}

.col-date {
  width: 96px;
  padding: 4px 8px;
  border-right: 1px solid #999;
}

.col-material {
  width: 128px;
  padding: 4px 8px;
  border-right: 1px solid #999;
}

.col-matdesc {
  width: 224px;
  padding: 4px 8px;
  border-right: 1px solid #999;
}

.col-order {
  width: 96px;
  padding: 4px 8px;
  border-right: 1px solid #999;
}

.col-workctr2 {
  width: 96px;
  padding: 4px 8px;
  border-right: 1px solid #999;
}

.col-oper {
  width: 80px;
  padding: 4px 8px;
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