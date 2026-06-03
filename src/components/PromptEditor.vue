<template>
  <div class="prompt-editor">
    <div class="prompt-section">
      <label class="section-label">正向提示词</label>
      <textarea
        v-model="prompt"
        class="prompt-input"
        placeholder="描述你想要生成的图像..."
        rows="4"
      ></textarea>
    </div>

    <div class="negative-section">
      <label class="section-label">负向提示词</label>
      <textarea
        v-model="negativePrompt"
        class="prompt-input"
        placeholder="描述你不想要出现的内容..."
        rows="2"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useStudioStore } from "@/stores/studioStore";

const studio = useStudioStore();

const prompt = computed({
  get: () => studio.prompt,
  set: (val) => {
    studio.prompt = val;
  },
});

const negativePrompt = computed({
  get: () => studio.negativePrompt,
  set: (val) => {
    studio.negativePrompt = val;
  },
});
</script>

<style scoped>
.prompt-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prompt-section,
.negative-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-weight: 500;
  font-size: 14px;
  color: #1f2937;
}

.prompt-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  font-family: inherit;
}

.prompt-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
