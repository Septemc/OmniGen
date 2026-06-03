<template>
  <div class="channels-page">
    <div class="page-header">
      <div>
        <h1>渠道管理</h1>
        <p class="subtitle">添加、编辑或删除渠道配置</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="startAdd">+ 添加渠道</button>
        <button class="btn-secondary" @click="loadDefaults">加载默认模板</button>
      </div>
    </div>

    <div v-if="editing" class="editor-wrapper">
      <ChannelEditor
        :channel="editingChannel"
        @save="handleSave"
        @cancel="editing = false"
      />
    </div>

    <div v-else class="channels-scroll">
      <div class="channels-list">
        <div v-if="channels.length === 0" class="empty-state">
          <div class="empty-icon">📡</div>
          <p>暂无渠道配置</p>
          <p class="empty-hint">点击「添加渠道」创建你的第一个渠道，或「加载默认模板」快速开始</p>
        </div>

        <div v-for="channel in channels" :key="channel.id" class="channel-card">
        <div class="card-header">
          <div class="card-title">
            <h3>{{ channel.name }}</h3>
            <span class="provider-tag">{{ channel.provider }}</span>
            <span class="enabled-tag" :class="channel.enabled ? 'on' : 'off'">
              {{ channel.enabled ? "已启用" : "已禁用" }}
            </span>
          </div>
          <div class="card-actions">
            <button class="btn-icon" title="编辑" @click="startEdit(channel)">✏️</button>
            <button class="btn-icon" title="复制" @click="duplicateChannel(channel)">📋</button>
            <button class="btn-icon danger" title="删除" @click="handleDelete(channel)">🗑️</button>
          </div>
        </div>

        <div class="card-body">
          <div class="card-meta">
            <span class="meta-item"><strong>ID:</strong> {{ channel.id }}</span>
            <span class="meta-item"><strong>URL:</strong> {{ channel.baseUrl }}</span>
          </div>

          <div class="card-tasks">
            <span class="meta-label">支持任务：</span>
            <span v-for="task in channel.tasks" :key="task.type" class="task-tag">
              {{ task.label }}
            </span>
            <span v-if="channel.tasks.length === 0" class="no-tasks">未配置任务</span>
          </div>

          <div class="card-api-key">
            <span class="meta-label">API Key：</span>
            <div class="api-key-row">
              <input
                :type="keyVisibility[channel.id] ? 'text' : 'password'"
                v-model="apiKeys[channel.id]"
                :placeholder="`输入 ${channel.name} 的 API Key`"
                class="api-key-input"
              />
              <button class="btn-icon-sm" @click="toggleKeyVisibility(channel.id)">
                {{ keyVisibility[channel.id] ? "🙈" : "👁️" }}
              </button>
              <button class="btn-icon-sm" @click="saveApiKey(channel.id)" title="保存">💾</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useChannelStore } from "@/stores/channelStore";
import { useSettingsStore } from "@/stores/settingsStore";
import ChannelEditor from "@/components/ChannelEditor.vue";
import { DEFAULT_CHANNEL_TEMPLATES } from "@/core/channelTemplates";
import type { Channel } from "@/core/types";

const channelStore = useChannelStore();
const settingsStore = useSettingsStore();

const channels = computed(() => channelStore.channels);
const editing = ref(false);
const editingChannel = ref<Channel | undefined>(undefined);
const apiKeys = ref<Record<string, string>>({});
const keyVisibility = ref<Record<string, boolean>>({});

onMounted(async () => {
  await channelStore.loadChannels();
  for (const ch of channels.value) {
    const key = settingsStore.getChannelApiKey(ch.id);
    if (key) apiKeys.value[ch.id] = key;
    keyVisibility.value[ch.id] = false;
  }
});

function startAdd() {
  editingChannel.value = undefined;
  editing.value = true;
}

function startEdit(channel: Channel) {
  editingChannel.value = channel;
  editing.value = true;
}

async function handleSave(channel: Channel) {
  if (editingChannel.value) {
    await channelStore.updateChannel(channel);
  } else {
    await channelStore.addChannel(channel);
  }
  editing.value = false;
  editingChannel.value = undefined;
}

async function handleDelete(channel: Channel) {
  if (confirm(`确定要删除渠道「${channel.name}」吗？此操作不可撤销。`)) {
    await channelStore.removeChannel(channel.id);
  }
}

async function duplicateChannel(channel: Channel) {
  const copy = JSON.parse(JSON.stringify(channel)) as Channel;
  copy.id = copy.id + "-copy";
  copy.name = copy.name + " (副本)";
  await channelStore.addChannel(copy);
}

async function loadDefaults() {
  const existingIds = new Set(channels.value.map((c) => c.id));
  const toImport = DEFAULT_CHANNEL_TEMPLATES.map((t) => {
    if (existingIds.has(t.id)) {
      const existing = channels.value.find((c) => c.id === t.id);
      // 保留用户自定义的 API Key 等配置，用默认模板覆盖任务定义
      return { ...t, auth: existing?.auth || t.auth, baseUrl: existing?.baseUrl || t.baseUrl };
    }
    return JSON.parse(JSON.stringify(t)) as Channel;
  });
  await channelStore.importChannels(toImport);
  for (const ch of toImport) {
    keyVisibility.value[ch.id] = false;
  }
}

function toggleKeyVisibility(channelId: string) {
  keyVisibility.value[channelId] = !keyVisibility.value[channelId];
}

async function saveApiKey(channelId: string) {
  const key = apiKeys.value[channelId];
  if (key) {
    await settingsStore.saveChannelApiKey(channelId, key);
  }
}
</script>

<style scoped>
.channels-page { height: 100%; display: flex; flex-direction: column; overflow: hidden; }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; flex-shrink: 0; padding: 24px 24px 16px; }
.page-header h1 { margin: 0 0 4px 0; font-size: 24px; font-weight: 700; color: #111827; }
.subtitle { margin: 0; color: #6b7280; font-size: 14px; }
.header-actions { display: flex; gap: 8px; }

.editor-wrapper { flex: 1; overflow: hidden; padding: 0 24px 24px; }

.channels-scroll { flex: 1; overflow-y: auto; padding: 0 24px 24px; }

.channels-list { display: flex; flex-direction: column; gap: 16px; }

.empty-state { text-align: center; padding: 64px 24px; color: #6b7280; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-hint { font-size: 14px; color: #9ca3af; }

.channel-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }

.card-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
.card-title { display: flex; align-items: center; gap: 10px; }
.card-title h3 { margin: 0; font-size: 16px; font-weight: 600; color: #111827; }
.provider-tag { font-size: 12px; color: #374151; background: #e5e7eb; padding: 3px 10px; border-radius: 9999px; }
.enabled-tag { font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 500; }
.enabled-tag.on { background: #d1fae5; color: #065f46; }
.enabled-tag.off { background: #fee2e2; color: #991b1b; }

.card-actions { display: flex; gap: 4px; }
.btn-icon { width: 32px; height: 32px; border: none; background: transparent; border-radius: 6px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
.btn-icon:hover { background: #e5e7eb; }
.btn-icon.danger:hover { background: #fee2e2; }

.card-body { padding: 16px 20px; }
.card-meta { display: flex; gap: 24px; margin-bottom: 12px; font-size: 13px; color: #6b7280; }
.card-meta strong { color: #374151; }

.card-tasks { margin-bottom: 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.meta-label { font-size: 13px; color: #6b7280; font-weight: 500; }
.task-tag { font-size: 12px; color: #374151; background: #e0e7ff; padding: 3px 10px; border-radius: 9999px; }
.no-tasks { font-size: 12px; color: #9ca3af; font-style: italic; }

.card-api-key { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.api-key-row { display: flex; gap: 4px; flex: 1; min-width: 280px; }
.api-key-input { flex: 1; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; }
.btn-icon-sm { width: 28px; height: 28px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }
.btn-icon-sm:hover { background: #f3f4f6; }

.btn-primary { padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; }
.btn-primary:hover { background: #2563eb; }
.btn-secondary { padding: 10px 20px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; cursor: pointer; }
.btn-secondary:hover { background: #f9fafb; }
</style>
