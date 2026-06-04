<template>
  <div id="app">
    <div class="app-shell">
      <header class="app-header">
        <div class="header-left">
          <button
            class="hamburger-btn"
            @click="menuOpen = !menuOpen"
            aria-label="菜单"
          >
            {{ menuOpen ? '✕' : '☰' }}
          </button>
          <h1 class="app-title">
            <span class="logo">🎨</span>
            OmniGen
          </h1>
        </div>
        <nav class="header-nav">
          <router-link to="/" class="nav-link" @click="menuOpen = false">工作台</router-link>
          <router-link to="/channels" class="nav-link" @click="menuOpen = false">渠道</router-link>
          <router-link to="/history" class="nav-link" @click="menuOpen = false">历史</router-link>
          <router-link to="/prompts" class="nav-link" @click="menuOpen = false">提示词</router-link>
          <router-link to="/settings" class="nav-link" @click="menuOpen = false">设置</router-link>
        </nav>
      </header>

      <div v-if="menuOpen" class="menu-overlay" @click="menuOpen = false">
        <nav class="mobile-menu" @click.stop>
          <router-link to="/" class="mobile-nav-link" @click="menuOpen = false">工作台</router-link>
          <router-link to="/channels" class="mobile-nav-link" @click="menuOpen = false">渠道</router-link>
          <router-link to="/history" class="mobile-nav-link" @click="menuOpen = false">历史</router-link>
          <router-link to="/prompts" class="mobile-nav-link" @click="menuOpen = false">提示词</router-link>
          <router-link to="/settings" class="mobile-nav-link" @click="menuOpen = false">设置</router-link>
        </nav>
      </div>

      <main class="app-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useChannelStore } from "@/stores/channelStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useHistoryStore } from "@/stores/historyStore";

const channelStore = useChannelStore();
const settingsStore = useSettingsStore();
const historyStore = useHistoryStore();

const menuOpen = ref(false);

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
  padding-left: env(safe-area-inset-left, 12px);
  padding-right: env(safe-area-inset-right, 12px);
}

.hamburger-btn {
  display: none;
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  font-size: 22px;
  cursor: pointer;
  color: #4b5563;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.hamburger-btn:hover {
  background: #f3f4f6;
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

.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 100;
  padding: 8px;
  padding-top: env(safe-area-inset-top, 8px);
}

.mobile-menu {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.mobile-nav-link {
  padding: 14px 20px;
  text-decoration: none;
  color: #1f2937;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  transition: background 0.2s;
}

.mobile-nav-link:hover,
.mobile-nav-link.router-link-active {
  background: #eff6ff;
  color: #2563eb;
}

@media (max-width: 767px) {
  .app-header {
    padding: 10px 16px;
  }

  .hamburger-btn {
    display: flex;
  }

  .header-nav {
    display: none;
  }
}
</style>
