<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <form class="dialog" @submit.prevent="submit">
      <div class="dialog-header">
        <div>
          <div class="dialog-title">添加订阅源</div>
          <div class="dialog-subtitle">支持 RSS 和 Atom 格式</div>
        </div>
        <button class="icon-btn" type="button" @click="$emit('close')" aria-label="关闭">
          <X :size="18" />
        </button>
      </div>

      <label class="form-group">
        <span class="form-label">订阅源 URL *</span>
        <input
          v-model="url"
          class="form-input"
          type="url"
          placeholder="https://example.com/feed.xml"
          :disabled="isLoading"
          required
        />
      </label>

      <label class="form-group">
        <span class="form-label">自定义名称（可选）</span>
        <input
          v-model="title"
          class="form-input"
          type="text"
          placeholder="留空则使用订阅源标题"
          :disabled="isLoading"
        />
      </label>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="dialog-actions">
        <button class="btn" type="button" :disabled="isLoading" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" type="submit" :disabled="isLoading">
          {{ isLoading ? '添加中...' : '添加订阅' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'

defineProps<{
  isLoading: boolean
  error: string
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: { url: string; title?: string }]
}>()

const url = ref('')
const title = ref('')

const submit = () => {
  emit('submit', {
    url: url.value.trim(),
    title: title.value.trim() || undefined
  })
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
  width: min(440px, calc(100vw - 32px));
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
</style>
