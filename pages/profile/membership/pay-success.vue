<template>
  <view class="page">
    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="18" color="#1e3a8a"></uni-icons>
      </view>
      <text class="nav-title-center">支付成功</text>
      <text class="nav-title-right">会员已开通</text>
    </view>

    <scroll-view class="content" scroll-y>
      <view class="success-area">
        <view class="success-icon">
          <view class="checkmark"></view>
        </view>
        <text class="success-title">支付成功</text>
        <text class="success-sub">您的会员特权已立即生效</text>
      </view>

      <view class="order-card">
        <view class="order-header">
          <view class="order-header-left">
            <view class="header-bar"></view>
            <text class="order-header-title">订单详情</text>
          </view>
          <view class="status-tag">已开通</view>
        </view>

        <view class="order-row">
          <text class="order-label">订单号</text>
          <text class="order-value">{{ orderNo }}</text>
        </view>
        <view class="order-row">
          <text class="order-label">会员套餐</text>
          <text class="order-value">{{ planName }}</text>
        </view>
        <view class="order-row">
          <text class="order-label">支付方式</text>
          <text class="order-value">{{ payMethod }}</text>
        </view>
        <view class="order-row">
          <text class="order-label">到期日期</text>
          <text class="order-value">{{ expireDate }}</text>
        </view>
        <view class="divider"></view>
        <view class="order-row amount-row">
          <text class="order-label">实付金额</text>
          <text class="order-amount">{{ planPrice }}</text>
        </view>
      </view>

      <view class="tip-area">
        <uni-icons type="info-filled" size="14" color="#1e3a8a"></uni-icons>
        <text class="tip-text">会员状态已写入本地缓存，返回后会立即刷新为会员态。</text>
      </view>
    </scroll-view>

    <view class="bottom-bar">
      <view class="action-btn" @click="viewOrder">
        <text class="action-text">查看订单</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      orderNo: '',
      planId: '',
      planName: '',
      planPrice: '',
      amount: '',
      payMethod: '',
      expireDate: ''
    }
  },
  onLoad(options) {
    this.orderNo = this.decodeOption(options.orderNo, '')
    this.planId = this.decodeOption(options.planId, '')
    this.planName = this.decodeOption(options.planName, '会员订阅')
    this.planPrice = this.decodeOption(options.planPrice, '¥0.00')
    this.amount = this.decodeOption(options.amount, '0')
    this.payMethod = this.decodeOption(options.payMethod, '微信支付')
    this.expireDate = this.decodeOption(options.expireDate, '')

    uni.setStorageSync('isVip', true)
    this.syncVipFromBackend()
  },
  methods: {
    decodeOption(value, fallback) {
      if (value === undefined || value === null || value === '') return fallback
      try {
        return decodeURIComponent(value)
      } catch (e) {
        return value
      }
    },
    goBack() {
      uni.navigateBack({ delta: 2 })
    },
    viewOrder() {
      uni.navigateTo({
        url: '/pages/profile/orders/orders'
      })
    },
    async syncVipFromBackend() {
      const userInfo = uni.getStorageSync('uni-id-pages-userInfo') || {}
      const userId = userInfo._id
      if (!userId) return

      try {
        const res = await uniCloud.callFunction({
          name: 'user',
          data: {
            action: 'getProfile',
            userId
          }
        })
        if (res.result.code === 0 && res.result.data.user) {
          const user = res.result.data.user
          const isVip = user.member_level && user.member_level !== 'free'
          uni.setStorageSync('isVip', isVip)
        }
      } catch (e) {
        console.log('会员状态同步失败', e)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; height: 100vh; background: #eef8fc; }
.nav-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: calc(var(--status-bar-height, 44px) + 16rpx) 24rpx 16rpx;
  background: #eef8fc;
}
.back-btn {
  width: 56rpx; height: 56rpx; border-radius: 50%; border: 2rpx dashed #7aa7ff;
  display: flex; align-items: center; justify-content: center;
}
.nav-title-center { font-size: 30rpx; font-weight: 700; color: #06145f; }
.nav-title-right { font-size: 28rpx; font-weight: 700; color: #06145f; }
.content { flex: 1; padding: 0 32rpx; box-sizing: border-box; }
.success-area { display: flex; flex-direction: column; align-items: center; padding: 40rpx 0 50rpx; }
.success-icon {
  width: 120rpx; height: 120rpx; border-radius: 50%;
  background: linear-gradient(135deg, #40c5ad, #29a996);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 30rpx; box-shadow: 0 12rpx 30rpx rgba(16, 185, 129, 0.3);
}
.checkmark {
  width: 40rpx; height: 24rpx;
  border-left: 6rpx solid #ffffff; border-bottom: 6rpx solid #ffffff;
  transform: rotate(-45deg); margin-top: -8rpx;
}
.success-title { font-size: 40rpx; font-weight: 800; color: #06145f; margin-bottom: 12rpx; }
.success-sub { font-size: 26rpx; color: #334155; }
.order-card {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  background: #ffffff; border-radius: 28rpx; padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(14, 116, 144, 0.08);
  border: 4rpx solid #dff3fb;
}
.order-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28rpx; width: 100%; min-width: 0; box-sizing: border-box; }
.order-header-left { display: flex; align-items: center; min-width: 0; }
.header-bar { width: 8rpx; height: 32rpx; background: #0f9f8c; border-radius: 4rpx; margin-right: 14rpx; }
.order-header-title { font-size: 30rpx; font-weight: 800; color: #111827; }
.status-tag {
  padding: 6rpx 18rpx; border-radius: 999rpx;
  background: #dffaf2; color: #0f9f8c;
  font-size: 22rpx; font-weight: 700;
}
.order-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22rpx; gap: 24rpx; width: 100%; min-width: 0; box-sizing: border-box; }
.order-row:last-child { margin-bottom: 0; }
.order-label { font-size: 26rpx; color: #64748b; flex-shrink: 0; }
.order-value {
  font-size: 26rpx; font-weight: 700; color: #06145f;
  text-align: right; word-break: break-all;
}
.divider { height: 2rpx; background: #e5e7eb; margin: 20rpx 0; }
.amount-row { margin-bottom: 0; }
.order-amount { font-size: 40rpx; font-weight: 800; color: #06145f; }
.tip-area {
  display: flex; align-items: flex-start; gap: 10rpx;
  margin-top: 28rpx; padding: 24rpx; border-radius: 18rpx;
  background: #eef2ff; margin-bottom: 40rpx;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.tip-text { flex: 1; font-size: 22rpx; color: #334155; line-height: 1.6; min-width: 0; }
.bottom-bar {
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #eef8fc;
  box-sizing: border-box;
}
.action-btn {
  height: 92rpx; border-radius: 46rpx;
  background: linear-gradient(135deg, #13259f, #11198c);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 12rpx 24rpx rgba(30, 58, 138, 0.25);
  width: 100%;
  box-sizing: border-box;
}
.action-text { font-size: 30rpx; color: #ffffff; font-weight: 700; }
</style>
