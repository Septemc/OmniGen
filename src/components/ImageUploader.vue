<template>
  <div class="image-uploader">
    <div v-if="images.length === 0" class="drop-zone" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
      <div class="upload-icon">📷</div>
      <p>点击或拖拽上传图片</p>
      <input type="file" ref="fileInput" accept="image/*" multiple @change="handleFileSelect" style="display: none" />
    </div>

    <div v-else class="image-list">
      <div v-for="img in images" :key="img.id" class="image-item">
        <img :src="img.data" :alt="img.name" class="preview" />
        <div class="image-info">
          <span class="name">{{ img.name }}</span>
          <select v-if="imageRoles" v-model="img.role" class="role-select">
            <option v-for="role in imageRoles" :key="role" :value="role">{{ role }}</option>
          </select>
        </div>
        <button type="button" class="remove-btn" @click="removeImage(img.id)">×</button>
      </div>
    </div>

    <div v-if="images.length > 0" class="add-more">
      <button type="button" @click="triggerUpload" class="add-btn">+ 添加图片</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useStudioStore } from "@/stores/studioStore";

interface Props {
  imageRoles?: string[];
  maxCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxCount: 1,
});

const emit = defineEmits(["images-change"]);

const studio = useStudioStore();
const fileInput = ref<HTMLInputElement>();

const images = computed(() => studio.inputImages);

function triggerUpload() {
  fileInput.value?.click();
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    addFiles(target.files);
    target.value = "";
  }
}

function handleDrop(event: DragEvent) {
  const files = event.dataTransfer?.files;
  if (files) {
    addFiles(files);
  }
}

async function addFiles(files: FileList) {
  const remaining = (props.maxCount || 1) - images.value.length;
  for (let i = 0; i < Math.min(files.length, remaining); i++) {
    const file = files[i];
    const dataUrl = await fileToDataUrl(file);
    studio.addInputImage({
      id: crypto.randomUUID(),
      data: dataUrl,
      role: props.imageRoles?.[0] || "image",
      name: file.name,
    });
  }
  emit("images-change", images.value);
}

function removeImage(id: string) {
  studio.removeInputImage(id);
  emit("images-change", images.value);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
</script>

<style scoped>
.image-uploader {
  width: 100%;
}

.drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.drop-zone:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.drop-zone p {
  margin: 0;
  color: #6b7280;
}

.image-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.image-item {
  position: relative;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.image-item .preview {
  width: 100%;
  height: 96px;
  object-fit: cover;
}

.image-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: white;
}

.image-info .name {
  font-size: 12px;
  color: #4b5563;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-select {
  font-size: 12px;
  padding: 2px 4px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-more {
  text-align: left;
}

.add-btn {
  padding: 8px 16px;
  border: 1px dashed #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  color: #374151;
  font-size: 14px;
}
</style>
