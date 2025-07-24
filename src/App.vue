<template>
  <div id="app">
    <div class="header">
      <h1>My Deno Vue App</h1>
      <nav>
        <router-link to="/">Dashboard</router-link>
        <router-link to="/users">Users</router-link>
      </nav>
    </div>
    <main>
      <router-view />
    </main>
  </div>
</template>

<style>
#app {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}

.header {
  background: #3b82f6;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header nav a {
  color: white;
  text-decoration: none;
  margin: 0 1rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

.header nav a:hover {
  background: rgba(255,255,255,0.2);
}

main {
  padding: 2rem;
}
</style>