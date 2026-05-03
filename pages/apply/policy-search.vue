<template>
  <view class="page">
    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="nav-title">政策速查</text>
      <view class="back-btn ghost"></view>
    </view>

    <scroll-view class="content" scroll-y>
      <view class="location-card">
        <view class="loc-row">
          <text class="loc-pin">📍</text>
          <text class="loc-text">当前定位：{{ locationText }}</text>
        </view>

        <view class="search-box">
          <text class="search-icon">🔎</text>
          <input
            class="search-input"
            v-model="keyword"
            placeholder="搜索政策关键词 / 条件"
            placeholder-class="search-placeholder"
            confirm-type="search"
            @confirm="applySearch"
          />
        </view>

        <view class="auto-btn" @click="refreshLocation">重新定位</view>
      </view>

      <view class="section-head">
        <text class="section-title">政策精选</text>
        <text class="section-right">Policy</text>
      </view>

      <view class="policy-card" v-for="item in filteredPolicies" :key="item.title">
        <view class="policy-top">
          <view class="policy-icon" :style="{ background: item.iconBg, color: item.iconColor }">{{ item.icon }}</view>
          <view class="policy-main">
            <text class="policy-title">{{ item.title }}</text>
            <view class="policy-tags">
              <text class="tag" v-for="tag in item.tags" :key="tag">{{ tag }}</text>
            </view>
          </view>
        </view>

        <view class="policy-actions">
          <view class="btn light" @click="refreshLocation">定位相关</view>
          <view class="btn dark" @click="openPolicy(item)">查看详情</view>
        </view>
      </view>

      <view v-if="filteredPolicies.length === 0" class="empty-state">
        <text class="empty-title">没有找到匹配政策</text>
        <text class="empty-desc">试试换个关键词，或者先点击重新定位。</text>
      </view>
    </scroll-view>

    <view class="tabbar-space"></view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      keyword: '',
      locationText: '点击按钮获取当前定位',
      policies: [
        { title: '建设工程项目审批流程指引', tags: ['申报材料', '审批流程'], icon: '政', iconBg: '#e9f2ff', iconColor: '#2d4fb5' },
        { title: '企业开办与变更登记政策汇编', tags: ['市场主体', '登记备案'], icon: '策', iconBg: '#eaf6ff', iconColor: '#2763c8' },
        { title: '重点项目要素保障清单', tags: ['要素保障', '政策支持'], icon: '速', iconBg: '#edf4ff', iconColor: '#214d9d' }
      ]
    }
  },
  computed: {
    filteredPolicies() {
      const q = this.keyword.trim().toLowerCase()
      if (!q) return this.policies
      return this.policies.filter((item) => {
        const haystack = [item.title, ...(item.tags || [])].join(' ').toLowerCase()
        return haystack.includes(q)
      })
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    applySearch() {
      this.keyword = this.keyword.trim()
    },
    promptLocationSetting() {
      uni.showModal({
        title: '需要定位权限',
        content: '请在系统设置中开启定位权限，才能筛选附近政策。',
        confirmText: '去设置',
        cancelText: '取消',
        success: (res) => {
          if (!res.confirm) return
          uni.openSetting({
            success: (settingRes) => {
              if (settingRes.authSetting && settingRes.authSetting['scope.userLocation']) {
                this.doGetLocation()
              }
            }
          })
        }
      })
    },
    doGetLocation() {
      uni.showLoading({ title: '定位中' })
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          const lat = res.latitude.toFixed(5)
          const lng = res.longitude.toFixed(5)
          this.locationText = `已获取当前位置 ${lat}, ${lng}`
          uni.showToast({ title: '定位成功', icon: 'success' })
        },
        fail: () => {
          this.locationText = '定位失败，请检查权限后重试'
          this.promptLocationSetting()
        },
        complete: () => {
          uni.hideLoading()
        }
      })
    },
    refreshLocation() {
      uni.getSetting({
        success: (res) => {
          const auth = res.authSetting || {}
          if (auth['scope.userLocation'] === false) {
            this.promptLocationSetting()
            return
          }
          if (auth['scope.userLocation'] === true) {
            this.doGetLocation()
            return
          }
          uni.authorize({
            scope: 'scope.userLocation',
            success: () => this.doGetLocation(),
            fail: () => this.promptLocationSetting()
          })
        },
        fail: () => {
          this.doGetLocation()
        }
      })
    },
    openPolicy(item) {
      uni.showModal({
        title: item.title,
        content: `已打开 ${item.title}。当前定位：${this.locationText}`,
        showCancel: false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(180deg, #eef4ff 0%, #f4f8fd 100%); display: flex; flex-direction: column; }
.nav-header { display: flex; align-items: center; justify-content: space-between; padding: calc(var(--status-bar-height, 44px) + 14rpx) 18rpx 12rpx; }
.back-btn { width: 62rpx; height: 62rpx; border-radius: 50%; border: 2rpx dashed #9dc0ff; display: flex; align-items: center; justify-content: center; color: #1b2f74; font-size: 30rpx; }
.back-btn.ghost { border-color: transparent; }
.nav-title { font-size: 32rpx; font-weight: 900; color: #18306b; }
.content { flex: 1; padding: 8rpx 18rpx 0; }
.location-card { background: rgba(255, 255, 255, 0.92); border-radius: 28rpx; padding: 22rpx 18rpx 18rpx; box-shadow: 0 14rpx 30rpx rgba(20, 40, 95, 0.09); }
.loc-row { display: flex; align-items: center; gap: 10rpx; color: #11625e; font-size: 20rpx; font-weight: 700; margin-bottom: 18rpx; }
.loc-pin { font-size: 26rpx; }
.search-box { height: 78rpx; border-radius: 20rpx; background: #dff0fb; display: flex; align-items: center; padding: 0 20rpx; color: #91a8c4; margin-bottom: 18rpx; }
.search-icon { font-size: 32rpx; margin-right: 12rpx; flex-shrink: 0; }
.search-input { flex: 1; height: 100%; font-size: 20rpx; color: #14315f; }
.search-placeholder { color: #91a8c4; font-size: 20rpx; }
.auto-btn { height: 82rpx; border-radius: 41rpx; background: linear-gradient(135deg, #0c116c 0%, #101b81 100%); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 22rpx; font-weight: 800; }
.section-head { display: flex; align-items: center; justify-content: space-between; margin: 24rpx 4rpx 14rpx; }
.section-title { font-size: 30rpx; font-weight: 900; color: #102b71; }
.section-right { font-size: 17rpx; font-weight: 800; color: #8fa0c2; }
.policy-card { background: #ffffff; border-radius: 26rpx; padding: 20rpx 18rpx; margin-bottom: 16rpx; box-shadow: 0 12rpx 28rpx rgba(20, 40, 95, 0.08); }
.policy-top { display: flex; align-items: flex-start; gap: 12rpx; }
.policy-icon { width: 64rpx; height: 64rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; font-size: 30rpx; flex-shrink: 0; }
.policy-main { flex: 1; }
.policy-title { display: block; font-size: 25rpx; font-weight: 900; color: #152c69; line-height: 1.45; }
.policy-tags { display: flex; gap: 10rpx; flex-wrap: wrap; margin-top: 10rpx; }
.tag { padding: 5rpx 12rpx; border-radius: 999rpx; background: #edf6ff; color: #2260b8; font-size: 17rpx; font-weight: 700; }
.policy-actions { display: flex; gap: 12rpx; margin-top: 16rpx; padding-left: 76rpx; }
.btn { flex: 1; height: 70rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; font-size: 20rpx; font-weight: 800; }
.btn.light { background: #d9d6ff; color: #2d2b74; }
.btn.dark { background: #dceefe; color: #24408f; }
.empty-state { padding: 34rpx 20rpx 54rpx; text-align: center; color: #6c7d9f; }
.empty-title { display: block; font-size: 28rpx; font-weight: 800; color: #16306d; margin-bottom: 10rpx; }
.empty-desc { display: block; font-size: 20rpx; line-height: 1.6; }
.tabbar-space { height: calc(100rpx + env(safe-area-inset-bottom)); }
</style>
