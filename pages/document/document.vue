<template>
  <view class="page">
    <view class="nav">
      <view class="brand">
        <image class="logo" src="/static/brand-icon.png" mode="aspectFit"></image>
        <text class="title">文书中心</text>
      </view>
      <image class="avatar" src="/static/logo.png" mode="aspectFill"></image>
    </view>

    <scroll-view class="hero" scroll-x :scroll-into-view="activeBannerId" scroll-with-animation>
      <view class="hero-row">
        <view
          v-for="(banner, index) in banners"
          :key="banner.id"
          :id="banner.id"
          class="banner"
          :class="{ active: currentBanner === index }"
          :style="{ background: banner.bg }"
          @click="scrollToBanner(index)"
        >
          <text class="banner-title">{{ banner.title }}</text>
          <text class="banner-sub">{{ banner.subtitle }}</text>
          <text class="banner-icon">{{ banner.icon }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="dots">
      <view
        v-for="(item, index) in banners"
        :key="index"
        class="dot"
        :class="{ active: currentBanner === index }"
        @click="scrollToBanner(index)"
      />
    </view>

    <view class="vip-bar" @click="goToMembership">
      <text>开通会员即可解锁全部文书功能</text>
      <view class="vip-btn">去开通</view>
    </view>

    <scroll-view class="content" scroll-y>
      <view class="grid">
        <view
          v-for="(item, index) in docs"
          :key="item.id"
          class="card"
          :style="{ '--accent': item.accent }"
          @click="handleDocClick(item)"
        >
          <view class="badge">会员</view>
          <text class="card-icon">{{ item.icon }}</text>
          <text class="card-title">{{ item.title }}</text>
          <text class="card-desc">{{ item.desc }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { getVipStatus } from '@/utils/vip'

export default {
  data() {
    return {
      currentBanner: 0,
      activeBannerId: 'banner-0',
      banners: [
        { id: 'banner-0', title: '函件', subtitle: '生成正式函件', icon: '函', bg: 'linear-gradient(135deg, #e8efff 0%, #dbe7ff 100%)' },
        { id: 'banner-1', title: '施工', subtitle: '创建施工方案', icon: '施', bg: 'linear-gradient(135deg, #e9fef1 0%, #d4f7e2 100%)' },
        { id: 'banner-2', title: '设计', subtitle: '生成设计说明', icon: '设', bg: 'linear-gradient(135deg, #fff0e7 0%, #ffe1cf 100%)' },
        { id: 'banner-3', title: '安全', subtitle: '风险报告草稿', icon: '安', bg: 'linear-gradient(135deg, #fff0f3 0%, #ffdce5 100%)' },
        { id: 'banner-4', title: '教育', subtitle: '培训资料整理', icon: '教', bg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)' },
        { id: 'banner-5', title: '措施', subtitle: '专项措施编写', icon: '措', bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)' },
        { id: 'banner-6', title: '计算', subtitle: '计算表格整理', icon: '算', bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' },
        { id: 'banner-7', title: '竣工', subtitle: '归档资料整理', icon: '竣', bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }
      ],
      docs: [
        { id: 'letter', title: '函件', desc: '正式函件生成页面。', icon: '函', accent: '#4f7cff', path: '/pages/document/letter/letter', needVip: true },
        { id: 'construction', title: '施工', desc: '施工方案生成页面。', icon: '施', accent: '#22c55e', path: '/pages/document/construction/construction', needVip: true },
        { id: 'design', title: '设计', desc: '设计说明生成页面。', icon: '设', accent: '#f97316', path: '/pages/document/design/design', needVip: true },
        { id: 'safety-report', title: '安全', desc: '安全报告草稿页面。', icon: '安', accent: '#ef4444', path: '/pages/document/safety-report/safety-report', needVip: true },
        { id: 'safety-edu', title: '教育', desc: '培训资料整理页面。', icon: '教', accent: '#8b5cf6', path: '/pages/document/safety-edu/safety-edu', needVip: true },
        { id: 'pipeline-measure', title: '措施', desc: '专项措施编写页面。', icon: '措', accent: '#06b6d4', path: '/pages/document/pipeline-measure/pipeline-measure', needVip: true },
        { id: 'pipeline-calc', title: '计算', desc: '计算表格整理页面。', icon: '算', accent: '#6366f1', path: '/pages/document/pipeline-calc/pipeline-calc', needVip: true },
        { id: 'completion', title: '竣工', desc: '归档资料整理页面。', icon: '竣', accent: '#10b981', path: '/pages/document/completion/completion', needVip: true }
      ]
    }
  },
  onShow() {
    this.syncVipStatus()
  },
  methods: {
    scrollToBanner(index) {
      this.currentBanner = index
      this.activeBannerId = `banner-${index}`
    },
    handleDocClick(item) {
      if (item.needVip && !getVipStatus()) {
        uni.navigateTo({ url: '/pages/profile/membership/membership' })
        return
      }
      uni.navigateTo({ url: item.path })
    },
    goToMembership() {
      uni.navigateTo({ url: '/pages/profile/membership/membership' })
    },
    syncVipStatus() {
      uni.setStorageSync('isVip', getVipStatus())
    }
  }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(180deg, #eef4ff 0%, #f6f8fc 22%, #f6f8fc 100%); display: flex; flex-direction: column; }
.nav { display: flex; align-items: center; justify-content: space-between; padding: calc(var(--status-bar-height, 44px) + 16rpx) 28rpx 14rpx; }
.brand { display: flex; align-items: center; }
.logo { width: 48rpx; height: 48rpx; margin-right: 14rpx; border-radius: 10rpx; }
.title { font-size: 32rpx; font-weight: 800; color: #12285f; }
.avatar { width: 56rpx; height: 56rpx; border-radius: 50%; overflow: hidden; }
.hero { padding: 6rpx 28rpx 18rpx; white-space: nowrap; }
.hero-row { display: flex; gap: 18rpx; }
.banner { width: 280rpx; height: 180rpx; border-radius: 28rpx; padding: 28rpx; position: relative; overflow: hidden; flex-shrink: 0; box-shadow: 0 18rpx 36rpx rgba(34, 54, 102, 0.10); opacity: 0.78; transform: scale(0.98); }
.banner.active { opacity: 1; transform: scale(1); }
.banner-title { display: block; font-size: 32rpx; font-weight: 800; color: #18306b; }
.banner-sub { display: block; font-size: 22rpx; color: rgba(24, 48, 107, 0.68); margin-top: 10rpx; }
.banner-icon { position: absolute; right: 20rpx; top: 16rpx; font-size: 92rpx; color: rgba(255, 255, 255, 0.5); line-height: 1; }
.dots { display: flex; align-items: center; justify-content: center; gap: 10rpx; margin-top: 14rpx; }
.dot { width: 14rpx; height: 14rpx; border-radius: 50%; background: #d0d8ea; }
.dot.active { width: 34rpx; border-radius: 999rpx; background: #163172; }
.vip-bar { margin: 0 28rpx 18rpx; padding: 20rpx 22rpx; border-radius: 22rpx; background: rgba(255, 255, 255, 0.9); border: 1rpx solid rgba(79, 124, 255, 0.16); display: flex; align-items: center; justify-content: space-between; box-shadow: 0 12rpx 28rpx rgba(18, 40, 95, 0.05); }
.vip-btn { padding: 12rpx 22rpx; border-radius: 999rpx; background: linear-gradient(135deg, #0f2f87 0%, #173fbe 100%); color: #ffffff; font-size: 22rpx; font-weight: 700; }
.content { flex: 1; padding: 0 28rpx 20rpx; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18rpx; }
.card { min-height: 240rpx; background: #ffffff; border-radius: 24rpx; padding: 22rpx 20rpx; position: relative; overflow: hidden; box-shadow: 0 10rpx 24rpx rgba(18, 40, 95, 0.06); border: 2rpx solid transparent; }
.card .badge { position: absolute; top: 16rpx; right: 16rpx; padding: 6rpx 12rpx; border-radius: 999rpx; background: #fff2d8; color: #d27b00; font-size: 18rpx; font-weight: 700; }
.card-icon { display: flex; width: 72rpx; height: 72rpx; border-radius: 20rpx; align-items: center; justify-content: center; font-size: 40rpx; color: var(--accent); background: #f6f8ff; margin-top: 38rpx; }
.card-title { display: block; font-size: 28rpx; font-weight: 800; color: #13295f; margin-top: 18rpx; }
.card-desc { display: block; font-size: 21rpx; line-height: 1.6; color: #6e7d9c; margin-top: 8rpx; }
</style>
