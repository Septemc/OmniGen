<template>
  <div class="prompts-page">
    <!-- Login Screen -->
    <div v-if="!store.isAuthenticated" class="login-overlay">
      <div class="login-card">
        <div class="login-icon">🔐</div>
        <h2 class="login-title">提示词管理</h2>
        <p class="login-desc">请输入访问密码</p>
        <form @submit.prevent="handleLogin">
          <input
            v-model="passwordInput"
            type="password"
            class="login-input"
            placeholder="密码"
            autofocus
          />
          <div v-if="loginError" class="login-error">{{ loginError }}</div>
          <button
            type="submit"
            class="login-btn"
            :disabled="store.loading || !passwordInput"
          >
            {{ store.loading ? "验证中..." : "登录" }}
          </button>
        </form>
      </div>
    </div>

    <!-- Main Layout -->
    <div v-else class="prompts-layout">
      <aside class="sidebar">
        <PromptList
          :prompts="store.sortedPrompts"
          :loading="store.loading"
          :selected-filename="store.currentPrompt?.filename ?? null"
          @select="handleSelect"
          @new="openNew"
        />
      </aside>
      <main class="main-content">
        <PromptViewer
          :prompt="store.currentPrompt"
          @edit="openEdit"
          @delete="handleDelete"
        />
      </main>
    </div>

    <!-- Editor Modal -->
    <PromptEditorModal
      :visible="editorVisible"
      :is-new="isNewPrompt"
      :content="editorContent"
      :title="editorTitle"
      :saving="store.loading"
      :error="store.error"
      @close="editorVisible = false"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { usePromptStore } from "@/stores/promptStore";
import PromptList from "@/components/PromptList.vue";
import PromptViewer from "@/components/PromptViewer.vue";
import PromptEditorModal from "@/components/PromptEditorModal.vue";

const store = usePromptStore();

const passwordInput = ref("");
const loginError = ref<string | null>(null);

const editorVisible = ref(false);
const isNewPrompt = ref(false);
const editorContent = ref("");
const editorTitle = ref("");
const editingFilename = ref<string | null>(null);

onMounted(() => {
  if (store.isAuthenticated) {
    store.loadList();
  }
});

async function handleLogin() {
  loginError.value = null;
  try {
    await store.login(passwordInput.value);
    passwordInput.value = "";
    await store.loadList();
  } catch (e) {
    loginError.value = e instanceof Error ? e.message : "登录失败";
  }
}

async function handleSelect(filename: string) {
  await store.loadPrompt(filename);
}

function openNew() {
  isNewPrompt.value = true;
  editorContent.value = `# 新建提示词\n\n## 1. 中文长句理解性描述（原生版）\n\n\n## 2. 中文短句描述提示词\n\n### 正向提示词\n\n\n### 负向提示词\n\n\n## 3. 英文长句理解性描述\n\n\n## 4. 英文短语提示词（传统 Prompt）\n\n### Positive Prompt\n\n\n### Negative Prompt\n\n`;
  editorTitle.value = "";
  editingFilename.value = null;
  editorVisible.value = true;
}

function openEdit() {
  if (!store.currentPrompt) return;
  isNewPrompt.value = false;
  editorContent.value = store.currentPrompt.content;
  editorTitle.value = store.currentPrompt.title;
  editingFilename.value = store.currentPrompt.filename;
  editorVisible.value = true;
}

function generateFilename(title: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate()
  )}${pad(now.getHours())}${pad(now.getMinutes())}`;
  const safe = title
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60) || "Untitled";
  return `${ts}_${safe}.md`;
}

async function handleSave(title: string, content: string) {
  try {
    const filename = isNewPrompt.value
      ? generateFilename(title || "Untitled")
      : editingFilename.value!;
    await store.savePrompt(filename, content);
    editorVisible.value = false;
    if (store.currentPrompt?.filename !== filename) {
      await store.loadPrompt(filename);
    }
  } catch {
    // error is shown via store.error
  }
}

async function handleDelete() {
  if (!store.currentPrompt) return;
  if (!confirm(`确认删除 "${store.currentPrompt.title}"?\n此操作不可撤销。`))
    return;
  try {
    await store.deletePromptFile(store.currentPrompt.filename);
  } catch {
    // error is shown via store.error
  }
}
</script>

<style scoped>
.prompts-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.login-overlay {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 40px 32px;
  width: 100%;
  max-width: 380px;
  text-align: center;
}

.login-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.login-title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.login-desc {
  margin: 0 0 24px;
  font-size: 14px;
  color: #6b7280;
}

.login-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  text-align: center;
}

.login-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.login-error {
  margin-top: 10px;
  font-size: 13px;
  color: #dc2626;
}

.login-btn {
  width: 100%;
  margin-top: 14px;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.login-btn:hover {
  background: #1d4ed8;
}

.login-btn:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.prompts-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr;
  overflow: hidden;
}

.sidebar {
  overflow: hidden;
}

.main-content {
  overflow: hidden;
  background: white;
}

@media (max-width: 767px) {
  .prompts-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }

  .sidebar {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }
}
</style>
