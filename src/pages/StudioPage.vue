<template>
  <div class="studio-page">
    <div class="studio-container">
      <div class="left-panel">
        <div class="panel-header">
          <h2>配置</h2>
        </div>

        <div class="panel-scroll">
          <CollapsibleSection title="选择渠道">
            <select v-model="currentChannelId" class="select-input" @change="onChannelChange">
              <option v-for="channel in channels" :key="channel.id" :value="channel.id">
                {{ channel.name }}
              </option>
            </select>
          </CollapsibleSection>

          <CollapsibleSection v-if="currentChannel" title="选择任务">
            <div class="task-tabs">
              <button
                v-for="task in availableTasks"
                :key="task.type + (task.subType || '')"
                class="task-tab"
                :class="{ active: currentTaskType === task.type && currentTaskSubType === (task.subType || '') }"
                @click="onTaskChange(task.type, task.subType)"
              >
                {{ task.label }}
              </button>
            </div>
          </CollapsibleSection>

          <CollapsibleSection v-if="currentTask" title="模型参数">
            <ParamPanel
              :fields="currentTask.paramSchema"
              :initial-values="initialParams"
              @change="onParamChange"
            />
          </CollapsibleSection>

          <CollapsibleSection v-if="needsImage" title="上传图片">
            <ImageUploader
              :image-roles="imageRoles"
              :max-count="maxImageCount"
              @images-change="onImagesChange"
            />
          </CollapsibleSection>

          <CollapsibleSection title="提示词">
            <PromptEditor />
          </CollapsibleSection>
        </div>

        <div class="panel-footer">
          <button
            class="execute-btn"
            :disabled="status === 'running'"
            @click="onExecute"
          >
            {{ status === "running" ? "执行中..." : "🚀 执行生成" }}
          </button>
        </div>
      </div>

      <div class="right-panel">
        <div class="panel-header">
          <h2>结果预览</h2>
          <button
            class="toggle-preview-btn"
            :title="showResultPreview ? '隐藏预览' : '显示预览'"
            @click="showResultPreview = !showResultPreview"
          >
            {{ showResultPreview ? "👁️" : "🚫" }}
          </button>
        </div>
        <div v-show="showResultPreview" class="result-area">
          <ResultPreview />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from "vue";
import { useChannelStore } from "@/stores/channelStore";
import { useStudioStore } from "@/stores/studioStore";
import ParamPanel from "@/components/ParamPanel.vue";
import ImageUploader from "@/components/ImageUploader.vue";
import PromptEditor from "@/components/PromptEditor.vue";
import ResultPreview from "@/components/ResultPreview.vue";
import CollapsibleSection from "@/components/CollapsibleSection.vue";
import type { TaskType, ParamField } from "@/core/types";

const channelStore = useChannelStore();
const studio = useStudioStore();

const showResultPreview = ref(true);

const channels = computed(() => channelStore.channels);
const currentChannelId = computed({
  get: () => channelStore.currentChannelId,
  set: (val) => channelStore.setChannel(val),
});
const currentChannel = computed(() => channelStore.currentChannel);
const currentTaskType = computed({
  get: () => channelStore.currentTaskType,
  set: (val) => channelStore.setTask(val),
});
const currentTaskSubType = computed(() => channelStore.currentTaskSubType);
const currentTask = computed(() => channelStore.currentTask);
const availableTasks = computed(() => channelStore.availableTasks);
const status = computed(() => studio.status);

function buildInitialParams(task: typeof currentTask.value): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  if (task) {
    for (const field of task.paramSchema) {
      if (field.default !== undefined) {
        params[field.key] = field.default;
      }
    }
    // 如果 model 字段没有默认值，自动选第一个模型
    if (params.model === undefined && task.models && task.models.length > 0) {
      params.model = task.models[0].id;
    }
  }
  return params;
}

const initialParams = computed(() => buildInitialParams(currentTask.value));

const needsImage = computed(() => {
  return currentTask.value?.paramSchema.some((f: ParamField) => f.type === "image") || false;
});

const imageRoles = computed(() => {
  const field = currentTask.value?.paramSchema.find((f: ParamField) => f.type === "image");
  return field?.imageRoles;
});

const maxImageCount = computed(() => {
  const field = currentTask.value?.paramSchema.find((f: ParamField) => f.type === "image");
  return field?.maxCount || 1;
});

function onChannelChange() {
  studio.reset();
}

function onTaskChange(taskType: TaskType, subType?: string) {
  channelStore.setTask(taskType, subType);
  studio.reset();
  const defaults = buildInitialParams(channelStore.currentTask);
  lastModelId = String(defaults.model || "");
  studio.setParams(defaults);
  studio.loadModelParams();
}

function onParamChange(_values: Record<string, unknown>) {
  // 参数已由 ParamPanel 更新到 studio，自动记忆
}

function onImagesChange() {
  // 图片已由 ImageUploader 更新到 studio
}

function onExecute() {
  studio.execute();
}

watch(() => currentTask.value, () => {
  studio.reset();
  const defaults = buildInitialParams(currentTask.value);
  lastModelId = String(defaults.model || "");
  studio.setParams(defaults);
  studio.loadModelParams();
});

let lastModelId = "";

watch(() => studio.params.model, (newModel) => {
  const newId = String(newModel || "");
  if (!newId || newId === lastModelId) return;
  lastModelId = newId;
  studio.saveModelParamsNow();
  const defaults = buildInitialParams(currentTask.value);
  defaults.model = newId;
  studio.setParams(defaults);
  studio.loadModelParams();
});
</script>

<style scoped>
.studio-page {
  height: 100%;
  overflow: hidden;
}

.studio-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 24px;
  height: 100%;
  overflow: hidden;
}

.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toggle-preview-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.toggle-preview-btn:hover {
  background: #f3f4f6;
}

.panel-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.panel-scroll {
  flex: 1;
  overflow-y: auto;
}

.panel-footer {
  flex-shrink: 0;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.result-area {
  flex: 1;
  overflow: hidden;
}

.select-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.task-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.task-tab {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #4b5563;
  transition: all 0.2s;
}

.task-tab:hover {
  border-color: #9ca3af;
}

.task-tab.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.execute-btn {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.execute-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.execute-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .studio-container {
    grid-template-columns: 1fr;
  }
}
</style>
