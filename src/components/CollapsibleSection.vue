<template>
  <div class="collapsible-section" :class="{ collapsed: !isExpanded }">
    <div class="section-header" @click="toggle">
      <span class="section-title">{{ title }}</span>
      <span class="toggle-icon">&#9660;</span>
    </div>
    <div v-show="isExpanded" class="section-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(defineProps<{
  title: string;
  defaultExpanded?: boolean;
}>(), {
  defaultExpanded: true,
});

const isExpanded = ref(props.defaultExpanded);

function toggle() {
  isExpanded.value = !isExpanded.value;
}
</script>

<style scoped>
.collapsible-section {
  border-bottom: 1px solid #e5e7eb;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.section-header:hover {
  background: #f3f4f6;
}

.section-title {
  font-weight: 500;
  font-size: 14px;
  color: #111827;
}

.toggle-icon {
  font-size: 10px;
  color: #6b7280;
  transition: transform 0.2s;
}

.collapsible-section.collapsed .toggle-icon {
  transform: rotate(-90deg);
}

.section-content {
  padding: 0 20px 16px 20px;
}
</style>
