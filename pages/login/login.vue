<template>
	<view class="login-page">
		<view class="brand-area">
			<image class="brand-icon" src="/static/brand-icon.png" mode="aspectFit"></image>
			<text class="brand-title">管行宝</text>
			<text class="brand-subtitle">先登录，再继续智能咨询</text>
		</view>

		<view class="login-card">
			<view class="field-block">
				<text class="field-label">手机号码</text>
				<view class="input-shell">
					<uni-icons type="phone" size="15" color="#7B8794"></uni-icons>
					<input
						class="field-input"
						type="number"
						v-model="phone"
						placeholder="请输入您的手机号码"
						maxlength="11"
					/>
				</view>
			</view>

			<view class="field-block code-block">
				<text class="field-label">验证码</text>
				<view class="code-row">
					<view class="input-shell code-input-shell">
						<uni-icons type="locked" size="15" color="#7B8794"></uni-icons>
						<input
							class="field-input"
							type="number"
							v-model="code"
							placeholder="请输入验证码"
							maxlength="6"
						/>
					</view>
					<view class="code-action" :class="{ disabled: codeCounting }" @click="getCode">
						<text class="code-action-text">{{ codeBtnText }}</text>
					</view>
				</view>
			</view>

			<view class="agreement-row" @click="toggleAgreement">
				<view class="agreement-box" :class="{ checked: agreed }">
					<uni-icons v-if="agreed" type="checkmarkempty" size="12" color="#FFFFFF"></uni-icons>
				</view>
				<text class="agreement-text">
					我已阅读并同意
					<text class="agreement-link">《用户服务协议》</text>
					和
					<text class="agreement-link">《隐私政策》</text>
				</text>
			</view>

			<view class="submit-btn" @click="handlePhoneLogin">
				<text class="submit-text">立即登录</text>
				<uni-icons type="arrowright" size="16" color="#FFFFFF"></uni-icons>
			</view>

			<text class="other-login-text">其他登录方式</text>

			<view class="wechat-login" @click="handleWechatLogin">
				<view class="wechat-circle">
					<uni-icons type="chat" size="30" color="#07C160"></uni-icons>
				</view>
				<text class="wechat-text">微信登录</text>
			</view>
		</view>
	</view>
</template>

<script>
import { mutations } from '@/uni_modules/uni-id-pages/common/store'

export default {
	data() {
		return {
			phone: '',
			code: '',
			agreed: false,
			codeCounting: false,
			codeCount: 60,
			codeBtnText: '获取验证码',
			timer: null
		}
	},
	beforeDestroy() {
		if (this.timer) clearInterval(this.timer)
	},
	methods: {
		toggleAgreement() {
			this.agreed = !this.agreed
		},
		getCode() {
			if (this.codeCounting) return
			if (!this.phone || this.phone.length !== 11) {
				uni.showToast({ title: '请输入正确的手机号码', icon: 'none' })
				return
			}
			if (!this.agreed) {
				uni.showToast({ title: '请先同意用户服务协议和隐私政策', icon: 'none' })
				return
			}
			uni.showToast({ title: '验证码已发送', icon: 'none' })
			this.codeCounting = true
			this.codeCount = 60
			this.codeBtnText = '60秒'
			this.timer = setInterval(() => {
				this.codeCount -= 1
				if (this.codeCount <= 0) {
					clearInterval(this.timer)
					this.timer = null
					this.codeCounting = false
					this.codeBtnText = '获取验证码'
					return
				}
				this.codeBtnText = `${this.codeCount}秒`
			}, 1000)
		},
		saveMockLoginState(payload = {}) {
			const userInfo = {
				_id: payload._id || `mock-${Date.now()}`,
				nickname: payload.nickname || 'Mock User',
				avatar_file: payload.avatar_file || '',
				isVip: !!payload.isVip
			}
			uni.setStorageSync('uni-id-pages-userInfo', userInfo)
			return userInfo
		},
		handlePhoneLogin() {
			if (!this.phone || this.phone.length !== 11) {
				uni.showToast({ title: '请输入正确的手机号码', icon: 'none' })
				return
			}
			if (!this.code || this.code.length < 4) {
				uni.showToast({ title: '请输入验证码', icon: 'none' })
				return
			}
			if (!this.agreed) {
				uni.showToast({ title: '请先同意用户服务协议和隐私政策', icon: 'none' })
				return
			}
			this.saveMockLoginState({ nickname: this.phone })
			uni.showToast({ title: '登录成功', icon: 'success' })
			setTimeout(() => {
				uni.switchTab({ url: '/pages/consult/consult' })
			}, 600)
		},
		handleWechatLogin() {
			if (!this.agreed) {
				uni.showToast({ title: '请先同意用户服务协议和隐私政策', icon: 'none' })
				return
			}
			uni.login({
				provider: 'weixin',
				success: (res) => {
					console.log('微信登录成功', res)
					const uniIdCo = uniCloud.importObject('uni-id-co', { customUI: true })
					uni.showLoading({ title: '登录中...' })
					uniIdCo.loginByWeixin({ code: res.code })
						.then((result) => {
							mutations.loginSuccess({
								...result,
								uniIdRedirectUrl: '/pages/consult/consult'
							})
						})
						.catch((err) => {
							console.log('微信登录失败', err)
							uni.showModal({
								content: err.message || '微信登录失败，请重试',
								showCancel: false
							})
						})
						.finally(() => {
							uni.hideLoading()
						})
				},
				fail: (err) => {
					console.log('微信登录失败', err)
					uni.showToast({ title: '微信登录失败', icon: 'none' })
				}
			})
		}
	}
}
</script>

<style lang="scss" scoped>
	.login-page {
		min-height: 100vh;
		background: linear-gradient(180deg, #edf4fc 0%, #f4f7fb 60%, #f8fafb 100%);
		box-sizing: border-box;
		padding: 0 48rpx;
		display: flex;
		flex-direction: column;
	}

	.brand-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 160rpx;
		padding-bottom: 40rpx;
	}

	.brand-icon {
		width: 120rpx;
		height: 120rpx;
		border-radius: 24rpx;
	}

	.brand-title {
		font-size: 52rpx;
		line-height: 1;
		font-weight: 800;
		color: #1e2d6d;
		margin-top: 16rpx;
		letter-spacing: 4rpx;
	}

	.brand-subtitle {
		font-size: 22rpx;
		color: #6b7280;
		margin-top: 14rpx;
		letter-spacing: 1rpx;
	}

	.login-card {
		margin-top: 20rpx;
		background: #ffffff;
		border-radius: 32rpx;
		padding: 48rpx 36rpx 44rpx;
		box-shadow: 0 16rpx 40rpx rgba(30, 58, 138, 0.08);
	}

	.field-block {
		margin-bottom: 28rpx;
	}

	.field-label {
		display: block;
		font-size: 24rpx;
		color: #27384b;
		font-weight: 700;
		margin: 0 0 12rpx 4rpx;
	}

	.input-shell {
		height: 88rpx;
		border-radius: 20rpx;
		background: #e0f2fe;
		display: flex;
		align-items: center;
		padding: 0 24rpx;
		box-sizing: border-box;
	}

	.field-input {
		flex: 1;
		height: 88rpx;
		font-size: 28rpx;
		color: #1e293b;
		margin-left: 14rpx;
	}

	.code-row {
		display: flex;
		align-items: center;
	}

	.code-input-shell {
		flex: 1;
		margin-right: 16rpx;
		background: #f1f5f9;
	}

	.code-action {
		width: 190rpx;
		height: 88rpx;
		border-radius: 20rpx;
		background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 20rpx rgba(34, 197, 94, 0.25);
	}

	.code-action.disabled {
		opacity: 0.55;
	}

	.code-action-text {
		font-size: 26rpx;
		font-weight: 700;
		color: #ffffff;
	}

	.agreement-row {
		display: flex;
		align-items: flex-start;
		margin: 32rpx 0 20rpx 4rpx;
	}

	.agreement-box {
		width: 32rpx;
		height: 32rpx;
		border-radius: 50%;
		border: 2rpx solid #9ca3af;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-right: 12rpx;
		margin-top: 4rpx;
	}

	.agreement-box.checked {
		background: #1e3a8a;
		border-color: #1e3a8a;
	}

	.agreement-text {
		flex: 1;
		font-size: 22rpx;
		line-height: 36rpx;
		color: #4b5563;
	}

	.agreement-link {
		color: #2563eb;
		font-weight: 600;
		text-decoration: underline;
	}

	.submit-btn {
		height: 96rpx;
		margin-top: 16rpx;
		border-radius: 48rpx;
		background: linear-gradient(180deg, #1e3a8a 0%, #1e2d6d 100%);
		border: 3rpx dashed #60a5fa;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 16rpx 28rpx rgba(30, 58, 138, 0.28);
	}

	.submit-text {
		font-size: 32rpx;
		color: #ffffff;
		font-weight: 700;
		margin-right: 10rpx;
	}

	.other-login-text {
		display: block;
		text-align: center;
		font-size: 22rpx;
		color: #9ca3af;
		margin: 36rpx 0 28rpx;
	}

	.wechat-login {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.wechat-circle {
		width: 84rpx;
		height: 84rpx;
		border-radius: 50%;
		border: 2rpx solid #e5e7eb;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #ffffff;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
	}

	.wechat-text {
		font-size: 22rpx;
		color: #6b7280;
		margin-top: 10rpx;
		font-weight: 500;
	}
</style>
