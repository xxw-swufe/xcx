<template>
  <view class="expert-webview-page">
    <web-view v-if="url" :src="url" />
    <view v-else class="empty-state">
      <text class="empty-title">专家咨询链接无效</text>
      <text class="empty-desc">请返回聊天页重新打开专家咨询卡片</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      url: '',
      expertName: '专家咨询'
    }
  },
  onLoad(options) {
    this.url = decodeURIComponent(options.url || '')
    this.expertName = decodeURIComponent(options.name || '专家咨询')
    uni.setNavigationBarTitle({
      title: this.expertName
    })
  }
}
</script>

<style lang="scss" scoped>
.expert-webview-page {
  min-height: 100vh;
  background: #f6f8fc;
}

.empty-state {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #1e293b;
}

.empty-desc {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #64748b;
}
</style>
