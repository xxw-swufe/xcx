<template>
  <view class="upload-page">
    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="18" color="#374151" />
      </view>
      <text class="nav-title">文件上传</text>
      <view class="more-btn">
        <uni-icons type="more-filled" size="20" color="#9ca3af" />
      </view>
    </view>

    <scroll-view class="content-area" scroll-y>
      <view class="content-inner">
      <view class="drop-zone" @click="chooseFile">
        <view class="drop-icon">
          <uni-icons type="cloud-upload" size="48" color="#6d5dfc" />
        </view>
        <text class="drop-text">点击上传文件</text>
        <text class="drop-hint">支持 PDF、JPG、PNG、DOCX 等常见格式</text>
      </view>

      <view class="uploaded-section">
        <view class="section-header">
          <text class="section-label">已上传文件（{{ uploadedFiles.length }}）</text>
          <view class="section-right">
            <view class="divider-line"></view>
            <uni-icons type="right" size="14" color="#9ca3af" />
          </view>
        </view>

        <view class="file-list">
          <view class="file-item" v-for="(file, idx) in uploadedFiles" :key="idx">
            <view class="file-thumb" :class="{ 'thumb-image': file.isImage }">
              <image v-if="file.isImage" class="thumb-img" :src="file.thumb" mode="aspectFill" />
              <view v-else class="thumb-doc">
                <uni-icons type="paperclip" size="22" color="#3b82f6" />
              </view>
            </view>

            <view class="file-info">
              <text class="file-name">{{ file.name }}</text>
              <text class="file-size">{{ file.size }}</text>
              <view v-if="file.progress < 100" class="progress-bar">
                <view class="progress-fill" :style="{ width: file.progress + '%' }"></view>
              </view>
            </view>

            <view v-if="file.progress >= 100" class="file-status done">
              <uni-icons type="checkmarkempty" size="20" color="#22c55e" />
            </view>
            <view v-else class="file-status">
              <view class="progress-text">{{ file.progress }}%</view>
              <view class="close-btn" @click="removeFile(idx)">
                <uni-icons type="closeempty" size="14" color="#9ca3af" />
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="upload-notice">
        <view class="notice-header">
          <view class="info-icon">
            <uni-icons type="info" size="14" color="#FFFFFF" />
          </view>
          <text class="notice-title">上传说明</text>
        </view>
        <text class="notice-text">单个文件建议不超过 50MB，图片和 PDF 格式优先。</text>
      </view>
      </view>
    </scroll-view>

    <view class="bottom-area">
      <view class="submit-btn" @click="handleComplete">
        <text class="submit-text">完成上传</text>
        <uni-icons type="arrowdown" size="16" color="#FFFFFF" />
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      uploadedFiles: [],
      uploading: false
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    chooseFile() {
      if (typeof uni.chooseMessageFile === 'function') {
        uni.chooseMessageFile({
          count: 1,
          type: 'file',
          success: (res) => {
            const file = (res.tempFiles && res.tempFiles[0]) || {}
            const name = file.name || (file.path ? file.path.split('/').pop() : '文件')
            const path = file.path || file.tempFilePath || ''
            this.addAndUploadFile({
              name,
              path,
              size: file.size || 0
            })
          },
          fail: () => {
            uni.showToast({ title: '未能选择文件', icon: 'none' })
          }
        })
        return
      }

      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const file = (res.tempFiles && res.tempFiles[0]) || {}
          const filePath = file.path || file.tempFilePath || (res.tempFilePaths && res.tempFilePaths[0]) || ''
          const name = filePath ? filePath.split('/').pop() : '文件.jpg'
          this.addAndUploadFile({
            name,
            path: filePath,
            size: file.size || 0
          })
        }
      })
    },
    formatFileSize(size) {
      return size ? (size / 1024 / 1024).toFixed(1) + ' MB' : '未知大小'
    },
    getCloudPath(fileName) {
      const safeName = String(fileName || 'file').replace(/[\\/:*?"<>|#%&{}$!'@+=`]/g, '_')
      return `chat-uploads/${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}`
    },
    addAndUploadFile(file) {
      const name = file.name || '文件'
      const path = file.path || ''
      const isImage = /\.(png|jpe?g|gif|bmp|webp)$/i.test(name)
      const index = this.uploadedFiles.length

      this.uploadedFiles.push({
        name,
        size: this.formatFileSize(file.size),
        isImage,
        thumb: isImage ? path : '',
        progress: 0,
        status: 'uploading',
        fileID: ''
      })

      if (!path) {
        this.$set(this.uploadedFiles, index, {
          ...this.uploadedFiles[index],
          status: 'failed'
        })
        uni.showToast({ title: '文件路径无效', icon: 'none' })
        return
      }

      this.uploading = true
      uniCloud.uploadFile({
        filePath: path,
        cloudPath: this.getCloudPath(name),
        onUploadProgress: (event) => {
          const progress = event && event.total ? Math.round((event.loaded / event.total) * 100) : 0
          const current = this.uploadedFiles[index]
          if (current) {
            this.$set(this.uploadedFiles, index, {
              ...current,
              progress
            })
          }
        }
      }).then(async (res) => {
        const fileID = res.fileID || ''
        let fileUrl = fileID

        if (fileID && uniCloud.getTempFileURL) {
          try {
            const urlRes = await uniCloud.getTempFileURL({ fileList: [fileID] })
            const fileItem = urlRes && urlRes.fileList && urlRes.fileList[0]
            fileUrl = (fileItem && (fileItem.tempFileURL || fileItem.download_url)) || fileID
          } catch (error) {
            console.warn('get temp file url failed', error)
          }
        }

        const current = this.uploadedFiles[index]
        if (current) {
          this.$set(this.uploadedFiles, index, {
            ...current,
            progress: 100,
            status: 'done',
            fileID,
            fileUrl
          })
        }
        uni.showToast({ title: '上传成功', icon: 'success' })
      }).catch((error) => {
        console.error('upload file failed', error)
        const current = this.uploadedFiles[index]
        if (current) {
          this.$set(this.uploadedFiles, index, {
            ...current,
            status: 'failed'
          })
        }
        uni.showToast({ title: '上传失败', icon: 'none' })
      }).finally(() => {
        this.uploading = this.uploadedFiles.some((item) => item.status === 'uploading')
      })
    },
    removeFile(idx) {
      this.uploadedFiles.splice(idx, 1)
    },
    handleComplete() {
      if (this.uploading) {
        uni.showToast({ title: '文件上传中', icon: 'none' })
        return
      }

      if (this.uploadedFiles.length > 0) {
        // 将已上传的文件列表通过事件总线发送回聊天页面
        uni.$emit('upload-files-completed', this.uploadedFiles.map(file => ({
          id: `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: file.isImage ? 'image' : 'file',
          title: file.name,
          subtitle: '已上传',
          fileUrl: file.fileUrl,
          fileID: file.fileID,
          fileSize: 0 // 可以在 addAndUploadFile 中记录原始大小
        })))
      }

      uni.showToast({ title: '已同步至聊天', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 800)
    }
  }
}
</script>

<style lang="scss" scoped>
.upload-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f4fa;
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--status-bar-height, 44px) + 16rpx) 24rpx 16rpx;
  background: #ffffff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.back-btn,
.more-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 14rpx;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #111827;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  box-sizing: border-box;
}

.content-inner {
  padding: 72rpx 24rpx 40rpx;
  box-sizing: border-box;
}

.drop-zone {
  background: #ffffff;
  border: 3rpx dashed #c4b5fd;
  border-radius: 24rpx;
  padding: 56rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
}

.drop-icon {
  margin-bottom: 20rpx;
}

.drop-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8rpx;
}

.drop-hint {
  font-size: 22rpx;
  color: #9ca3af;
}

.uploaded-section,
.upload-notice {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
  margin-bottom: 24rpx;
}

.section-header,
.notice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-label,
.notice-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #1e293b;
}

.section-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.divider-line {
  width: 40rpx;
  height: 2rpx;
  background: #e5e7eb;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
}

.file-item:last-child {
  border-bottom: none;
}

.file-thumb {
  width: 80rpx;
  height: 80rpx;
  border-radius: 12rpx;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
  overflow: hidden;
}

.thumb-image {
  background: #e5e7eb;
}

.thumb-img {
  width: 80rpx;
  height: 80rpx;
}

.thumb-doc {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  border-radius: 12rpx;
}

.file-info {
  flex: 1;
}

.file-name {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4rpx;
}

.file-size,
.notice-text {
  display: block;
  font-size: 22rpx;
  color: #9ca3af;
}

.progress-bar {
  height: 6rpx;
  background: #e5e7eb;
  border-radius: 3rpx;
  margin-top: 10rpx;
  overflow: hidden;
}

.progress-fill {
  height: 6rpx;
  border-radius: 3rpx;
  background: linear-gradient(90deg, #3b82f6, #6d5dfc);
  transition: width 0.3s;
}

.file-status {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.file-status.done {
  margin-left: 12rpx;
}

.progress-text {
  font-size: 22rpx;
  color: #9ca3af;
  font-weight: 600;
}

.close-btn {
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-icon {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12rpx;
}

.bottom-area {
  padding: 16rpx 24rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 16rpx);
  background: #ffffff;
  border-top: 1rpx solid #e5e7eb;
  flex-shrink: 0;
}

.submit-btn {
  height: 92rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #1e3a8a, #1e2d6d);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 24rpx rgba(30, 58, 138, 0.25);
}

.submit-text {
  font-size: 30rpx;
  font-weight: 700;
  color: #ffffff;
  margin-right: 8rpx;
}
</style>
