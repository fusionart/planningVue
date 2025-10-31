<!-- WorkCentersTable.vue -->
<template>
  <div class="section">
    <div class="section-header">Work Centers</div>
    
    <div class="content-wrapper">
      <!-- Left data columns -->
      <div class="data-columns">
        <div class="header-row">
          <div class="col-workctr">Work ctr</div>
          <div class="col-cap">Cap.ca</div>
          <div class="col-desc">Wk.cntr.description</div>
          <div class="col-capdesc">Cap.description</div>
          <div class="col-num">Num.ind.cap.</div>
        </div>
        
        <div 
          v-for="wc in workCenters" 
          :key="wc.id"
          class="data-row"
        >
          <div class="col-workctr link" @click="onWorkCenterClick(wc.id)">
            {{ wc.id }}
          </div>
          <div class="col-cap center">{{ wc.capacityCategory }}</div>
          <div class="col-desc">{{ wc.description }}</div>
          <div class="col-capdesc">{{ wc.capacityDescription }}</div>
          <div class="col-num center">{{ wc.numIndividualCapacity }}</div>
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

    <div class="nav-buttons">
      <button class="nav-btn" @click="$emit('navigate-prev')">&lt;</button>
      <button class="nav-btn" @click="$emit('navigate-next')">&gt;</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue';
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
  startDay: number;
  startHour: number;
  durationHours: number;
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
  }
});

const emit = defineEmits(['navigate-prev', 'navigate-next', 'work-center-click', 'timeline-scroll']);

const handleTimelineScroll = (scrollLeft: number) => {
  emit('timeline-scroll', scrollLeft);
};

const days = computed(() => {
  return [...new Set(props.timeline.map(t => t.day))];
});

const getTimelinePosition = (startDay: number, startHour: number): number => {
  const dayIndex = days.value.indexOf(startDay.toString().padStart(2, '0'));
  if (dayIndex === -1) return 0;
  return dayIndex * 24 + startHour;
};

const timelineRows = computed(() => {
  return props.workCenters.map(wc => {
    const allocations = props.capacityAllocations.filter(
      alloc => alloc.workCenterId === wc.id
    );
    
    const capacityBars = allocations.map((alloc, idx) => {
      const position = getTimelinePosition(alloc.startDay, alloc.startHour);
      return {
        key: `${wc.id}-${idx}`,
        style: {
          left: `${position * 20}px`,
          width: `${alloc.durationHours * 20}px`
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

.col-workctr {
  width: 96px;
  padding: 4px 8px;
  border-right: 1px solid #999;
}

.col-cap {
  width: 64px;
  padding: 4px 8px;
  border-right: 1px solid #999;
}

.col-desc {
  width: 160px;
  padding: 4px 8px;
  border-right: 1px solid #999;
}

.col-capdesc {
  width: 128px;
  padding: 4px 8px;
  border-right: 1px solid #999;
}

.col-num {
  width: 96px;
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