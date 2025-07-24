import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// Simple router setup
const routes = [
  { path: '/', component: () => import('./views/Dashboard.vue') },
  { path: '/users', component: () => import('./views/Users.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App).use(router).mount('#app')