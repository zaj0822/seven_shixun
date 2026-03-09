<template>
  <div id="app">
    <header class="app-header">
      <h1>智能会议助手</h1>
      <nav class="app-nav">
        <router-link to="/" class="nav-link">首页</router-link>
        <router-link to="/recordings" class="nav-link">会议记录</router-link>
        <router-link to="/settings" class="nav-link">设置</router-link>
      </nav>
    </header>
    <main class="app-main">
      <router-view/>
    </main>
    <footer class="app-footer">
      <p>© 2026 智能会议助手</p>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: #42b983;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.app-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

.app-nav {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.3s;
}

.nav-link:hover {
  opacity: 0.8;
}

.app-main {
  flex: 1;
  padding: 2rem;
  background-color: #f5f5f5;
}

.app-footer {
  background-color: #333;
  color: white;
  text-align: center;
  padding: 1rem;
  margin-top: auto;
}
</style>
