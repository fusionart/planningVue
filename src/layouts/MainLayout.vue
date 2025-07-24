<template>
  <div class="main-layout">
    <AppHeader />
    <div class="layout-body">
      <AppSidebar />
      <AppMain>
        <router-view />
      </AppMain>
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppMain from '@/components/layout/AppMain.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
</script>

<style scoped>
@import '@/styles/layouts/main-layout.css';
</style>