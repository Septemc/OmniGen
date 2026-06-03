<template>
  <div id="app">
    <div class="app-shell">
      <header class="app-header">
        <div class="header-left">
          <h1 class="app-title">
            <span class="logo">🎨</span>
            OmniGen
          </h1>
        </div>
        <nav class="header-nav">
          <router-link to="/" class="nav-link">工作台</router-link>
          <router-link to="/channels" class="nav-link">渠道</router-link>
          <router-link to="/history" class="nav-link">历史</router-link>
          <router-link to="/settings" class="nav-link">设置</router-link>
        </nav>
      </header>

      <main class="app-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useChannelStore } from "@/stores/channelStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useHistoryStore } from "@/stores/historyStore";

const channelStore = useChannelStore();
const settingsStore = useSettingsStore();
const historyStore = useHistoryStore();

onMounted(async () => {
  await Promise.all([
    channelStore.loadChannels(),
    settingsStore.loadSettings(),
    historyStore.loadHistory(),
  ]);
});
</script>

<style>
* {
  box-sizing: border-box;
}

html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 16px;
  color: #1f2937;
  background: #f3f4f6;
}

.app-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  font-size: 24px;
}

.header-nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  padding: 8px 16px;
  border-radius: 8px;
  text-decoration: none;
  color: #4b5563;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-link:hover {
  background: #f3f4f6;
  color: #111827;
}

.nav-link.router-link-active {
  background: #eff6ff;
  color: #2563eb;
}

.app-main {
  flex: 1;
  overflow: hidden;
}
</style>
