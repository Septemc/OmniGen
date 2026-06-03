import { defineStore } from "pinia";
import { ref, computed } from "vue";
import * as repo from "@/db/repo";
import type { AppSettings } from "@/core/types";

export const useSettingsStore = defineStore("settings", () => {
  const settings = ref<AppSettings>({
    defaultChannelId: undefined,
    outputConfig: {
      outputDir: "",
      namingTemplate: "{date}_{time}_{channel}_{model}_{prompt20}",
      timestampFormat: "YYYYMMDD_HHmmss",
      promptSubstrLen: 20,
      overwrite: "rename",
    },
  });

  const channelApiKeys = ref<Map<string, string>>(new Map());
  const loading = ref(false);

  const outputPath = computed(() => "output/");

  async function loadSettings(): Promise<void> {
    try {
      loading.value = true;
      const savedSettings = await repo.getSettings("appSettings");
      if (savedSettings) {
        settings.value = { ...settings.value, ...savedSettings };
      }
      channelApiKeys.value = await repo.getAllChannelApiKeys();
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      loading.value = false;
    }
  }

  async function saveSettings(): Promise<void> {
    try {
      await repo.saveSettings("appSettings", settings.value);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }

  async function saveChannelApiKey(channelId: string, apiKey: string): Promise<void> {
    try {
      await repo.saveChannelApiKey(channelId, apiKey);
      channelApiKeys.value.set(channelId, apiKey);
    } catch (error) {
      console.error("Failed to save API key:", error);
    }
  }

  function getChannelApiKey(channelId: string): string | undefined {
    return channelApiKeys.value.get(channelId);
  }

  return {
    settings,
    channelApiKeys,
    loading,
    outputPath,
    loadSettings,
    saveSettings,
    saveChannelApiKey,
    getChannelApiKey,
  };
});
