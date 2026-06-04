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
          <button
            class="download-btn"
            :class="{ loading: downloadingIds.has(asset.id) }"
            :disabled="downloadingIds.has(asset.id)"
            @click="downloadAsset(asset)"
          >
            <span class="download-icon">{{ downloadingIds.has(asset.id) ? '⏳' : '⬇' }}</span>
            <span class="download-text">{{ downloadingIds.has(asset.id) ? '下载中...' : '下载原图' }}</span>
          </button>
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
import { computed, ref } from "vue";
import { useStudioStore } from "@/stores/studioStore";
import FileSaver from "@/core/FileSaver";
import type { NormalizedAsset } from "@/core/types";

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

const downloadingIds = ref(new Set<string>());

function generateDownloadFilename(): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0].replace(/:/g, "-");
  return `${date}_${time}_generated.png`;
}

async function downloadAsset(asset: NormalizedAsset) {
  if (downloadingIds.value.has(asset.id)) return;
  downloadingIds.value = new Set([...downloadingIds.value, asset.id]);

  try {
    let blob: Blob | undefined;

    if (asset.blob) {
      blob = asset.blob;
    } else if (asset.url?.startsWith("blob:")) {
      const response = await fetch(asset.url);
      blob = await response.blob();
    } else if (asset.b64) {
      blob = FileSaver.b64ToBlob(
        asset.b64.startsWith("data:") ? asset.b64.split(",")[1] : asset.b64,
        asset.mimeType || "image/png"
      );
    } else if (asset.url) {
      const response = await fetch(asset.url);
      blob = await response.blob();
    }

    if (!blob) return;

    const filename = generateDownloadFilename();
    FileSaver.triggerDownload(URL.createObjectURL(blob), filename);
  } catch (error) {
    console.error("Download failed:", error);
  } finally {
    const next = new Set(downloadingIds.value);
    next.delete(asset.id);
    downloadingIds.value = next;
  }
}
</script>

<style scoped>
.result-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 16px;
  overflow-y: auto;
}

.idle-state,
.loading-state,
.error-state {
  text-align: center;
  color: #6b7280;
}

.idle-state .icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state .error-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.error-state .error-message {
  color: #ef4444;
  font-size: 14px;
  max-width: 400px;
  word-break: break-word;
}

.success-state {
  width: 100%;
}

.result-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.image-card {
  position: relative;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.image-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.result-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
  background: #f3f4f6;
  min-height: 200px;
}

.download-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: calc(100% - 16px);
  margin: 8px auto;
  padding: 10px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.download-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.download-btn:active:not(:disabled) {
  transform: translateY(0);
}

.download-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.download-btn.loading {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
}

.download-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.download-text {
  white-space: nowrap;
}

.image-label {
  padding: 6px 12px;
  font-size: 12px;
  color: #6b7280;
  text-align: center;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.result-json {
  width: 100%;
  margin-bottom: 16px;
}

.json-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 8px;
}

.json-card h4 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #374151;
}

.json-content {
  margin: 0;
  padding: 10px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.result-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  font-size: 14px;
  width: fit-content;
}

.info-label {
  color: #6b7280;
}

.info-value {
  color: #16a34a;
  font-weight: 600;
}

@media (max-width: 767px) {
  .result-preview {
    padding: 12px;
  }

  .result-images {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .download-btn {
    padding: 12px 16px;
    font-size: 15px;
  }
}
</style>
