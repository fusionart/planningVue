<!-- DispatchedOrdersTable.vue -->
<template>
  <div class="section">
    <div class="section-header">Orders (dispatched)</div>
    
    <div class="content-wrapper">
      <!-- Left data columns -->
      <div class="data-columns">
        <div class="header-row">
          <div class="col-date">LStrtDate</div>
          <div class="col-material">Material</div>
          <div class="col-matdesc">Material Description</div>
          <div class="col-order">Order</div>
          <div class="col-workctr2">Workctr</div>
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
          <div class="col-order link" @click="onOrderClick(order.orderNo)">
            {{ order.orderNo }}
          </div>
          <div class="col-workctr2 link" @click="onWorkCenterClick(order.workCenter)">
            {{ order.workCenter }}
          </div>
        </div>
      </div>

      <!-- Reusable Timeline -->
      <TimelineGrid 
        :current-date="currentDate"
        :timeline="timeline"
        :rows="timelineRows"
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

interface DispatchedOrder {
  orderNo: string;
  material: string;
  materialDescription: string;
  startDate: string;
  workCenter: string;
  startDay: number;
  startHour: number;
  durationHours: number;
  label: string;
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
  }
});

const emit = defineEmits([
  'navigate-prev', 
  'navigate-next', 
  'order-click', 
  'material-click', 
  'work-center-click'
]);

const days = computed(() => {
  return [...new Set(props.timeline.map(t => t.day))];
});

const getTimelinePosition = (startDay: number, startHour: number): number => {
  const dayIndex = days.value.indexOf(startDay.toString().padStart(2, '0'));
  if (dayIndex === -1) return 0;
  return dayIndex * 24 + startHour;
};

const timelineRows = computed(() => {
  return props.orders.map(order => {
    const position = getTimelinePosition(order.startDay, order.startHour);
    
    return {
      id: order.orderNo,
      capacityBars: [{
        key: order.orderNo,
        style: {
          left: `${position * 20}px`,
          width: `${order.durationHours * 20}px`
        },
        title: order.materialDescription,
        label: order.label
      }]
    };
  });
});

const onOrderClick = (orderNo: string) => {
  emit('order-click', orderNo);
};

const onMaterialClick = (material: string) => {
  emit('material-click', material);
};

const onWorkCenterClick = (workCenter: string) => {
  emit('work-center-click', workCenter);
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