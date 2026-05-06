<template>
  <view class="page">
    <view class="nav">
      <view class="back" @click="goBack">
        <uni-icons type="left" size="18" color="#374151"></uni-icons>
      </view>
      <text class="title">会员订阅</text>
      <view class="avatar">
        <uni-icons type="person" size="16" color="#FFFFFF"></uni-icons>
      </view>
    </view>

    <scroll-view class="content" scroll-y>
      <text class="headline">开通会员，解锁全部文书功能</text>

      <view class="plan-list">
        <view
          v-for="(plan, idx) in plans"
          :key="plan.id"
          class="plan"
          :class="{ selected: selectedPlan === idx }"
          @click="selectedPlan = idx"
        >
          <view v-if="plan.recommend" class="tag">推荐</view>
          <view class="row">
            <view class="radio" :class="{ checked: selectedPlan === idx }">
              <view v-if="selectedPlan === idx" class="dot"></view>
            </view>
            <view class="meta">
              <text class="name">{{ plan.name }}</text>
              <text class="price">{{ plan.priceText }}</text>
            </view>
          </view>
          <text class="sub">{{ plan.sub }}</text>
          <view v-if="plan.bonus" class="bonus">
            <text class="bonus-text">{{ plan.bonus }}</text>
          </view>
          <view v-if="plan.gift" class="gift">
            <text class="gift-emoji">{{ plan.giftEmoji }}</text>
            <view>
              <text class="gift-title">{{ plan.gift }}</text>
              <text class="gift-sub">{{ plan.giftSub }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="feature-card">
        <text class="feature-title">开通权益</text>
        <view class="feature-list">
          <view v-for="item in features" :key="item" class="feature-item">
            <view class="feature-dot"></view>
            <text class="feature-text">{{ item }}</text>
          </view>
        </view>
      </view>

      <view class="pay-btn" @click="handlePay">
        <text class="pay-text">立即开通</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      selectedPlan: 0,
      orderLoading: false,
      plans: [
        { id: 'monthly', name: '包月会员', priceText: '￥29.00 / 月', sub: '适合短期使用，随时可取消', recommend: true },
        { id: 'quarterly', name: '包季会员', priceText: '￥88.00 / 季', sub: '比包月更划算，适合中期使用', bonus: '额外赠送 5 次导出额度' },
        { id: 'yearly', name: '包年会员', priceText: '￥298.00 / 年', sub: '全年解锁全部文书工具', gift: '赠送安全头盔', giftSub: '原价 ￥99，包邮到手', giftEmoji: '🎁' }
      ],
      features: [
        '解锁全部 8 个文书卡片',
        '优先体验后续 AI 生成功能',
        '本地会员缓存开通后立即生效'
      ]
    }
  },
  computed: {
    currentPlan() {
      return this.plans[this.selectedPlan] || this.plans[0]
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    async handlePay() {
      if (this.orderLoading) return

      const userInfo = uni.getStorageSync('uni-id-pages-userInfo') || {}
      const userId = userInfo._id
      if (!userId) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      const plan = this.currentPlan
      const days = plan.id === 'yearly' ? 365 : plan.id === 'quarterly' ? 90 : 30
      const amount = Number(plan.priceText.replace(/[^\d.]/g, '')) || 0

      this.orderLoading = true
      uni.showLoading({ title: '正在创建订单', mask: true })

      try {
        const res = await uniCloud.callFunction({
          name: 'order',
          data: {
            action: 'createOrder',
            userId,
            orderType: 'member',
            title: plan.name,
            amount,
            extra: {
              level: plan.id,
              days
            }
          }
        })

        if (!res.result || res.result.code !== 0) {
          uni.showToast({ title: res.result?.message || '创建订单失败', icon: 'none' })
          return
        }

        const order = res.result.data || {}
        const params = {
          orderId: order.orderId,
          orderNo: order.orderNo,
          planId: plan.id,
          planName: plan.name,
          planPrice: plan.priceText,
          amount,
          periodText: plan.sub,
          days,
          payMethod: '支付密码'
        }
        const query = Object.keys(params)
          .map((key) => `${key}=${encodeURIComponent(params[key])}`)
          .join('&')

        uni.navigateTo({
          url: `/pages/profile/membership/pay-password?${query}`
        })
      } catch (e) {
        console.error(e)
        uni.showToast({ title: '创建订单失败', icon: 'none' })
      } finally {
        this.orderLoading = false
        uni.hideLoading()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; height: 100vh; background: #f4f5f9; }
.nav { display: flex; align-items: center; justify-content: space-between; padding: calc(var(--status-bar-height, 44px) + 16rpx) 24rpx 16rpx; background: #ffffff; flex-shrink: 0; }
.back { width: 56rpx; height: 56rpx; border-radius: 14rpx; background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
.title { font-size: 32rpx; font-weight: 800; color: #1e1b4b; }
.avatar { width: 44rpx; height: 44rpx; border-radius: 50%; background: linear-gradient(135deg, #1e3a8a, #3b82f6); display: flex; align-items: center; justify-content: center; }
.content { flex: 1; overflow-y: auto; padding: 24rpx; box-sizing: border-box; }
.headline { display: block; font-size: 32rpx; font-weight: 800; color: #1e1b4b; margin-bottom: 24rpx; }
.plan-list { display: flex; flex-direction: column; gap: 16rpx; margin-bottom: 20rpx; }
.plan { width: 100%; min-width: 0; box-sizing: border-box; background: #ffffff; border-radius: 20rpx; padding: 28rpx; position: relative; border: 2rpx solid transparent; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04); }
.plan.selected { border-color: #6d5dfc; box-shadow: 0 8rpx 24rpx rgba(109,93,252,0.15); }
.tag { position: absolute; top: 0; right: 0; background: #1e3a8a; border-radius: 0 20rpx 0 12rpx; padding: 6rpx 20rpx; color: #fff; font-size: 18rpx; font-weight: 700; }
.row { display: flex; align-items: center; gap: 16rpx; margin-bottom: 8rpx; }
.radio { width: 36rpx; height: 36rpx; border-radius: 50%; border: 3rpx solid #d1d5db; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.radio.checked { border-color: #6d5dfc; }
.dot { width: 20rpx; height: 20rpx; border-radius: 50%; background: #6d5dfc; }
.meta { display: flex; align-items: baseline; gap: 10rpx; flex-wrap: wrap; }
.name { font-size: 28rpx; font-weight: 700; color: #1e1b4b; }
.price { font-size: 34rpx; font-weight: 800; color: #1e1b4b; }
.sub { display: block; font-size: 22rpx; color: #6b7280; margin-left: 52rpx; line-height: 1.5; }
.bonus, .gift { margin-top: 12rpx; margin-left: 52rpx; }
.bonus-text { font-size: 22rpx; color: #3b82f6; font-weight: 600; }
.gift { display: flex; align-items: center; gap: 12rpx; }
.gift-emoji { font-size: 28rpx; color: #f97316; font-weight: 800; }
.gift-title { display: block; font-size: 24rpx; color: #f97316; font-weight: 700; }
.gift-sub { display: block; font-size: 20rpx; color: #9ca3af; }
.feature-card { width: 100%; min-width: 0; box-sizing: border-box; background: #ffffff; border-radius: 20rpx; padding: 26rpx; margin-bottom: 28rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04); }
.feature-title { display: block; font-size: 28rpx; font-weight: 700; color: #1e1b4b; margin-bottom: 16rpx; }
.feature-list { display: flex; flex-direction: column; gap: 12rpx; }
.feature-item { display: flex; align-items: center; gap: 12rpx; }
.feature-dot { width: 10rpx; height: 10rpx; border-radius: 50%; background: #3b82f6; }
.feature-text { font-size: 24rpx; color: #4b5563; }
.pay-btn { height: 96rpx; border-radius: 48rpx; background: linear-gradient(135deg, #1e3a8a, #1e2d6d); display: flex; align-items: center; justify-content: center; box-shadow: 0 12rpx 24rpx rgba(30,58,138,0.25); }
.pay-text { font-size: 30rpx; color: #ffffff; font-weight: 700; }
</style>
