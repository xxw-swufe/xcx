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
			<view class="avatar-wrap" @click="chooseAvatar">
				<image
					class="avatar-img"
					:src="avatar || DEFAULT_AVATAR"
					mode="aspectFill"
				></image>
				<view class="avatar-plus">
					<uni-icons type="plusempty" size="15" color="#FFFFFF"></uni-icons>
				</view>
			</view>

			<view class="form-block">
				<view class="form-item">
					<text class="label">用户昵称 <text class="required">*</text></text>
					<view class="input-card">
						<input
							class="input"
							v-model="nickname"
							placeholder="请输入用户昵称"
							maxlength="20"
						/>
					</view>
				</view>
			</view>

			<view class="submit-btn" @click="handleDone">
				<text class="submit-text">完成</text>
			</view>
		</view>
	</view>
</template>

<script>
const USER_PROFILE_KEY = 'userProfile'
const DEFAULT_AVATAR = '/static/logo.png'
const DEFAULT_NICKNAME = '用户'

export default {
	data() {
		return {
			avatar: DEFAULT_AVATAR,
			nickname: DEFAULT_NICKNAME
		}
	},
	onShow() {
		this.loadUserProfile()
	},
	methods: {
		loadUserProfile() {
			const profile = uni.getStorageSync(USER_PROFILE_KEY) || {}
			this.nickname = profile.nickname || DEFAULT_NICKNAME
			this.avatar = profile.avatar || DEFAULT_AVATAR
		},
		goBack() {
			uni.navigateBack()
		},
		chooseAvatar() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const filePath = (res.tempFilePaths && res.tempFilePaths[0]) || ''
					if (!filePath) return
					uni.saveFile({
						tempFilePath: filePath,
						success: (saveRes) => {
							this.avatar = saveRes.savedFilePath || filePath
						},
						fail: () => {
							this.avatar = filePath
						}
					})
				}
			})
		},
		handleDone() {
			const nickname = this.nickname.trim()
			if (!nickname) {
				uni.showToast({ title: '昵称不能为空', icon: 'none' })
				return
			}
			uni.setStorageSync(USER_PROFILE_KEY, {
				nickname,
				avatar: this.avatar || DEFAULT_AVATAR
			})
			uni.showToast({ title: '保存成功', icon: 'success' })
			setTimeout(() => {
				uni.navigateBack()
			}, 300)
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

	.content {
		padding: 48rpx 40rpx 40rpx;
		box-sizing: border-box;
	}

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

	.form-block {
		padding: 0 4rpx;
		box-sizing: border-box;
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
		width: 100%;
		min-width: 0;
	}

	.input {
		flex: 1;
		height: 88rpx;
		font-size: 28rpx;
		color: #111827;
	}

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
		width: 100%;
		box-sizing: border-box;
	}

	.submit-text {
		font-size: 30rpx;
		font-weight: 800;
		color: #ffffff;
		letter-spacing: 2rpx;
	}
</style>
