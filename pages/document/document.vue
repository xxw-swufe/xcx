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
          <view class="banner-icon-wrap">
            <uni-icons :type="banner.icon" :size="72" color="rgba(255, 255, 255, 0.72)"></uni-icons>
          </view>
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
      <text>开通会员即可解锁全部智能文书功能</text>
      <view class="vip-btn">立即开通</view>
    </view>

    <scroll-view class="content" scroll-y>
      <view class="grid">
        <view
          v-for="item in docs"
          :key="item.id"
          class="card"
          :style="{ '--accent': item.accent }"
          @click="handleDocClick(item)"
        >
          <view class="badge">会员专享</view>
          <view class="card-icon">
            <uni-icons :type="item.icon" :size="34" :color="item.accent"></uni-icons>
          </view>
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
        { id: 'banner-0', title: '来往函件', subtitle: '智能提取上下文正式公函回复', icon: 'mail-open-filled', bg: 'linear-gradient(135deg, #e8efff 0%, #dbe7ff 100%)' },
        { id: 'banner-1', title: '施工方案', subtitle: '自动生成各类关键工艺施工组织设计', icon: 'shop-filled', bg: 'linear-gradient(135deg, #e9fef1 0%, #d4f7e2 100%)' },
        { id: 'banner-2', title: '设计方案', subtitle: 'AI 辅助生成初步设计与图纸说明书', icon: 'compose', bg: 'linear-gradient(135deg, #fff0e7 0%, #ffe1cf 100%)' },
        { id: 'banner-3', title: '安评报告', subtitle: '基于 JHA 分析的专项风险评估报告', icon: 'info-filled', bg: 'linear-gradient(135deg, #fff0f3 0%, #ffdce5 100%)' },
        { id: 'banner-4', title: '安全教育', subtitle: '自动配置多级安全培训与考试资料', icon: 'staff-filled', bg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)' },
        { id: 'banner-5', title: '管道措施', subtitle: '第三方施工及水保防腐专项保护', icon: 'tune-filled', bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)' },
        { id: 'banner-6', title: '管道计算', subtitle: '高精度水力及热工计算书智能生成', icon: 'settings-filled', bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' },
        { id: 'banner-7', title: '竣工资料', subtitle: '全生命周期工程档案智能归档核查', icon: 'folder-add-filled', bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }
      ],
      docs: [
        { id: 'letter', title: '来往函件', desc: '智能提取上下文正式公函回复', icon: 'mail-open-filled', accent: '#4f7cff', path: '/pages/document/letter/letter', needVip: true },
        { id: 'construction', title: '施工方案', desc: '自动生成各类关键工艺施工组织设计', icon: 'shop-filled', accent: '#22c55e', path: '/pages/document/construction/construction', needVip: true },
        { id: 'design', title: '设计方案', desc: 'AI 辅助生成初步设计与图纸说明书', icon: 'compose', accent: '#f97316', path: '/pages/document/design/design', needVip: true },
        { id: 'safety-report', title: '安评报告', desc: '基于 JHA 分析的专项风险评估报告', icon: 'info-filled', accent: '#ef4444', path: '/pages/document/safety-report/safety-report', needVip: true },
        { id: 'safety-edu', title: '安全教育', desc: '自动配置多级安全培训与考试资料', icon: 'staff-filled', accent: '#8b5cf6', path: '/pages/document/safety-edu/safety-edu', needVip: true },
        { id: 'pipeline-measure', title: '管道措施', desc: '第三方施工及水保防腐专项保护', icon: 'tune-filled', accent: '#06b6d4', path: '/pages/document/pipeline-measure/pipeline-measure', needVip: true },
        { id: 'pipeline-calc', title: '管道计算', desc: '高精度水力及热工计算书智能生成', icon: 'settings-filled', accent: '#6366f1', path: '/pages/document/pipeline-calc/pipeline-calc', needVip: true },
        { id: 'completion', title: '竣工资料', desc: '全生命周期工程档案智能归档核查', icon: 'folder-add-filled', accent: '#10b981', path: '/pages/document/completion/completion', needVip: true }
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
.banner-icon-wrap { position: absolute; right: 18rpx; top: 16rpx; width: 112rpx; height: 112rpx; display: flex; align-items: center; justify-content: center; }
.dots { display: flex; align-items: center; justify-content: center; gap: 10rpx; margin-top: 14rpx; }
.dot { width: 14rpx; height: 14rpx; border-radius: 50%; background: #d0d8ea; }
.dot.active { width: 34rpx; border-radius: 999rpx; background: #163172; }
.vip-bar { margin: 0 28rpx 18rpx; padding: 20rpx 22rpx; border-radius: 22rpx; background: rgba(255, 255, 255, 0.9); border: 1rpx solid rgba(79, 124, 255, 0.16); display: flex; align-items: center; justify-content: space-between; box-shadow: 0 12rpx 28rpx rgba(18, 40, 95, 0.05); }
.vip-btn { padding: 12rpx 22rpx; border-radius: 999rpx; background: linear-gradient(135deg, #0f2f87 0%, #173fbe 100%); color: #ffffff; font-size: 22rpx; font-weight: 700; }
.content { flex: 1; padding: 0 28rpx 20rpx; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18rpx; }
.card { min-height: 240rpx; background: #ffffff; border-radius: 24rpx; padding: 22rpx 20rpx; position: relative; overflow: hidden; box-shadow: 0 10rpx 24rpx rgba(18, 40, 95, 0.06); border: 2rpx solid transparent; }
.badge { position: absolute; top: 16rpx; right: 16rpx; padding: 6rpx 12rpx; border-radius: 999rpx; background: #fff2d8; color: #d27b00; font-size: 18rpx; font-weight: 700; }
.card-icon { display: flex; width: 84rpx; height: 84rpx; border-radius: 24rpx; align-items: center; justify-content: center; background: #f6f8ff; margin: 36rpx auto 16rpx; box-shadow: 0 8rpx 16rpx rgba(18, 40, 95, 0.06); }
.card-title { display: block; font-size: 30rpx; font-weight: 800; color: #13295f; margin-top: 2rpx; text-align: center; }
.card-desc { display: block; font-size: 20rpx; line-height: 1.45; color: #6e7d9c; margin-top: 8rpx; text-align: center; }
</style>
