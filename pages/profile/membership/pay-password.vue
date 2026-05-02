<template>
  <view class="page">
    <view class="mask" @click="goBack"></view>
    <view class="panel">
      <view class="drag-bar" @click="goBack">
        <view class="drag-line"></view>
      </view>

      <view class="title-area">
        <text class="panel-title">支付密码</text>
        <text class="panel-subtitle">{{ planName }} - {{ planPrice }}</text>
        <text class="panel-period">{{ periodText }}</text>
      </view>

      <view class="password-row">
        <view
          v-for="(item, index) in 6"
          :key="index"
          class="password-cell"
          :class="{ active: index === password.length, filled: index < password.length }"
        >
          <view v-if="index < password.length" class="password-dot"></view>
          <view v-if="index === password.length" class="cursor"></view>
        </view>
      </view>

      <view class="confirm-btn" :class="{ enabled: password.length === 6 }" @click="confirmPay">
        <text class="confirm-text">确认支付</text>
      </view>

      <text class="forgot-link" @click="onForgot">忘记密码？</text>

      <view class="keyboard">
        <view
          v-for="num in keyboardNums"
          :key="num"
          class="key"
          hover-class="key-hover"
          @click="inputNum(num)"
        >
          <text class="key-text">{{ num }}</text>
        </view>
        <view class="key key-empty"></view>
        <view class="key" hover-class="key-hover" @click="inputNum(0)">
          <text class="key-text">0</text>
        </view>
        <view class="key key-delete" hover-class="key-hover" @click="deleteNum">
          <uni-icons type="back" size="24" color="#64748b"></uni-icons>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      password: '',
      orderId: '',
      orderNo: '',
      planId: 'monthly',
      planName: '会员订阅',
      planPrice: '¥0.00',
      amount: '0',
      periodText: '',
      days: 30,
      payMethod: '微信支付'
    }
  },
  computed: {
    keyboardNums() {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9]
    }
  },
  onLoad(options) {
    this.orderId = this.decodeOption(options.orderId, '')
    this.orderNo = this.decodeOption(options.orderNo, '')
    this.planId = this.decodeOption(options.planId, 'monthly')
    this.planName = this.decodeOption(options.planName, '会员订阅')
    this.planPrice = this.decodeOption(options.planPrice, '¥0.00')
    this.amount = this.decodeOption(options.amount, '0')
    this.periodText = this.decodeOption(options.periodText, '')
    this.days = Number(this.decodeOption(options.days, '30')) || 30
    this.payMethod = this.decodeOption(options.payMethod, '微信支付')
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
      uni.navigateBack()
    },
    inputNum(num) {
      if (this.password.length < 6) {
        this.password += num.toString()
      }
    },
    deleteNum() {
      if (this.password.length > 0) {
        this.password = this.password.slice(0, -1)
      }
    },
    async confirmPay() {
      if (this.password.length !== 6) return

      const userInfo = uni.getStorageSync('uni-id-pages-userInfo') || {}
      const userId = userInfo._id

      if (!userId || !this.orderId) {
        uni.showToast({ title: '参数缺失，无法支付', icon: 'none' })
        return
      }

      uni.showLoading({ title: '正在支付...', mask: true })

      try {
        const res = await uniCloud.callFunction({
          name: 'order',
          data: {
            action: 'mockPay',
            userId,
            orderId: this.orderId
          }
        })

        uni.hideLoading()

        if (res.result.code !== 0) {
          uni.showToast({ title: res.result.message || '支付失败', icon: 'none' })
          return
        }

        const expireDate = this.createExpireDate(this.days)
        const params = {
          orderNo: this.orderNo,
          planId: this.planId,
          planName: this.planName,
          planPrice: this.planPrice,
          amount: this.amount,
          payMethod: this.payMethod,
          expireDate
        }
        const query = Object.keys(params)
          .map((key) => `${key}=${encodeURIComponent(params[key])}`)
          .join('&')

        uni.redirectTo({
          url: `/pages/profile/membership/pay-success?${query}`
        })
      } catch (e) {
        uni.hideLoading()
        uni.showToast({ title: '支付失败', icon: 'none' })
        console.error(e)
      }
    },
    createOrderNo() {
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      const random = Math.floor(Math.random() * 9000 + 1000)
      return `GHB${y}${m}${d}${random}`
    },
    createExpireDate(days) {
      const expireDate = new Date()
      expireDate.setDate(expireDate.getDate() + Number(days || 30))
      const y = expireDate.getFullYear()
      const m = String(expireDate.getMonth() + 1).padStart(2, '0')
      const d = String(expireDate.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    },
    onForgot() {
      uni.showToast({ title: '请到设置页重置支付密码', icon: 'none' })
    }
  }
}
</script>

<style lang="scss" scoped>
.page { display: flex; flex-direction: column; height: 100vh; background: rgba(15, 23, 42, 0.42); }
.mask { flex: 1; backdrop-filter: blur(8rpx); }
.panel {
  background: #ffffff;
  border-radius: 40rpx 40rpx 0 0;
  padding: 20rpx 40rpx calc(20rpx + env(safe-area-inset-bottom));
}
.drag-bar { display: flex; align-items: center; justify-content: center; padding: 12rpx 0 20rpx; }
.drag-line { width: 80rpx; height: 8rpx; border-radius: 4rpx; background: #e5e7eb; }
.title-area { display: flex; flex-direction: column; align-items: center; margin-bottom: 40rpx; }
.panel-title { font-size: 34rpx; font-weight: 800; color: #1e1b4b; }
.panel-subtitle { font-size: 26rpx; color: #6b7280; margin-top: 12rpx; }
.panel-period { font-size: 22rpx; color: #94a3b8; margin-top: 6rpx; }
.password-row { display: flex; align-items: center; justify-content: center; gap: 16rpx; margin-bottom: 40rpx; }
.password-cell {
  width: 78rpx; height: 78rpx; border-radius: 16rpx;
  background: #eef7fc; border: 2rpx solid #cfe7f3;
  display: flex; align-items: center; justify-content: center;
}
.password-cell.active { border-color: #1e3a8a; background: #ffffff; }
.password-cell.filled { border-color: #bfdbfe; }
.password-dot { width: 18rpx; height: 18rpx; border-radius: 50%; background: #0b1b7a; }
.cursor { width: 2rpx; height: 40rpx; background: #1e3a8a; animation: blink 1s infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.confirm-btn {
  height: 92rpx; border-radius: 46rpx; background: #cbd5e1;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24rpx; transition: all 0.2s;
}
.confirm-btn.enabled {
  background: linear-gradient(135deg, #13259f, #11198c);
  box-shadow: 0 12rpx 24rpx rgba(30, 58, 138, 0.25);
}
.confirm-text { font-size: 30rpx; font-weight: 700; color: #ffffff; }
.forgot-link { display: block; text-align: center; font-size: 24rpx; color: #00856f; margin-bottom: 30rpx; }
.keyboard {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rpx;
  background: #e5e7eb; border-radius: 20rpx; overflow: hidden;
}
.key { height: 104rpx; background: #ffffff; display: flex; align-items: center; justify-content: center; }
.key-hover { background: #f1f5f9; }
.key-empty { background: #f8fafc; }
.key-text { font-size: 38rpx; font-weight: 500; color: #1e1b4b; }
</style>
