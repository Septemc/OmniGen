<template>
  <div class="history-page">
    <div class="page-header">
      <h1>运行历史</h1>
      <button
        class="toggle-btn"
        :title="showAllPreviews ? '隐藏所有预览' : '显示所有预览'"
        @click="showAllPreviews = !showAllPreviews"
      >
        {{ showAllPreviews ? '👁️ 隐藏预览' : '🚫 显示预览' }}
      </button>
    </div>
    <div class="history-scroll">
      <div v-if="loading" class="loading">加载中...</div>

      <div v-else-if="history.length === 0" class="empty">
        <div class="empty-icon">📜</div>
        <p>暂无历史记录</p>
      </div>

      <div v-else class="history-list">
        <div v-for="item in history" :key="item.id" class="history-item">
          <div class="item-header">
            <div class="item-title">
              <span class="channel-badge">{{ item.channelName }}</span>
              <span class="task-type">{{ item.taskType }}</span>
              <span class="item-model">{{ item.modelName }}</span>
            </div>
            <div class="item-meta">
              <span class="time">{{ formatTime(item.createdAt) }}</span>
              <span class="duration" v-if="item.durationMs">{{ (item.durationMs / 1000).toFixed(1) }}s</span>
              <span class="status" :class="item.status">{{ item.status }}</span>
            </div>
          </div>

          <div v-if="item.prompt" class="item-prompt">
            "{{ item.prompt }}"
          </div>

          <div v-if="hasParams(item.params)" class="item-params">
            <span class="params-label">参数：</span>
            <span v-for="(val, key) in displayParams(item.params)" :key="key" class="param-tag">
              {{ key }}: {{ val }}
            </span>
          </div>

          <div v-if="item.status === 'success' && isPreviewVisible(item.id)" class="item-preview">
            <template v-if="item.thumbnails.length > 0">
              <img
                v-for="(url, index) in item.thumbnails.slice(0, 4)"
                :key="index"
                :src="url"
                class="preview-thumb"
              />
            </template>
            <template v-else-if="item.files.length > 0">
              <img
                v-for="(url, index) in item.files.slice(0, 4)"
                :key="index"
                :src="url"
                class="preview-thumb"
              />
            </template>
            <div v-else class="no-thumbnail">🖼️</div>
          </div>

          <div v-if="item.status === 'success' && item.savedPaths && item.savedPaths.length > 0" class="item-saved-paths">
            <span class="paths-label">保存路径：</span>
            <div class="paths-list">
              <span v-for="(p, i) in item.savedPaths" :key="i" class="path-tag">{{ p }}</span>
            </div>
          </div>

          <div v-if="item.status === 'failed' && item.errorMessage" class="item-error">
            {{ item.errorMessage }}
          </div>

          <div class="item-actions">
            <button
              class="action-btn"
              :title="isItemPreviewOn(item.id) ? '隐藏预览' : '显示预览'"
              @click="toggleItemPreview(item.id)"
            >
              {{ isItemPreviewOn(item.id) ? '👁️' : '🚫' }}
            </button>
            <button class="action-btn" @click="reuseItem(item)">重用</button>
            <button class="action-btn delete" @click="deleteItem(item.id)">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useHistoryStore } from "@/stores/historyStore";
import { useStudioStore } from "@/stores/studioStore";
import { useRouter } from "vue-router";
import type { RunHistory } from "@/core/types";

const historyStore = useHistoryStore();
const studio = useStudioStore();
const router = useRouter();

const { history, loading, loadHistory, deleteHistory } = historyStore;
const showAllPreviews = ref(true);
const itemPreviews = ref<Record<string, boolean>>({});

onMounted(() => {
  loadHistory();
});

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN");
}

function hasParams(params: Record<string, unknown>): boolean {
  if (!params) return false;
  const keys = Object.keys(params).filter(
    (k) => k !== "model" && params[k] !== undefined && params[k] !== null && params[k] !== ""
  );
  return keys.length > 0;
}

function displayParams(params: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (key === "model") continue;
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "object") {
      result[key] = JSON.stringify(value);
    } else {
      result[key] = String(value);
    }
  }
  return result;
}

function isPreviewVisible(id: string): boolean {
  if (!showAllPreviews.value) return false;
  return isItemPreviewOn(id);
}

function isItemPreviewOn(id: string): boolean {
  return itemPreviews.value[id] !== false;
}

function toggleItemPreview(id: string) {
  itemPreviews.value[id] = !isItemPreviewOn(id);
}

function reuseItem(item: RunHistory) {
  studio.reuseHistory(item);
  router.push("/");
}

async function deleteItem(id: string) {
  if (confirm("确定要删除这条历史记录吗？")) {
    await deleteHistory(id);
  }
}
</script>

<style scoped>
.history-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  flex-shrink: 0;
  padding: 24px 24px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.toggle-btn {
  padding: 8px 14px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #4b5563;
  transition: background 0.2s;
}

.toggle-btn:hover {
  background: #f3f4f6;
}

.history-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}

.loading,
.empty {
  text-align: center;
  padding: 48px;
  color: #6b7280;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 16px 20px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.channel-badge {
  font-weight: 600;
  color: #3b82f6;
}

.task-type {
  font-size: 13px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 9999px;
}

.item-model {
  font-size: 14px;
  color: #374151;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.time,
.duration {
  color: #6b7280;
}

.status {
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.status.success {
  background: #d1fae5;
  color: #065f46;
}

.status.failed {
  background: #fee2e2;
  color: #991b1b;
}

.item-prompt {
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 12px;
  line-height: 1.5;
}

.item-preview {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.preview-thumb {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
}

.no-thumbnail {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 28px;
  color: #9ca3af;
}

.item-params {
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  flex-wrap: wrap;
}

.params-label {
  font-size: 12px;
  color: #9ca3af;
  line-height: 22px;
}

.param-tag {
  font-size: 11px;
  color: #374151;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-saved-paths {
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.paths-label {
  font-size: 12px;
  color: #9ca3af;
  line-height: 22px;
  flex-shrink: 0;
}

.paths-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.path-tag {
  font-size: 12px;
  color: #065f46;
  background: #d1fae5;
  padding: 2px 8px;
  border-radius: 4px;
  word-break: break-all;
}

.item-error {
  font-size: 14px;
  color: #ef4444;
  margin-bottom: 12px;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  color: #4b5563;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #9ca3af;
}

.action-btn.delete {
  color: #ef4444;
  border-color: #fecaca;
}

.action-btn.delete:hover {
  background: #fef2f2;
}
</style>
