<template>
  <div class="prompt-list">
    <div class="list-header">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="搜索提示词..."
      />
      <button class="btn-new" @click="$emit('new')" title="新建提示词">+ 新建</button>
    </div>

    <div v-if="loading" class="list-status">加载中...</div>
    <div v-else-if="filteredPrompts.length === 0" class="list-status list-empty">
      {{ searchQuery ? "无匹配结果" : "暂无提示词" }}
    </div>

    <div class="list-items">
      <div
        v-for="prompt in filteredPrompts"
        :key="prompt.filename"
        class="list-item"
        :class="{ active: selectedFilename === prompt.filename }"
        @click="$emit('select', prompt.filename)"
      >
        <div class="item-title">{{ prompt.title }}</div>
        <div class="item-meta">
          <span class="item-date">{{ formatDate(prompt.modifiedAt) }}</span>
          <span class="item-filename" :title="prompt.filename">{{ prompt.filename }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { PromptMeta } from "@/api/promptsApi";

const props = defineProps<{
  prompts: PromptMeta[];
  loading: boolean;
  selectedFilename: string | null;
}>();

defineEmits<{
  select: [filename: string];
  new: [];
}>();

const searchQuery = ref("");

const filteredPrompts = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return props.prompts;
  return props.prompts.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.filename.toLowerCase().includes(q)
  );
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
</script>

<style scoped>
.prompt-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
}

.list-header {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.btn-new {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-new:hover {
  background: #1d4ed8;
}

.list-status {
  padding: 24px 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

.list-empty {
  color: #6b7280;
}

.list-items {
  flex: 1;
  overflow-y: auto;
}

.list-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.15s;
}

.list-item:hover {
  background: #eff6ff;
}

.list-item.active {
  background: #dbeafe;
  border-left: 3px solid #2563eb;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.item-date {
  font-size: 12px;
  color: #9ca3af;
}

.item-filename {
  font-size: 11px;
  color: #d1d5db;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
