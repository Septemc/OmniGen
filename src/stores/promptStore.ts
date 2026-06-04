import { defineStore } from "pinia";
import { ref, computed } from "vue";
import * as api from "@/api/promptsApi";
import type { PromptMeta, PromptDetail } from "@/api/promptsApi";

export const usePromptStore = defineStore("prompts", () => {
  const isAuthenticated = ref(api.hasToken());
  const prompts = ref<PromptMeta[]>([]);
  const currentPrompt = ref<PromptDetail | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const sortedPrompts = computed(() => {
    return [...prompts.value].sort(
      (a, b) =>
        new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
    );
  });

  async function login(password: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.verifyPassword(password);
      api.setToken(res.token);
      isAuthenticated.value = true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "登录失败";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function logout(): void {
    api.clearToken();
    isAuthenticated.value = false;
    prompts.value = [];
    currentPrompt.value = null;
  }

  async function loadList(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      prompts.value = await api.fetchPromptList();
    } catch (e) {
      error.value = e instanceof Error ? e.message : "加载列表失败";
      if (
        e instanceof Error &&
        (e.message.includes("401") || e.message.includes("未授权"))
      ) {
        logout();
      }
    } finally {
      loading.value = false;
    }
  }

  async function loadPrompt(filename: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      currentPrompt.value = await api.fetchPrompt(filename);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "加载提示词失败";
    } finally {
      loading.value = false;
    }
  }

  async function savePrompt(
    filename: string,
    content: string
  ): Promise<PromptDetail> {
    loading.value = true;
    error.value = null;
    try {
      const saved = await api.savePrompt(filename, content);
      currentPrompt.value = saved;
      await loadList();
      return saved;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "保存失败";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function deletePromptFile(filename: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await api.deletePrompt(filename);
      if (currentPrompt.value?.filename === filename) {
        currentPrompt.value = null;
      }
      await loadList();
    } catch (e) {
      error.value = e instanceof Error ? e.message : "删除失败";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    isAuthenticated,
    prompts,
    currentPrompt,
    loading,
    error,
    sortedPrompts,
    login,
    logout,
    loadList,
    loadPrompt,
    savePrompt,
    deletePromptFile,
  };
});
