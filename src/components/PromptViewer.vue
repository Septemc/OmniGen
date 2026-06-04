<template>
  <div class="prompt-viewer">
    <div v-if="!prompt" class="viewer-empty">
      <div class="empty-icon">📄</div>
      <div class="empty-text">选择左侧提示词查看内容</div>
    </div>

    <div v-else class="viewer-content">
      <div class="viewer-header">
        <div class="viewer-title">{{ prompt.title }}</div>
        <div class="viewer-meta">
          <span>{{ prompt.filename }}</span>
          <span>{{ formatDate(prompt.modifiedAt) }}</span>
        </div>
        <div class="viewer-actions">
          <button class="btn-action" @click="$emit('edit')" title="编辑">✏️ 编辑</button>
          <button class="btn-action btn-danger" @click="$emit('delete')" title="删除">🗑️ 删除</button>
        </div>
      </div>
      <div
        class="markdown-body"
        v-html="renderedContent"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PromptDetail } from "@/api/promptsApi";
import { renderMarkdown } from "@/utils/markdown";

const props = defineProps<{
  prompt: PromptDetail | null;
}>();

defineEmits<{
  edit: [];
  delete: [];
}>();

const renderedContent = computed(() => {
  if (!props.prompt) return "";
  return renderMarkdown(props.prompt.content);
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
.prompt-viewer {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.viewer-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  gap: 8px;
}

.empty-icon {
  font-size: 48px;
}

.empty-text {
  font-size: 16px;
}

.viewer-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.viewer-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.viewer-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.viewer-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 12px;
}

.viewer-actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  padding: 6px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.btn-danger:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}

.markdown-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

.markdown-body :deep(h1) {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-top: 0;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.markdown-body :deep(h2) {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-top: 24px;
  margin-bottom: 12px;
}

.markdown-body :deep(h3) {
  font-size: 17px;
  font-weight: 600;
  color: #374151;
  margin-top: 20px;
  margin-bottom: 8px;
}

.markdown-body :deep(h4) {
  font-size: 15px;
  font-weight: 600;
  color: #4b5563;
  margin-top: 16px;
  margin-bottom: 6px;
}

.markdown-body :deep(p) {
  line-height: 1.75;
  margin-bottom: 12px;
  color: #374151;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 24px;
  margin-bottom: 12px;
}

.markdown-body :deep(li) {
  line-height: 1.7;
  color: #374151;
  margin-bottom: 4px;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #2563eb;
  padding: 8px 16px;
  margin: 12px 0;
  background: #eff6ff;
  border-radius: 0 6px 6px 0;
  color: #1e40af;
}

.markdown-body :deep(code) {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  color: #dc2626;
}

.markdown-body :deep(pre) {
  background: #1f2937;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 12px;
}

.markdown-body :deep(pre code) {
  background: none;
  color: #e5e7eb;
  padding: 0;
  font-size: 13px;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 24px 0;
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  text-align: left;
  font-size: 14px;
}

.markdown-body :deep(th) {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.markdown-body :deep(strong) {
  font-weight: 600;
  color: #111827;
}

.markdown-body :deep(em) {
  color: #6b7280;
}

@media (max-width: 767px) {
  .markdown-body {
    padding: 16px;
  }
}
</style>
