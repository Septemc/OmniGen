import { defineStore } from "pinia";
import { ref } from "vue";
import * as repo from "@/db/repo";
import type { RunHistory } from "@/core/types";

export const useHistoryStore = defineStore("history", () => {
  const history = ref<RunHistory[]>([]);
  const loading = ref(false);

  async function loadHistory(): Promise<void> {
    try {
      loading.value = true;
      history.value = await repo.getAllHistory();
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      loading.value = false;
    }
  }

  async function deleteHistory(id: string): Promise<void> {
    try {
      await repo.deleteHistory(id);
      history.value = history.value.filter((h) => h.id !== id);
    } catch (error) {
      console.error("Failed to delete history:", error);
    }
  }

  return {
    history,
    loading,
    loadHistory,
    deleteHistory,
  };
});
