<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="dialog">
      <div class="dialog-header">
        <div>
          <div class="dialog-title">导入 OPML 订阅源</div>
          <div class="dialog-subtitle">从其他 RSS 阅读器迁移订阅源</div>
        </div>
        <button class="icon-btn" type="button" @click="$emit('close')" aria-label="关闭">
          <X :size="18" />
        </button>
      </div>

      <button
        class="upload-area"
        :class="{ dragging: isDragging }"
        type="button"
        :disabled="isLoading"
        @click="$emit('select-file')"
        @dragenter.prevent="isDragging = true"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <Upload :size="28" />
        <span>点击选择或拖拽 OPML 文件到这里</span>
        <small>支持 .opml 和 .xml 文件</small>
      </button>

      <div v-if="filePath" class="file-path">{{ filePath }}</div>

      <div v-if="feeds.length > 0" class="preview">
        <div class="preview-header">
          <div>
            <div class="preview-title">预览订阅源</div>
            <div class="preview-count">共 {{ feeds.length }} 个订阅源，已选择 {{ selectedUrls.length }} 个</div>
          </div>
          <label class="select-all">
            <input type="checkbox" :checked="isAllSelected" @change="toggleAll" />
            <span>全选</span>
          </label>
        </div>

        <div class="feed-preview-list">
          <label v-for="(feed, index) in feeds" :key="`${feed.url}-${index}`" class="feed-preview-item">
            <input v-model="selectedUrls" type="checkbox" :value="feed.url" :disabled="!isSelectable(feed)" />
            <span>
              <strong>
                {{ feed.title || feed.url }}
                <em class="status-badge" :class="statusClass(feed)">{{ statusLabelForFeed(feed) }}</em>
              </strong>
              <small>{{ feed.url }}</small>
              <small v-if="feed.message" class="feed-message">{{ feed.message }}</small>
            </span>
          </label>
        </div>
      </div>

      <div v-if="progress.length > 0" class="import-progress">
        <div class="progress-header">
          <div>
            <div class="preview-title">导入进度</div>
            <div class="preview-count">{{ finishedCount }} / {{ progress.length }} 个已处理</div>
          </div>
          <div class="progress-bar" aria-hidden="true">
            <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
        <div class="progress-list">
          <div v-for="item in progress" :key="item.url" class="progress-item" :class="item.status">
            <span class="progress-dot"></span>
            <span class="progress-main">
              <strong>{{ item.title || item.url }}</strong>
              <small>{{ item.message || statusLabel(item.status) }}</small>
            </span>
          </div>
        </div>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="dialog-actions">
        <button class="btn" type="button" :disabled="isLoading" @click="$emit('close')">取消</button>
        <button
          class="btn btn-primary"
          type="button"
          :disabled="isLoading || selectedUrls.length === 0"
          @click="submit"
        >
          {{ isLoading ? '导入中...' : '导入选中的订阅源' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Upload, X } from 'lucide-vue-next'
import type { OpmlFeed } from '../../main/types'

type OpmlImportProgressItem = {
  title: string
  url: string
  status: 'pending' | 'importing' | 'success' | 'failed'
  message?: string
}

const props = defineProps<{
  filePath: string
  feeds: OpmlFeed[]
  progress: OpmlImportProgressItem[]
  isLoading: boolean
  error: string
}>()

const emit = defineEmits<{
  close: []
  'select-file': []
  'file-dropped': [file: File]
  import: [feeds: OpmlFeed[]]
}>()

const selectedUrls = ref<string[]>([])
const isDragging = ref(false)

const selectableFeeds = computed(() => props.feeds.filter((feed) => isSelectable(feed)))
const isAllSelected = computed(
  () => selectableFeeds.value.length > 0 && selectedUrls.value.length === selectableFeeds.value.length
)
const finishedCount = computed(
  () => props.progress.filter((item) => item.status === 'success' || item.status === 'failed').length
)
const progressPercent = computed(() =>
  props.progress.length === 0 ? 0 : Math.round((finishedCount.value / props.progress.length) * 100)
)

watch(
  () => props.feeds,
  (feeds) => {
    selectedUrls.value = feeds.filter((feed) => isSelectable(feed)).map((feed) => feed.url)
  }
)

const toggleAll = () => {
  selectedUrls.value = isAllSelected.value ? [] : selectableFeeds.value.map((feed) => feed.url)
}

const submit = () => {
  const selected = new Set(selectedUrls.value)
  emit(
    'import',
    props.feeds
      .filter((feed) => selected.has(feed.url) && isSelectable(feed))
      .map((feed) => ({
        title: String(feed.title || feed.url),
        url: String(feed.url)
      }))
  )
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (props.isLoading) {
    return
  }

  const file = event.dataTransfer?.files?.[0]
  if (!file) {
    return
  }

  emit('file-dropped', file)
}

const statusLabel = (status: OpmlImportProgressItem['status']) => {
  if (status === 'pending') {
    return '等待导入'
  }
  if (status === 'importing') {
    return '导入中'
  }
  if (status === 'success') {
    return '已导入'
  }
  return '导入失败'
}

const isSelectable = (feed: OpmlFeed) => feed.status !== 'invalid' && feed.status !== 'duplicate'

const statusLabelForFeed = (feed: OpmlFeed) => {
  if (feed.status === 'existing') {
    return '已存在'
  }
  if (feed.status === 'duplicate') {
    return '重复'
  }
  if (feed.status === 'invalid') {
    return '无效 URL'
  }
  return '新增'
}

const statusClass = (feed: OpmlFeed) => ({
  existing: feed.status === 'existing',
  duplicate: feed.status === 'duplicate',
  invalid: feed.status === 'invalid',
  fresh: !feed.status || feed.status === 'new'
})
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
  width: min(620px, calc(100vw - 32px));
  max-height: calc(100vh - 64px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
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

.upload-area {
  width: 100%;
  min-height: 112px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
  color: #606266;
  cursor: pointer;
}

.upload-area:hover:not(:disabled) {
  border-color: #409eff;
  color: #409eff;
}

.upload-area.dragging {
  border-color: #409eff;
  background: #ecf5ff;
  color: #409eff;
}

.upload-area:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.upload-area small {
  color: #909399;
  font-size: 12px;
}

.file-path {
  margin-top: 10px;
  color: #606266;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.preview {
  min-height: 0;
  margin-top: 18px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.preview-title {
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.preview-count {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 13px;
}

.feed-preview-list {
  max-height: 260px;
  overflow-y: auto;
}

.feed-preview-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
}

.feed-preview-item:last-child {
  border-bottom: none;
}

.feed-preview-item strong,
.feed-preview-item small {
  display: block;
}

.feed-preview-item strong {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
  font-size: 13px;
}

.feed-preview-item small {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.feed-preview-item input:disabled + span {
  opacity: 0.62;
}

.status-badge {
  flex: 0 0 auto;
  padding: 1px 6px;
  border-radius: 4px;
  font-style: normal;
  font-size: 11px;
  font-weight: 500;
  background: #ecf5ff;
  color: #409eff;
}

.status-badge.existing {
  background: #f4f4f5;
  color: #606266;
}

.status-badge.duplicate,
.status-badge.invalid {
  background: #fef0f0;
  color: #c45656;
}

.feed-message {
  color: #c45656;
}

.import-progress {
  min-height: 0;
  margin-top: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
}

.progress-header {
  padding: 12px 14px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.progress-bar {
  height: 6px;
  margin-top: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #e4e7ed;
}

.progress-bar-fill {
  height: 100%;
  background: #409eff;
  transition: width 0.2s ease;
}

.progress-list {
  max-height: 160px;
  overflow-y: auto;
}

.progress-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
}

.progress-item:last-child {
  border-bottom: none;
}

.progress-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  margin-top: 5px;
  border-radius: 999px;
  background: #c0c4cc;
}

.progress-item.importing .progress-dot {
  background: #409eff;
}

.progress-item.success .progress-dot {
  background: #67c23a;
}

.progress-item.failed .progress-dot {
  background: #f56c6c;
}

.progress-main {
  min-width: 0;
}

.progress-main strong,
.progress-main small {
  display: block;
}

.progress-main strong {
  color: #303133;
  font-size: 13px;
}

.progress-main small {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.progress-item.failed .progress-main small {
  color: #c45656;
}

.error-message {
  white-space: pre-line;
  margin-top: 16px;
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
</style>
