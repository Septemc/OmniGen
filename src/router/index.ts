import { createRouter, createWebHashHistory } from "vue-router";
import StudioPage from "@/pages/StudioPage.vue";
import ChannelsPage from "@/pages/ChannelsPage.vue";
import HistoryPage from "@/pages/HistoryPage.vue";
import SettingsPage from "@/pages/SettingsPage.vue";

const routes = [
  { path: "/", name: "Studio", component: StudioPage },
  { path: "/channels", name: "Channels", component: ChannelsPage },
  { path: "/history", name: "History", component: HistoryPage },
  { path: "/settings", name: "Settings", component: SettingsPage },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
