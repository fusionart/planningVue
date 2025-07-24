<!-- src/components/layout/AppSidebar.vue -->
<template>
  <aside class="app-sidebar">
    <nav class="sidebar-nav">
      <ul class="nav-menu">
        <li 
          v-for="item in menuItems" 
          :key="item.id"
          class="nav-item"
          :class="{ active: $route.name === item.id }"
        >
          <router-link :to="item.route" class="nav-link">
            <span class="nav-icon" v-if="item.icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { MenuItem } from '@/types'

const menuItems = ref<MenuItem[]>([
  { id: 'Dashboard', label: 'Dashboard', icon: '📊', route: '/' },
  { id: 'SalesOrders', label: 'Sales Orders', icon: '📋', route: '/sales-orders' },
  { id: 'Users', label: 'Users', icon: '👥', route: '/users' },
  { id: 'Products', label: 'Products', icon: '📦', route: '/products' },
  { id: 'Settings', label: 'Settings', icon: '⚙️', route: '/settings' }
])
</script>

<style scoped>
@import '@/styles/components/sidebar.css';
</style>