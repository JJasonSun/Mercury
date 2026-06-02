<template>
  <div class="modal-backdrop">
    <form class="dialog" @submit.prevent="submit">
      <div class="dialog-header">
        <div>
          <div class="dialog-title">编辑订阅源</div>
          <div class="dialog-subtitle">修改显示名称或删除订阅源</div>
        </div>
        <button class="icon-btn" type="button" @click="requestClose" aria-label="关闭">
          <X :size="18" />
        </button>
      </div>

      <label class="form-group">
        <span class="form-label">订阅源 URL</span>
        <input class="form-input" type="text" :value="feed.url" disabled />
        <span class="form-hint">URL 不可修改</span>
      </label>

      <label class="form-group">
        <span class="form-label">自定义名称</span>
        <input
          v-model="title"
          class="form-input"
          type="text"
          placeholder="留空则使用订阅源标题"
          :disabled="isLoading"
        />
        <span class="form-hint">源站原始名称：{{ sourceTitle }}</span>
      </label>

      <label class="form-group">
        <span class="form-label">刷新频率</span>
        <select v-model.number="refreshIntervalMinutes" class="form-input" :disabled="isLoading">
          <option v-for="option in refreshOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <span class="form-hint">设置后主进程会按频率自动刷新，仍可随时手动刷新。</span>
      </label>

      <button
        v-if="hasCustomTitle"
        class="btn btn-secondary"
        type="button"
        :disabled="isLoading"
        @click="$emit('reset-title')"
      >
        恢复源站原始名称
      </button>

      <div class="danger-zone">
        <div class="danger-title">
          <AlertTriangle :size="16" />
          <span>危险操作</span>
        </div>
        <div class="danger-desc">
          删除订阅源将同时删除该源下 {{ feed.articleCount ?? 0 }} 篇文章数据，此操作不可恢复。
        </div>
        <button class="btn btn-danger" type="button" :disabled="isLoading" @click="$emit('delete')">
          删除订阅源
        </button>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="dialog-actions">
        <button class="btn" type="button" :disabled="isLoading" @click="requestClose">取消</button>
        <button class="btn btn-primary" type="submit" :disabled="isLoading">
          {{ isLoading ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AlertTriangle, X } from 'lucide-vue-next'
import type { Feed } from '../../main/types'

const props = defineProps<{
  feed: Feed
  isLoading: boolean
  error: string
}>()

const emit = defineEmits<{
  close: []
  submit: [updates: { title: string; refreshIntervalMinutes: number }]
  'reset-title': []
  delete: []
}>()

const title = ref(props.feed.title)
const refreshIntervalMinutes = ref(props.feed.refreshIntervalMinutes ?? 0)

const refreshOptions = [
  { label: '手动刷新', value: 0 },
  { label: '每 15 分钟', value: 15 },
  { label: '每 30 分钟', value: 30 },
  { label: '每 1 小时', value: 60 },
  { label: '每 6 小时', value: 360 },
  { label: '每 12 小时', value: 720 },
  { label: '每天', value: 1440 }
]

const sourceTitle = computed(() => props.feed.sourceTitle || props.feed.title)
const hasCustomTitle = computed(() => Boolean(props.feed.customTitle))

watch(
  () => props.feed,
  (feed) => {
    title.value = feed.title
    refreshIntervalMinutes.value = feed.refreshIntervalMinutes ?? 0
  }
)

const submit = () => {
  emit('submit', {
    title: title.value.trim(),
    refreshIntervalMinutes: refreshIntervalMinutes.value
  })
}

const requestClose = () => {
  if (props.isLoading) {
    return
  }

  const titleChanged = title.value.trim() !== props.feed.title.trim()
  const intervalChanged = refreshIntervalMinutes.value !== (props.feed.refreshIntervalMinutes ?? 0)
  if (titleChanged || intervalChanged) {
    const shouldClose = confirm('当前修改尚未保存，确定放弃修改吗？')
    if (!shouldClose) {
      return
    }
  }

  emit('close')
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 42%);
}

.dialog {
  width: min(480px, calc(100vw - 32px));
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 18px 60px rgb(0 0 0 / 22%);
  padding: 24px;
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.dialog-title {
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.dialog-subtitle {
  margin-top: 6px;
  color: #909399;
  font-size: 13px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #606266;
  cursor: pointer;
}

.icon-btn:hover {
  background: #f5f7fa;
  color: #303133;
}

.form-group {
  display: block;
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #303133;
  font-size: 13px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  color: #303133;
  font-size: 14px;
  outline: none;
}

.form-input:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgb(64 158 255 / 12%);
}

.form-input:disabled {
  background: #f5f7fa;
  color: #909399;
}

.form-hint {
  display: block;
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
}

.danger-zone {
  margin: 18px 0;
  padding: 14px;
  border: 1px solid #fde2e2;
  border-radius: 6px;
  background: #fffafa;
}

.danger-title {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #c45656;
  font-size: 14px;
  font-weight: 600;
}

.danger-desc {
  margin: 8px 0 12px;
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
}

.error-message {
  margin-bottom: 16px;
  padding: 10px 12px;
  border: 1px solid #fde2e2;
  border-radius: 4px;
  background: #fef0f0;
  color: #c45656;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  padding: 9px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #ffffff;
  color: #303133;
  font-size: 14px;
  cursor: pointer;
}

.btn:hover:not(:disabled) {
  border-color: #409eff;
  color: #409eff;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.btn-primary {
  border-color: #409eff;
  background: #409eff;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background: #66b1ff;
  color: #ffffff;
}

.btn-secondary {
  margin-top: -4px;
  margin-bottom: 12px;
}

.btn-danger {
  border-color: #f56c6c;
  background: #f56c6c;
  color: #ffffff;
}

.btn-danger:hover:not(:disabled) {
  background: #f78989;
  color: #ffffff;
}
</style>
