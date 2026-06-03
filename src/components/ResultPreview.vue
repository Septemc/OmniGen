<template>
  <div class="result-preview">
    <div v-if="status === 'idle'" class="idle-state">
      <div class="icon">🎨</div>
      <p>选择参数后点击执行生成</p>
    </div>

    <div v-else-if="status === 'running'" class="loading-state">
      <div class="spinner"></div>
      <p>正在生成图像...</p>
    </div>

    <div v-else-if="status === 'success'" class="success-state">
      <div v-if="imageAssets.length > 0" class="result-images">
        <div v-for="asset in imageAssets" :key="asset.id" class="image-card">
          <img :src="asset.url || `data:${asset.mimeType || 'image/png'};base64,${asset.b64}`" alt="生成结果" class="result-image" />
          <div class="image-label">{{ asset.label || (asset.type === 'mask' ? '蒙版' : '图片') }}</div>
        </div>
      </div>

      <div v-if="jsonAssets.length > 0" class="result-json">
        <div v-for="asset in jsonAssets" :key="asset.id" class="json-card">
          <h4>{{ asset.label || '检测结果' }}</h4>
          <pre class="json-content">{{ JSON.stringify(asset.raw, null, 2) }}</pre>
        </div>
      </div>

      <div v-if="durationMs" class="result-info">
        <span class="info-label">耗时：</span>
        <span class="info-value">{{ (durationMs / 1000).toFixed(2) }}s</span>
      </div>
    </div>

    <div v-else-if="status === 'failed'" class="error-state">
      <div class="error-icon">❌</div>
      <div class="error-message">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useStudioStore } from "@/stores/studioStore";

const studio = useStudioStore();

const status = computed(() => studio.status);
const durationMs = computed(() => studio.durationMs);
const errorMessage = computed(() => studio.errorMessage);

const imageAssets = computed(() =>
  studio.resultAssets.filter((a) => a.type === "image" || a.type === "mask" || a.type === "layer")
);

const jsonAssets = computed(() =>
  studio.resultAssets.filter((a) => a.type === "json" || a.type === "box")
);
</script>

<style scoped>
.result-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
  background: #f9fafb;
  overflow: hidden;
}

.idle-state, .loading-state, .error-state {
  text-align: center;
  color: #6b7280;
}

.idle-state .icon { font-size: 64px; margin-bottom: 16px; }

.spinner {
  width: 48px; height: 48px;
  border: 4px solid #e5e7eb; border-top-color: #3b82f6;
  border-radius: 50%; animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin { to { transform: rotate(360deg); } }

.success-state { width: 100%; }

.result-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px; width: 100%; max-height: 100%; overflow: hidden;
}

.image-card { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }

.result-image {
  width: 100%; height: auto; display: block;
}

.image-label {
  padding: 6px 12px; font-size: 12px; color: #6b7280;
  background: #f9fafb; border-top: 1px solid #e5e7eb;
}

.result-json { margin-bottom: 16px; width: 100%; }

.json-card {
  background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;
}

.json-card h4 {
  margin: 0; padding: 10px 16px; font-size: 14px;
  background: #f9fafb; border-bottom: 1px solid #e5e7eb;
}

.json-content {
  padding: 16px; margin: 0; font-size: 12px; line-height: 1.6;
  overflow-x: auto; max-height: 400px; overflow-y: auto;
  background: #1f2937; color: #a5f3fc;
}

.result-info {
  display: flex; gap: 8px; color: #4b5563; font-size: 14px;
}

.error-state { color: #ef4444; }
.error-icon { font-size: 64px; margin-bottom: 16px; }
.error-message { max-width: 512px; line-height: 1.5; }
</style>
