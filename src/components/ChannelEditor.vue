<template>
  <div class="channel-editor">
    <div class="editor-header">
      <h2>{{ isNew ? "添加渠道" : "编辑渠道" }}</h2>
      <div class="header-actions">
        <button class="btn-secondary" @click="$emit('cancel')">取消</button>
        <button class="btn-primary" @click="handleSave">保存</button>
      </div>
    </div>

    <div class="editor-body">
      <section class="editor-section">
        <h3 class="section-title">基本信息</h3>
        <div class="form-grid">
          <div class="form-field">
            <label>渠道 ID</label>
            <input v-model="channel.id" :disabled="!isNew" placeholder="如 gitee-ai" />
          </div>
          <div class="form-field">
            <label>渠道名称</label>
            <input v-model="channel.name" placeholder="如 Gitee AI" />
          </div>
          <div class="form-field">
            <label>提供商</label>
            <input v-model="channel.provider" placeholder="如 Gitee" />
          </div>
          <div class="form-field">
            <label>版本</label>
            <input v-model="channel.version" placeholder="1.0.0" />
          </div>
          <div class="form-field full-width">
            <label>Base URL</label>
            <input v-model="channel.baseUrl" placeholder="https://ai.gitee.com/v1" />
          </div>
          <div class="form-field">
            <label>启用</label>
            <label class="toggle"><input type="checkbox" v-model="channel.enabled" /><span class="toggle-slider"></span></label>
          </div>
        </div>
      </section>

      <section class="editor-section">
        <h3 class="section-title">认证配置</h3>
        <div class="form-grid">
          <div class="form-field">
            <label>认证方式</label>
            <select v-model="channel.auth.type">
              <option v-for="opt in AUTH_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="form-field" v-if="channel.auth.type === 'api-key'">
            <label>Header Key</label>
            <input v-model="channel.auth.headerKey" placeholder="X-API-Key" />
          </div>
          <div class="form-field">
            <label>超时 (ms)</label>
            <input v-model.number="channel.requestConfig.timeout" type="number" />
          </div>
        </div>
      </section>

      <section class="editor-section">
        <div class="section-header">
          <h3 class="section-title">任务定义</h3>
          <button class="btn-add" @click="addTask">+ 添加任务</button>
        </div>

        <div v-for="(task, ti) in channel.tasks" :key="ti" class="task-block">
          <div class="task-header">
            <span class="task-index">任务 #{{ ti + 1 }}</span>
            <button class="btn-remove" @click="removeTask(ti)">删除</button>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label>任务类型</label>
              <select v-model="task.type">
                <option v-for="opt in TASK_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div class="form-field">
              <label>显示标签</label>
              <input v-model="task.label" placeholder="文生图" />
            </div>
            <div class="form-field">
              <label>API 端点</label>
              <input v-model="task.endpoint" placeholder="/images/generations" />
            </div>
            <div class="form-field">
              <label>请求方式</label>
              <select v-model="task.method"><option value="POST">POST</option><option value="GET">GET</option></select>
            </div>
            <div class="form-field">
              <label>请求格式</label>
              <select v-model="task.requestType">
                <option v-for="opt in REQUEST_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div class="form-field">
              <label>调用模式</label>
              <select v-model="task.callMode">
                <option v-for="opt in CALL_MODE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div class="form-field">
              <label>响应模式</label>
              <select v-model="task.responseMode">
                <option v-for="opt in RESPONSE_MODE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div class="form-field">
              <label>输出类型</label>
              <select v-model="task.outputKind">
                <option v-for="opt in OUTPUT_KIND_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div class="form-field">
              <label>异步任务</label>
              <label class="toggle"><input type="checkbox" v-model="task.async" /><span class="toggle-slider"></span></label>
            </div>
          </div>

          <div v-if="task.async || task.callMode === 'async_poll'" class="form-grid sub-section">
            <div class="form-field"><label>轮询端点</label><input v-model="task.pollEndpoint" placeholder="/task/{task_id}" /></div>
            <div class="form-field"><label>任务 ID 路径</label><input v-model="task.taskIdPath" placeholder="task_id" /></div>
            <div class="form-field"><label>状态路径</label><input v-model="task.taskStatusPath" placeholder="status" /></div>
            <div class="form-field"><label>成功状态值</label><input v-model="task.taskSuccessStatus" placeholder="success" /></div>
            <div class="form-field"><label>轮询间隔 (ms)</label><input v-model.number="task.pollInterval" type="number" /></div>
            <div class="form-field"><label>最大轮询时长 (ms)</label><input v-model.number="task.maxPollDuration" type="number" /></div>
          </div>

          <div class="sub-section">
            <div class="section-header">
              <h4 class="sub-title">模型列表</h4>
              <button class="btn-add-sm" @click="addModel(ti)">+ 模型</button>
            </div>
            <div class="model-list">
              <div v-for="(m, mi) in task.models" :key="mi" class="model-row">
                <input v-model="m.id" placeholder="模型 ID" class="model-input" />
                <input v-model="m.name" placeholder="显示名称" class="model-input" />
                <button class="btn-remove-sm" @click="removeModel(ti, mi)">×</button>
              </div>
            </div>
          </div>

          <div class="sub-section">
            <div class="section-header">
              <h4 class="sub-title">参数 Schema</h4>
              <button class="btn-add-sm" @click="addParam(ti)">+ 参数</button>
            </div>
            <div v-for="(p, pi) in task.paramSchema" :key="pi" class="param-block">
              <div class="param-header">
                <span>{{ p.label || p.key || `参数 #${pi + 1}` }}</span>
                <button class="btn-remove-sm" @click="removeParam(ti, pi)">×</button>
              </div>
              <div class="form-grid compact">
                <div class="form-field"><label>key</label><input v-model="p.key" placeholder="size" /></div>
                <div class="form-field"><label>label</label><input v-model="p.label" placeholder="尺寸" /></div>
                <div class="form-field"><label>类型</label>
                  <select v-model="p.type"><option v-for="opt in PARAM_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>
                </div>
                <div class="form-field"><label>apiField</label><input v-model="p.apiField" placeholder="size" /></div>
                <div class="form-field"><label>默认值</label><input v-model="p.default" placeholder="1024x1024" /></div>
                <div class="form-field"><label>必填</label><label class="toggle"><input type="checkbox" v-model="p.required" /><span class="toggle-slider"></span></label></div>
                <div class="form-field"><label>高级</label><label class="toggle"><input type="checkbox" v-model="p.advanced" /><span class="toggle-slider"></span></label></div>
              </div>
              <div v-if="p.type === 'slider' || p.type === 'number'" class="form-grid compact">
                <div class="form-field"><label>min</label><input v-model.number="p.min" type="number" /></div>
                <div class="form-field"><label>max</label><input v-model.number="p.max" type="number" /></div>
                <div class="form-field"><label>step</label><input v-model.number="p.step" type="number" /></div>
              </div>
              <div v-if="p.type === 'select'" class="sub-section compact">
                <div class="section-header">
                  <h4 class="sub-title">选项</h4>
                  <button class="btn-add-sm" @click="addParamOption(ti, pi)">+ 选项</button>
                </div>
                <div v-for="(o, oi) in p.options" :key="oi" class="model-row">
                  <input v-model="o.label" placeholder="显示文本" class="model-input" />
                  <input v-model="o.value" placeholder="值" class="model-input" />
                  <button class="btn-remove-sm" @click="removeParamOption(ti, pi, oi)">×</button>
                </div>
              </div>
              <div v-if="p.type === 'image'" class="form-grid compact">
                <div class="form-field"><label>最大数量</label><input v-model.number="p.maxCount" type="number" /></div>
              </div>
              <div class="form-field compact"><label>描述</label><input v-model="p.description" placeholder="参数说明" /></div>
            </div>
          </div>
        </div>
      </section>

      <section class="editor-section">
        <div class="section-header">
          <h3 class="section-title">输入映射</h3>
          <button class="btn-add" @click="addInputMapping">+ 添加映射</button>
        </div>
        <div class="mapping-list">
          <div v-for="(m, i) in channel.inputMapping" :key="i" class="mapping-row">
            <input v-model="m.uiField" placeholder="界面字段 (如 prompt)" class="mapping-input" />
            <span class="mapping-arrow">→</span>
            <input v-model="m.apiField" placeholder="API 字段 (如 prompt)" class="mapping-input" />
            <button class="btn-remove-sm" @click="removeInputMapping(i)">×</button>
          </div>
        </div>
      </section>

      <section class="editor-section">
        <div class="section-header">
          <h3 class="section-title">输出映射</h3>
          <button class="btn-add" @click="addOutputMapping">+ 添加映射</button>
        </div>
        <div class="mapping-list">
          <div v-for="(m, i) in channel.outputMapping" :key="i" class="mapping-row">
            <select v-model="m.kind" class="mapping-select">
              <option v-for="opt in OUTPUT_MAPPING_KIND_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <input v-model="m.dataPath" placeholder="数据路径 (如 data[0].url)" class="mapping-input-lg" />
            <input v-model="m.mimeType" placeholder="MIME (可选)" class="mapping-input-sm" />
            <button class="btn-remove-sm" @click="removeOutputMapping(i)">×</button>
          </div>
        </div>
      </section>

      <section class="editor-section">
        <div class="section-header"><h3 class="section-title">导入 / 导出</h3></div>
        <div class="json-actions">
          <button class="btn-secondary" @click="exportJson">导出 JSON</button>
          <button class="btn-secondary" @click="triggerImport">导入 JSON</button>
          <input ref="importInput" type="file" accept=".json" @change="handleImport" style="display:none" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Channel } from "@/core/types";
import {
  createEmptyChannel,
  createEmptyTask,
  createEmptyParamField,
  createEmptyModel,
  createEmptyInputMapping,
  createEmptyOutputMapping,
  TASK_TYPE_OPTIONS,
  AUTH_TYPE_OPTIONS,
  REQUEST_TYPE_OPTIONS,
  CALL_MODE_OPTIONS,
  RESPONSE_MODE_OPTIONS,
  OUTPUT_KIND_OPTIONS,
  PARAM_TYPE_OPTIONS,
  OUTPUT_MAPPING_KIND_OPTIONS,
} from "@/core/channelTemplates";

interface Props { channel?: Channel }
const props = defineProps<Props>();
const emit = defineEmits<{ save: [channel: Channel]; cancel: [] }>();

const isNew = ref(!props.channel);
const channel = ref<Channel>(props.channel ? JSON.parse(JSON.stringify(props.channel)) : createEmptyChannel());
const importInput = ref<HTMLInputElement>();

function addTask() { channel.value.tasks.push(createEmptyTask()); }
function removeTask(i: number) { channel.value.tasks.splice(i, 1); }
function addModel(ti: number) { if (!channel.value.tasks[ti].models) channel.value.tasks[ti].models = []; channel.value.tasks[ti].models!.push(createEmptyModel()); }
function removeModel(ti: number, mi: number) { channel.value.tasks[ti].models!.splice(mi, 1); }
function addParam(ti: number) { channel.value.tasks[ti].paramSchema.push(createEmptyParamField()); }
function removeParam(ti: number, pi: number) { channel.value.tasks[ti].paramSchema.splice(pi, 1); }
function addParamOption(ti: number, pi: number) { const p = channel.value.tasks[ti].paramSchema[pi]; if (!p.options) p.options = []; p.options.push({ label: "", value: "" }); }
function removeParamOption(ti: number, pi: number, oi: number) { channel.value.tasks[ti].paramSchema[pi].options!.splice(oi, 1); }
function addInputMapping() { channel.value.inputMapping.push(createEmptyInputMapping()); }
function removeInputMapping(i: number) { channel.value.inputMapping.splice(i, 1); }
function addOutputMapping() { channel.value.outputMapping.push(createEmptyOutputMapping()); }
function removeOutputMapping(i: number) { channel.value.outputMapping.splice(i, 1); }

function handleSave() {
  if (!channel.value.id || !channel.value.name || !channel.value.baseUrl) { alert("请填写渠道 ID、名称和 Base URL"); return; }
  emit("save", JSON.parse(JSON.stringify(channel.value)));
}

function exportJson() {
  const json = JSON.stringify(channel.value, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${channel.value.id || "channel"}.json`; a.click();
  URL.revokeObjectURL(url);
}

function triggerImport() { importInput.value?.click(); }
function handleImport(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { try { channel.value = JSON.parse(reader.result as string); isNew.value = false; } catch { alert("JSON 格式无效"); } };
  reader.readAsText(file); target.value = "";
}
</script>

<style scoped>
.channel-editor { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; display: flex; flex-direction: column; height: 100%; }
.editor-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex-shrink: 0; }
.editor-header h2 { margin: 0; font-size: 18px; font-weight: 600; }
.header-actions { display: flex; gap: 8px; }
.editor-body { padding: 24px; flex: 1; overflow-y: auto; }
.editor-section { margin-bottom: 32px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.section-title { margin: 0; font-size: 16px; font-weight: 600; color: #111827; }
.sub-title { margin: 0; font-size: 14px; font-weight: 500; color: #374151; }
.sub-section { margin-top: 12px; padding: 12px; background: #f9fafb; border-radius: 8px; }
.sub-section.compact { margin-top: 8px; padding: 8px; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.form-grid.compact { gap: 8px; }
.form-field { display: flex; flex-direction: column; gap: 4px; }
.form-field.full-width { grid-column: 1 / -1; }
.form-field label { font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
.form-field input, .form-field select { padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }

@media (max-width: 767px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-field input, .form-field select {
    font-size: 16px;
  }

  .editor-body {
    padding: 16px;
  }
}

.form-field input:disabled { background: #f3f4f6; color: #9ca3af; }
.toggle { display: flex; align-items: center; cursor: pointer; }
.toggle input { display: none; }
.toggle-slider { width: 36px; height: 20px; background: #d1d5db; border-radius: 10px; position: relative; transition: background 0.2s; }
.toggle-slider::before { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: transform 0.2s; }
.toggle input:checked + .toggle-slider { background: #3b82f6; }
.toggle input:checked + .toggle-slider::before { transform: translateX(16px); }
.task-block { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.task-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.task-index { font-weight: 600; color: #374151; }
.param-block { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-bottom: 8px; background: white; }
.param-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 13px; font-weight: 500; color: #4b5563; }
.model-list { display: flex; flex-direction: column; gap: 6px; }
.model-row { display: flex; gap: 8px; align-items: center; }
.model-input { flex: 1; padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; }
.mapping-list { display: flex; flex-direction: column; gap: 8px; }
.mapping-row { display: flex; gap: 8px; align-items: center; }
.mapping-input { flex: 1; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
.mapping-input-lg { flex: 2; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
.mapping-input-sm { width: 120px; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
.mapping-select { width: 120px; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
.mapping-arrow { color: #9ca3af; font-weight: bold; }
.btn-primary { padding: 8px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; }
.btn-primary:hover { background: #2563eb; }
.btn-secondary { padding: 8px 20px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; cursor: pointer; }
.btn-secondary:hover { background: #f9fafb; }
.btn-add { padding: 6px 14px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 6px; font-size: 13px; cursor: pointer; }
.btn-add:hover { background: #dbeafe; }
.btn-add-sm { padding: 4px 10px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 4px; font-size: 12px; cursor: pointer; }
.btn-remove { padding: 4px 10px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 4px; font-size: 12px; cursor: pointer; }
.btn-remove:hover { background: #fee2e2; }
.btn-remove-sm { width: 24px; height: 24px; background: #fee2e2; color: #dc2626; border: none; border-radius: 4px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.btn-remove-sm:hover { background: #fecaca; }
.json-actions { display: flex; gap: 12px; }
</style>
