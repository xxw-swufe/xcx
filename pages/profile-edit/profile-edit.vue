<template>
	<view class="profile-page">
		<view class="nav-bar">
			<view class="back-btn" @click="goBack">
				<uni-icons type="left" size="18" color="#1E2C3D"></uni-icons>
			</view>
			<text class="nav-title">个人资料</text>
			<view class="nav-spacer"></view>
		</view>

		<view class="content">
			<view class="avatar-wrap">
				<image
					class="avatar-img"
					:src="avatarUrl || '/static/logo.png'"
					mode="aspectFill"
				></image>
				<view class="avatar-plus" @click="chooseAvatar">
					<uni-icons type="plusempty" size="15" color="#FFFFFF"></uni-icons>
				</view>
			</view>

			<view class="form-block">
				<view class="form-item">
					<text class="label">昵称 <text class="required">*</text></text>
					<view class="input-card">
						<input
							class="input"
							v-model="nickname"
							placeholder="请输入昵称"
							maxlength="20"
						/>
					</view>
				</view>

				<view class="form-item wechat-item">
					<text class="label">微信号 <text class="required">*</text></text>
					<view class="input-card">
						<input
							class="input"
							v-model="wechatId"
							placeholder="请输入微信号"
							maxlength="16"
						/>
						<view v-if="wechatValid" class="valid-icon">
							<uni-icons type="checkmarkempty" size="18" color="#22C55E"></uni-icons>
						</view>
					</view>
					<text class="hint">微信号只能使用字母、数字以及下划线，长度为4-16个字符</text>
				</view>
			</view>

			<view class="submit-btn" @click="handleDone">
				<text class="submit-text">完成</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				avatarUrl: '',
				nickname: '',
				wechatId: ''
			}
		},
		computed: {
			wechatValid() {
				const wechatReg = /^[a-zA-Z0-9_]{4,16}$/
				return wechatReg.test(this.wechatId.trim())
			}
		},
		methods: {
			goBack() {
				uni.navigateBack()
			},
			chooseAvatar() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						this.avatarUrl = res.tempFilePaths[0]
					}
				})
			},
			handleDone() {
				if (!this.nickname.trim()) {
					uni.showToast({ title: '请输入昵称', icon: 'none' })
					return
				}
				const wechatReg = /^[a-zA-Z0-9_]{4,16}$/
				if (!wechatReg.test(this.wechatId.trim())) {
					uni.showToast({ title: '微信号格式不正确', icon: 'none' })
					return
				}
				uni.showToast({ title: '资料保存成功', icon: 'success' })
				setTimeout(() => {
					uni.switchTab({
						url: '/pages/consult/consult'
					})
				}, 500)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.profile-page {
		min-height: 100vh;
		background: #f4f5f9;
		box-sizing: border-box;
	}

	/* 导航栏 */
	.nav-bar {
		height: calc(var(--status-bar-height, 44px) + 88rpx);
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		padding: 0 32rpx 18rpx;
		background: #ffffff;
		box-sizing: border-box;
	}

	.back-btn {
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
		border: 2rpx dashed #93c5fd;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #ffffff;
		box-sizing: border-box;
	}

	.nav-title {
		font-size: 32rpx;
		font-weight: 800;
		color: #111827;
		margin-bottom: 4rpx;
	}

	.nav-spacer {
		width: 60rpx;
		height: 60rpx;
	}

	/* 内容区 */
	.content {
		padding: 48rpx 40rpx 40rpx;
	}

	/* 头像区域 */
	.avatar-wrap {
		position: relative;
		width: 160rpx;
		height: 160rpx;
		margin: 0 auto 56rpx;
	}

	.avatar-img {
		width: 160rpx;
		height: 160rpx;
		border-radius: 50%;
		background: #e5e7eb;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
	}

	.avatar-plus {
		position: absolute;
		right: -4rpx;
		bottom: 4rpx;
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 6rpx 16rpx rgba(59, 130, 246, 0.35);
		border: 4rpx solid #ffffff;
	}

	/* 表单 */
	.form-block {
		padding: 0 4rpx;
	}

	.form-item {
		margin-bottom: 28rpx;
	}

	.label {
		display: block;
		font-size: 24rpx;
		font-weight: 700;
		color: #374151;
		margin: 0 0 14rpx 4rpx;
	}

	.required {
		color: #ef4444;
	}

	.input-card {
		height: 88rpx;
		border-radius: 18rpx;
		background: #ffffff;
		border: 2rpx solid #e5e7eb;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 24rpx;
		box-sizing: border-box;
	}

	.input {
		flex: 1;
		height: 88rpx;
		font-size: 28rpx;
		color: #111827;
	}

	.wechat-item .input-card {
		padding-right: 20rpx;
	}

	.valid-icon {
		width: 36rpx;
		height: 36rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hint {
		display: block;
		margin: 12rpx 0 0 6rpx;
		font-size: 20rpx;
		color: #9ca3af;
		line-height: 32rpx;
	}

	/* 完成按钮 */
	.submit-btn {
		height: 96rpx;
		margin: 64rpx 0 0;
		border-radius: 20rpx;
		background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
		border: 3rpx dashed #93c5fd;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 14rpx 28rpx rgba(59, 130, 246, 0.28);
	}

	.submit-text {
		font-size: 32rpx;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: 4rpx;
	}
</style>
