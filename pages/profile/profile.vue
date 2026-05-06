<template>
	<view class="page-container">
		<view class="nav-header">
			<view class="nav-left">
				<image class="nav-logo" src="/static/brand-icon.png" mode="aspectFit"></image>
				<text class="nav-title">个人中心</text>
			</view>
		</view>

		<scroll-view class="content-area" scroll-y>
			<view class="user-card">
				<view class="user-main">
					<view class="user-photo-wrap">
						<image class="user-photo" :src="userProfile.avatar || defaultAvatar" mode="aspectFill"></image>
					</view>
					<view class="user-info">
						<text class="user-name">{{ userProfile.nickname || defaultNickname }}</text>
					</view>
				</view>
				<view class="user-edit" @click="editProfile">
					<uni-icons type="more-filled" size="20" color="#6b7280"></uni-icons>
				</view>
			</view>

			<view class="section">
				<view class="section-divider">
					<view class="divider-line"></view>
					<text class="section-title">常用功能</text>
					<view class="divider-line"></view>
				</view>
				<view class="menu-card">
					<view class="menu-item" @click="handleMenu('通用设置')">
						<view class="menu-icon-wrap icon-blue">
							<uni-icons type="locked" size="20" color="#3b82f6"></uni-icons>
						</view>
						<text class="menu-name">通用设置</text>
						<uni-icons type="right" size="14" color="#c9cdd4"></uni-icons>
					</view>
					<view class="menu-item" @click="handleMenu('订单管理')">
						<view class="menu-icon-wrap icon-green">
							<uni-icons type="cart" size="20" color="#22c55e"></uni-icons>
						</view>
						<text class="menu-name">订单管理</text>
						<uni-icons type="right" size="14" color="#c9cdd4"></uni-icons>
					</view>
					<view class="menu-item" @click="handleMenu('会员中心')">
						<view class="menu-icon-wrap icon-purple">
							<uni-icons type="medal" size="20" color="#8b5cf6"></uni-icons>
						</view>
						<view class="menu-name-col">
							<text class="menu-name">会员中心</text>
							<text class="menu-sub">查看会员权益</text>
						</view>
						<uni-icons type="right" size="14" color="#c9cdd4"></uni-icons>
					</view>
				</view>
			</view>

			<view class="section">
				<view class="section-divider">
					<view class="divider-line"></view>
					<text class="section-title">更多服务</text>
					<view class="divider-line"></view>
				</view>
				<view class="menu-card">
					<view class="menu-item" @click="handleMenu('问题反馈')">
						<view class="menu-icon-wrap icon-orange">
							<uni-icons type="chat" size="20" color="#f97316"></uni-icons>
						</view>
						<text class="menu-name">问题反馈</text>
						<uni-icons type="right" size="14" color="#c9cdd4"></uni-icons>
					</view>
					<view class="menu-item" @click="handleMenu('帮助中心')">
						<view class="menu-icon-wrap icon-blue">
							<uni-icons type="help" size="20" color="#3b82f6"></uni-icons>
						</view>
						<text class="menu-name">帮助中心</text>
						<uni-icons type="right" size="14" color="#c9cdd4"></uni-icons>
					</view>
				</view>
			</view>

			<view class="logout-area" @click="handleLogout">
				<text class="logout-text">退出登录</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
const USER_PROFILE_KEY = 'userProfile'
const DEFAULT_AVATAR = '/static/logo.png'
const DEFAULT_NICKNAME = '用户'

export default {
	data() {
		return {
			userProfile: {
				nickname: DEFAULT_NICKNAME,
				avatar: DEFAULT_AVATAR
			},
			defaultAvatar: DEFAULT_AVATAR,
			defaultNickname: DEFAULT_NICKNAME
		}
	},
	onShow() {
		this.loadUserProfile()
	},
	methods: {
		loadUserProfile() {
			const profile = uni.getStorageSync(USER_PROFILE_KEY) || {}
			this.userProfile = {
				nickname: profile.nickname || DEFAULT_NICKNAME,
				avatar: profile.avatar || DEFAULT_AVATAR
			}
		},
		editProfile() {
			uni.navigateTo({ url: '/pages/profile-edit/profile-edit' })
		},
		handleMenu(name) {
			const routes = {
				'通用设置': '/pages/profile/settings/settings',
				'订单管理': '/pages/profile/orders/orders',
				'会员中心': '/pages/profile/membership/membership',
				'问题反馈': '/pages/profile/feedback/feedback',
				'帮助中心': '/pages/profile/help/help'
			}
			if (routes[name]) {
				uni.navigateTo({ url: routes[name] })
			} else {
				uni.showToast({ title: `${name}功能开发中`, icon: 'none' })
			}
		},
		handleLogout() {
			uni.showModal({
				title: '提示',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						uni.reLaunch({ url: '/pages/login/login' })
					}
				}
			})
		}
	}
}
</script>

<style lang="scss" scoped>
	.page-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: #f4f5f9;
	}

	.nav-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: calc(var(--status-bar-height, 44px) + 16rpx) 28rpx 16rpx;
		background: #ffffff;
		flex-shrink: 0;
	}

	.nav-left {
		display: flex;
		align-items: center;
	}

	.nav-logo {
		width: 56rpx;
		height: 56rpx;
		border-radius: 12rpx;
		margin-right: 16rpx;
	}

	.nav-title {
		font-size: 32rpx;
		font-weight: 800;
		color: #1e2d6d;
		letter-spacing: 2rpx;
	}

	.content-area {
		flex: 1;
		overflow-y: auto;
		padding: 24rpx;
	}

	.user-card {
		display: flex;
		align-items: center;
		background: #ffffff;
		border-radius: 24rpx;
		padding: 32rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	}

	.user-main {
		display: flex;
		align-items: center;
		flex: 1;
	}

	.user-photo-wrap {
		width: 112rpx;
		height: 112rpx;
		border-radius: 50%;
		overflow: hidden;
		margin-right: 24rpx;
		flex-shrink: 0;
		background: #e5e7eb;
		border: 4rpx solid #f3f4f6;
	}

	.user-photo {
		width: 112rpx;
		height: 112rpx;
	}

	.user-info {
		flex: 1;
	}

	.user-name {
		display: block;
		font-size: 32rpx;
		font-weight: 800;
		color: #111827;
		margin-bottom: 6rpx;
	}

	.user-edit {
		width: 56rpx;
		height: 56rpx;
		border-radius: 14rpx;
		background: #f3f4f6;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-left: 16rpx;
	}

	.section {
		margin-bottom: 24rpx;
	}

	.section-divider {
		display: flex;
		align-items: center;
		gap: 16rpx;
		margin-bottom: 16rpx;
		padding: 0 8rpx;
	}

	.divider-line {
		flex: 1;
		height: 2rpx;
		background: repeating-linear-gradient(
			90deg,
			#93c5fd 0,
			#93c5fd 12rpx,
			transparent 12rpx,
			transparent 20rpx
		);
	}

	.section-title {
		font-size: 24rpx;
		font-weight: 700;
		color: #6b7280;
		flex-shrink: 0;
	}

	.menu-card {
		background: #ffffff;
		border-radius: 20rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	}

	.menu-item {
		display: flex;
		align-items: center;
		padding: 28rpx 24rpx;
		border-bottom: 1rpx solid #f1f5f9;
	}

	.menu-item:last-child {
		border-bottom: none;
	}

	.menu-icon-wrap {
		width: 52rpx;
		height: 52rpx;
		border-radius: 14rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
		flex-shrink: 0;
	}

	.icon-blue { background: #eff6ff; }
	.icon-green { background: #f0fdf4; }
	.icon-purple { background: #f5f3ff; }
	.icon-orange { background: #fff7ed; }
	.icon-gray { background: #f3f4f6; }

	.menu-name {
		font-size: 28rpx;
		color: #1e293b;
		font-weight: 600;
	}

	.menu-name-col {
		flex: 1;
	}

	.menu-sub {
		display: block;
		font-size: 20rpx;
		color: #f97316;
		margin-top: 4rpx;
	}

	.logout-area {
		padding: 40rpx 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.logout-text {
		font-size: 30rpx;
		color: #ef4444;
		font-weight: 700;
	}
</style>
