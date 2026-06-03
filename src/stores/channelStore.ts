import { defineStore } from "pinia";
import { ref, computed } from "vue";
import ChannelRegistry from "@/core/ChannelRegistry";
import type {
  Channel,
  TaskType,
  ParamField,
} from "@/core/types";

export interface TaskSelectOption {
  type: TaskType;
  subType?: string;
  label: string;
}

export const useChannelStore = defineStore("channel", () => {
  const channels = ref<Channel[]>([]);
  const loading = ref(true);
  const currentChannelId = ref<string>("");
  const currentTaskType = ref<TaskType>("text_to_image");
  const currentTaskSubType = ref<string>("");

  const currentChannel = computed(() =>
    channels.value.find((c) => c.id === currentChannelId.value)
  );

  const currentTask = computed(() =>
    currentChannel.value?.tasks.find(
      (t) =>
        t.type === currentTaskType.value &&
        (t.subType || "") === currentTaskSubType.value
    )
  );

  const availableTasks = computed<TaskSelectOption[]>(() => {
    if (!currentChannel.value) return [];
    const seen = new Set<string>();
    return currentChannel.value.tasks
      .filter((t) => {
        const key = `${t.type}:${t.subType || ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((t) => ({
        type: t.type,
        subType: t.subType,
        label: t.label,
      }));
  });

  async function loadChannels(): Promise<void> {
    try {
      loading.value = true;
      await ChannelRegistry.loadAll();
      channels.value = ChannelRegistry.getEnabled();
      if (channels.value.length > 0 && !currentChannelId.value) {
        currentChannelId.value = channels.value[0].id;
      }
    } catch (error) {
      console.error("Failed to load channels:", error);
    } finally {
      loading.value = false;
    }
  }

  function setChannel(channelId: string): void {
    currentChannelId.value = channelId;
    const channel = channels.value.find((c) => c.id === channelId);
    currentTaskSubType.value = "";
    if (channel && channel.tasks.length > 0) {
      currentTaskType.value = channel.tasks[0].type;
    }
  }

  function setTask(taskType: TaskType, subType?: string): void {
    currentTaskType.value = taskType;
    currentTaskSubType.value = subType || "";
  }

  async function addChannel(channel: Channel): Promise<void> {
    await ChannelRegistry.add(channel);
    channels.value = ChannelRegistry.getEnabled();
  }

  async function updateChannel(channel: Channel): Promise<void> {
    await ChannelRegistry.update(channel);
    channels.value = ChannelRegistry.getEnabled();
  }

  async function removeChannel(id: string): Promise<void> {
    await ChannelRegistry.remove(id);
    channels.value = ChannelRegistry.getEnabled();
    if (currentChannelId.value === id) {
      currentChannelId.value = channels.value[0]?.id || "";
    }
  }

  async function importChannels(newChannels: Channel[]): Promise<void> {
    await ChannelRegistry.importMany(newChannels);
    channels.value = ChannelRegistry.getEnabled();
  }

  function shouldShowField(
    field: ParamField,
    currentValues: Record<string, unknown>
  ): boolean {
    if (!field.conditions) return true;

    return field.conditions.every((condition) => {
      const currentValue = currentValues[condition.when];

      if (condition.equals !== undefined) {
        return currentValue === condition.equals;
      }
      if (condition.notEquals !== undefined) {
        return currentValue !== condition.notEquals;
      }
      if (condition.in) {
        return condition.in.includes(currentValue as any);
      }
      if (condition.notIn) {
        return !condition.notIn.includes(currentValue as any);
      }
      if (condition.greaterThan !== undefined) {
        return (currentValue as number) > condition.greaterThan;
      }
      if (condition.lessThan !== undefined) {
        return (currentValue as number) < condition.lessThan;
      }

      return true;
    });
  }

  return {
    channels,
    loading,
    currentChannelId,
    currentTaskType,
    currentTaskSubType,
    currentChannel,
    currentTask,
    availableTasks,
    loadChannels,
    setChannel,
    setTask,
    addChannel,
    updateChannel,
    removeChannel,
    importChannels,
    shouldShowField,
  };
});
