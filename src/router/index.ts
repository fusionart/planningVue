// src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import Dashboard from '@/views/Dashboard.vue'
import Users from '@/views/Users.vue'
import Products from '@/views/Products.vue'
import SalesOrders from '@/views/SalesOrders.vue'
import Settings from '@/views/Settings.vue'
import CapacityPlanning from '@/views/CapacityPlanning.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: Dashboard
      },
      {
        path: '/users',
        name: 'Users',
        component: Users
      },
      {
        path: '/products',
        name: 'Products',
        component: Products
      },
      {
        path: '/sales-orders',
        name: 'SalesOrders',
        component: SalesOrders
      },
      {
        path: '/capacity-planning',
        name: 'CapacityPlanning',
        component: CapacityPlanning
      },
      {
        path: '/settings',
        name: 'Settings',
        component: Settings
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router