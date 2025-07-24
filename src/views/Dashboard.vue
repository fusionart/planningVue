<template>
  <div class="dashboard">
    <h2 class="page-title">Dashboard</h2>
    <div class="dashboard-content">
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Users</h3>
          <p class="stat-number">1,234</p>
        </div>
        <div class="stat-card">
          <h3>Total Products</h3>
          <p class="stat-number">567</p>
        </div>
        <div class="stat-card">
          <h3>Revenue</h3>
          <p class="stat-number">$89,012</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Dashboard logic here
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  color: var(--text-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--background-card);
  padding: 20px;
  border-radius: 8px;
  box-shadow: var(--shadow-card);
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-primary);
  margin: 10px 0;
}
</style>