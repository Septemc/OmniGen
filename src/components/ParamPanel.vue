<template>
  <div class="param-panel">
    <div class="param-fields">
      <div
        v-for="field in visibleFields"
        :key="field.key"
        class="param-field"
        :class="{ 'advanced-field': field.advanced }"
      >
        <label class="field-label">
          {{ field.label }}
          <span v-if="field.required" class="required">*</span>
        </label>

        <div class="field-input">
          <!-- string -->
          <input
            v-if="field.type === 'string'"
            :value="(studio.params[field.key] as string | number | undefined)"
            :type="field.key.includes('password') || field.key.includes('secret') ? 'password' : 'text'"
            :placeholder="field.placeholder"
            @input="updateField(field.key, ($event.target as HTMLInputElement).value)"
          />

          <!-- number -->
          <input
            v-else-if="field.type === 'number'"
            :value="(studio.params[field.key] as number | undefined)"
            type="number"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            :placeholder="field.placeholder"
            @input="updateField(field.key, Number(($event.target as HTMLInputElement).value))"
          />

          <!-- boolean -->
          <label v-else-if="field.type === 'boolean'" class="toggle-label">
            <input
              type="checkbox"
              :checked="!!studio.params[field.key]"
              @change="updateField(field.key, ($event.target as HTMLInputElement).checked)"
            />
            <span class="toggle-slider"></span>
          </label>

          <!-- select -->
          <select
            v-else-if="field.type === 'select'"
            :value="(studio.params[field.key] as string | number)"
            @change="updateField(field.key, ($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled v-if="!studio.params[field.key]">-- 请选择 --</option>
            <option
              v-for="opt in getOptions(field)"
              :key="String(opt.value)"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>

          <!-- slider -->
          <div v-else-if="field.type === 'slider'" class="slider-container">
            <input
              type="range"
              :value="(studio.params[field.key] as number) ?? field.default ?? field.min ?? 0"
              :min="field.min"
              :max="field.max"
              :step="field.step"
              @input="updateField(field.key, Number(($event.target as HTMLInputElement).value))"
            />
            <span class="slider-value">{{ studio.params[field.key] ?? field.default ?? 0 }}</span>
          </div>

          <!-- textarea -->
          <textarea
            v-else-if="field.type === 'textarea'"
            :value="(studio.params[field.key] as string)"
            :placeholder="field.placeholder"
            rows="3"
            @input="updateField(field.key, ($event.target as HTMLTextAreaElement).value)"
          ></textarea>

          <!-- json -->
          <textarea
            v-else-if="field.type === 'json'"
            :value="getJsonString(field.key)"
            :placeholder="'输入 JSON...'"
            rows="4"
            @input="updateJsonField(field.key, ($event.target as HTMLTextAreaElement).value)"
          ></textarea>

          <!-- tags -->
          <div v-else-if="field.type === 'tags'" class="tags-container">
            <div class="tags-list">
              <span v-for="tag in getTagValue(field.key)" :key="tag" class="tag">
                {{ tag }}
                <button type="button" @click="removeTag(field.key, tag)">×</button>
              </span>
            </div>
            <input
              v-if="tagInputVisible[field.key]"
              v-model="tagInputs[field.key]"
              @keyup.enter="addTag(field.key)"
              @blur="addTag(field.key)"
              :ref="(el: any) => { if (el) tagInputRefs[field.key] = el }"
            />
            <button v-else type="button" @click="showTagInput(field.key)" class="add-tag-btn">
              + 添加
            </button>
          </div>

          <!-- image (不可见参数，由 ImageUploader 组件独立处理) -->
          <div v-else-if="field.type === 'image'" class="image-hint">
            <span class="hint-text">请在上方上传图片区域操作</span>
          </div>
        </div>

        <p v-if="field.description" class="field-description">
          {{ field.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch, nextTick } from "vue";
import { useStudioStore } from "@/stores/studioStore";
import { useChannelStore } from "@/stores/channelStore";
import type { ParamField } from "@/core/types";

interface Props {
  fields: ParamField[];
  initialValues?: Record<string, unknown>;
}

const props = defineProps<Props>();
const emit = defineEmits<{ change: [values: Record<string, unknown>] }>();

const studio = useStudioStore();
const channelStore = useChannelStore();

const tagInputs = reactive<Record<string, string>>({});
const tagInputVisible = reactive<Record<string, boolean>>({});
const tagInputRefs: Record<string, HTMLInputElement> = {};

const visibleFields = computed(() => {
  return props.fields.filter((field) => {
    if (!field.conditions) return true;
    return channelStore.shouldShowField(field, studio.params);
  });
});

// 初始化默认值
watch(
  () => props.initialValues,
  (newVal) => {
    if (newVal) {
      for (const [key, val] of Object.entries(newVal)) {
        if (studio.params[key] === undefined) {
          studio.setParam(key, val);
        }
      }
    }
  },
  { immediate: true }
);

function getOptions(field: ParamField) {
  if (field.optionsFrom && field.optionsFrom.startsWith("@tasks[")) {
    const models = channelStore.currentTask?.models;
    return models?.map((m) => ({ label: m.name, value: m.id })) || field.options || [];
  }
  return field.options || [];
}

function updateField(key: string, value: unknown) {
  studio.setParam(key, value);
  emit("change", { ...studio.params });
}

function getJsonString(key: string): string {
  const val = studio.params[key];
  if (val === undefined || val === null) return "";
  if (typeof val === "string") return val;
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

function updateJsonField(key: string, raw: string) {
  try {
    const parsed = raw.trim() ? JSON.parse(raw) : undefined;
    studio.setParam(key, parsed);
  } catch {
    // JSON 格式无效时暂时不更新，保留旧值
  }
  emit("change", { ...studio.params });
}

function getTagValue(key: string): string[] {
  return (studio.params[key] as string[]) || [];
}

function showTagInput(key: string) {
  tagInputVisible[key] = true;
  nextTick(() => tagInputRefs[key]?.focus());
}

function addTag(key: string) {
  const inputVal = (tagInputs[key] || "").trim();
  if (inputVal) {
    const currentTags = (studio.params[key] as string[]) || [];
    if (!currentTags.includes(inputVal)) {
      studio.setParam(key, [...currentTags, inputVal]);
      emit("change", { ...studio.params });
    }
  }
  tagInputs[key] = "";
  tagInputVisible[key] = false;
}

function removeTag(key: string, tag: string) {
  const currentTags = (studio.params[key] as string[]) || [];
  studio.setParam(key, currentTags.filter((t) => t !== tag));
  emit("change", { ...studio.params });
}
</script>

<style scoped>
.param-panel {
  padding: 16px 0;
}

.param-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.param-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-weight: 500;
  font-size: 14px;
  color: #1f2937;
}

.required {
  color: #ef4444;
}

.field-input {
  width: 100%;
}

.field-input input[type="text"],
.field-input input[type="number"],
.field-input select,
.field-input textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.field-input input[type="text"],
.field-input input[type="number"],
.field-input select,
.field-input button {
  min-height: 44px;
}

@media (max-width: 767px) {
  .field-input input[type="text"],
  .field-input input[type="number"],
  .field-input select,
  .field-input textarea {
    font-size: 16px;
  }
}

.field-input textarea {
  resize: vertical;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.toggle-label input[type="checkbox"] {
  display: none;
}

.toggle-slider {
  width: 40px;
  height: 24px;
  background: #d1d5db;
  border-radius: 12px;
  position: relative;
  transition: background 0.2s;
}

.toggle-slider::before {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle-label input[type="checkbox"]:checked + .toggle-slider {
  background: #3b82f6;
}

.toggle-label input[type="checkbox"]:checked + .toggle-slider::before {
  transform: translateX(16px);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-container input[type="range"] {
  flex: 1;
  cursor: pointer;
}

.slider-value {
  min-width: 40px;
  text-align: right;
  font-weight: 500;
}

.tags-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #e0e7ff;
  color: #3730a3;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.tag button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: inherit;
}

.add-tag-btn {
  background: #f3f4f6;
  border: 1px dashed #d1d5db;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  color: #4b5563;
}

.image-hint {
  padding: 8px 12px;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
}

.hint-text {
  font-size: 13px;
  color: #9ca3af;
}

.field-description {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}
</style>
