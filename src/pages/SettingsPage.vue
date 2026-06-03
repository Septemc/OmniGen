<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>设置</h1>
    </div>
    <div class="settings-scroll">
      <div class="settings-section">
        <h3 class="section-title">保存路径</h3>
        <div class="field-group">
          <label>生成图片保存目录</label>
          <div class="dir-row">
            <span class="dir-path">📁 {{ settingsStore.outputPath }}</span>
            <span class="dir-hint">（项目根目录下，文件持久保存）</span>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">输出设置</h3>

        <div class="field-group">
          <label>命名模板</label>
          <input v-model="settings.outputConfig.namingTemplate" type="text" class="text-input" />
          <p class="hint">
            可用变量: {date} {time} {channel} {model} {prompt20}
          </p>
        </div>

        <div class="field-group">
          <label>提示词截取长度</label>
          <input
            v-model.number="settings.outputConfig.promptSubstrLen"
            type="number"
            min="5"
            max="100"
            class="text-input"
          />
        </div>
      </div>

      <div class="settings-actions">
        <button class="save-btn" @click="onSave">保存设置</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSettingsStore } from "@/stores/settingsStore";

const settingsStore = useSettingsStore();

const settings = computed(() => settingsStore.settings);

async function onSave() {
  await settingsStore.saveSettings();
  alert("设置已保存！");
}
</script>

<style scoped>
.settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  flex-shrink: 0;
  padding: 24px 24px 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.settings-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}

.settings-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 16px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.field-group {
  margin-bottom: 16px;
}

.field-group label {
  display: block;
  font-weight: 500;
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 6px;
}

.text-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.hint {
  font-size: 12px;
  color: #6b7280;
  margin: 6px 0 0 0;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.save-btn:hover {
  background: #2563eb;
}

.dir-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.dir-path {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.dir-hint {
  font-size: 13px;
  color: #9ca3af;
}
</style>
