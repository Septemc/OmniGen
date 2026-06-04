<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h2 class="modal-title">{{ isNew ? "新建提示词" : "编辑提示词" }}</h2>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>

      <div v-if="isNew" class="modal-field">
        <label class="field-label">标题</label>
        <input
          v-model="titleDraft"
          type="text"
          class="field-input"
          placeholder="输入提示词标题..."
        />
      </div>

      <div class="modal-editor">
        <div class="editor-toolbar">
          <button
            :class="{ active: viewMode === 'edit' }"
            @click="viewMode = 'edit'"
          >
            编辑
          </button>
          <button
            :class="{ active: viewMode === 'split' }"
            @click="viewMode = 'split'"
          >
            分栏
          </button>
          <button
            :class="{ active: viewMode === 'preview' }"
            @click="viewMode = 'preview'"
          >
            预览
          </button>
        </div>
        <div class="editor-body" :class="'mode-' + viewMode">
          <textarea
            v-show="viewMode !== 'preview'"
            v-model="contentDraft"
            class="editor-textarea"
            placeholder="输入 Markdown 内容..."
          ></textarea>
          <div
            v-show="viewMode !== 'edit'"
            class="editor-preview markdown-body"
            v-html="previewHtml"
          ></div>
        </div>
      </div>

      <div class="modal-footer">
        <div v-if="error" class="modal-error">{{ error }}</div>
        <div class="modal-buttons">
          <button class="btn-cancel" @click="$emit('close')">取消</button>
          <button class="btn-save" :disabled="saving" @click="handleSave">
            {{ saving ? "保存中..." : "保存" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { renderMarkdown } from "@/utils/markdown";

const props = defineProps<{
  visible: boolean;
  isNew: boolean;
  content: string;
  title: string;
  saving: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  close: [];
  save: [title: string, content: string];
}>();

const titleDraft = ref("");
const contentDraft = ref("");
const viewMode = ref<"edit" | "split" | "preview">("split");

watch(
  () => props.visible,
  (v) => {
    if (v) {
      titleDraft.value = props.title || "";
      contentDraft.value = props.content || "";
    }
  }
);

const previewHtml = computed(() => renderMarkdown(contentDraft.value));

function handleSave() {
  if (!contentDraft.value.trim()) return;
  emit("save", titleDraft.value.trim(), contentDraft.value);
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 22px;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-field {
  padding: 12px 24px 0;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.field-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}

.field-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.modal-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 12px 24px;
}

.editor-toolbar {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.editor-toolbar button {
  padding: 6px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.editor-toolbar button:hover {
  background: #f3f4f6;
}

.editor-toolbar button.active {
  background: #eff6ff;
  border-color: #2563eb;
  color: #2563eb;
}

.editor-body {
  flex: 1;
  overflow: hidden;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}

.editor-body.mode-edit {
  display: block;
}

.editor-body.mode-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.editor-body.mode-preview {
  display: block;
}

.editor-textarea {
  width: 100%;
  height: 100%;
  min-height: 300px;
  padding: 12px;
  border: none;
  resize: none;
  font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
  background: #fafafa;
  border-radius: 8px;
}

.mode-split .editor-textarea {
  border-right: 1px solid #e5e7eb;
  border-radius: 8px 0 0 8px;
}

.editor-preview {
  padding: 12px 16px;
  overflow-y: auto;
  background: white;
  border-radius: 0 8px 8px 0;
}

.mode-preview .editor-preview {
  border-radius: 8px;
}

.editor-preview.markdown-body :deep(h1) {
  font-size: 20px;
  margin-bottom: 12px;
}

.editor-preview.markdown-body :deep(h2) {
  font-size: 17px;
}

.editor-preview.markdown-body :deep(h3) {
  font-size: 15px;
}

.modal-footer {
  padding: 12px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.modal-error {
  font-size: 13px;
  color: #dc2626;
  margin-right: auto;
}

.modal-buttons {
  display: flex;
  gap: 8px;
}

.btn-cancel {
  padding: 8px 20px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #f3f4f6;
}

.btn-save {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-save:hover {
  background: #1d4ed8;
}

.btn-save:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

@media (max-width: 767px) {
  .modal-container {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .editor-body.mode-split {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
}
</style>
