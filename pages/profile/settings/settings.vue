<template>
	<view class="page-container">
		<view class="nav-header">
			<view class="back-btn" @click="goBack">
				<uni-icons type="left" size="18" color="#374151"></uni-icons>
			</view>
			<text class="nav-title">通用设置</text>
			<view class="nav-avatar">
				<uni-icons type="person" size="18" color="#FFFFFF"></uni-icons>
			</view>
		</view>

		<scroll-view class="content-area" scroll-y>
			<view class="section">
				<text class="section-label">账号与安全</text>
				<view class="menu-card">
					<view class="menu-item" @click="handleChangePassword">
						<text class="menu-name">修改登录密码</text>
						<uni-icons type="right" size="14" color="#c9cdd4"></uni-icons>
					</view>
				</view>
			</view>

			<view class="section">
				<text class="section-label">关于</text>
				<view class="menu-card">
					<view class="menu-item" @click="showAbout">
						<text class="menu-name">关于我们</text>
						<uni-icons type="right" size="14" color="#c9cdd4"></uni-icons>
					</view>
				</view>
			</view>

			<view class="logout-dashed" @click="handleLogout">
				<text class="logout-text">退出登录</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
export default {
	methods: {
		goBack() {
			uni.navigateBack()
		},
		isLoggedIn() {
			const token = uni.getStorageSync('uni_id_token')
			const userInfo = uni.getStorageSync('uni_id_user_info')
			const legacyUserInfo = uni.getStorageSync('uni-id-pages-userInfo')
			return !!(token || userInfo || legacyUserInfo)
		},
		handleChangePassword() {
			if (!this.isLoggedIn()) {
				uni.showToast({ title: '请先登录', icon: 'none' })
				return
			}
			uni.showToast({ title: '修改密码功能待接入', icon: 'none' })
		},
		showAbout() {
			uni.showModal({
				title: '关于我们',
				content: '管行宝是一款面向涉油气管道施工审批、智能咨询、文书生成与申报管理的小程序工具。',
				showCancel: false
			})
		},
		handleLogout() {
			uni.showModal({
				title: '提示',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (!res.confirm) return

					uni.removeStorageSync('uni_id_token')
					uni.removeStorageSync('uni_id_token_expired')
					uni.removeStorageSync('uni_id_user_info')
					uni.removeStorageSync('uni-id-pages-userInfo')

					uni.reLaunch({ url: '/pages/login/login' })
				}
			})
		}
	}
}
</script>

<style lang="scss" scoped>
	.page-container { display: flex; flex-direction: column; height: 100vh; background: #f4f5f9; }
	.nav-header {
		display: flex; align-items: center; justify-content: space-between;
		padding: calc(var(--status-bar-height, 44px) + 16rpx) 24rpx 16rpx;
		background: #ffffff; flex-shrink: 0;
	}
	.back-btn {
		width: 56rpx; height: 56rpx; border-radius: 14rpx; background: #f1f5f9;
		display: flex; align-items: center; justify-content: center;
	}
	.nav-title { font-size: 32rpx; font-weight: 800; color: #1e1b4b; }
	.nav-avatar {
		width: 48rpx; height: 48rpx; border-radius: 50%; background: linear-gradient(135deg, #f97316, #ea580c);
		display: flex; align-items: center; justify-content: center;
	}
.content-area { flex: 1; overflow-y: auto; padding: 24rpx; box-sizing: border-box; }
	.section { margin-bottom: 28rpx; }
	.section-label { display: block; font-size: 22rpx; font-weight: 700; color: #6b7280; margin-bottom: 12rpx; padding-left: 8rpx; }
.menu-card {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		background: #ffffff; border-radius: 20rpx; overflow: hidden;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
	}
	.menu-item {
		display: flex; align-items: center; justify-content: space-between;
		padding: 28rpx 24rpx; border-bottom: 1rpx solid #f1f5f9;
	}
	.menu-item:last-child { border-bottom: none; }
	.menu-name { font-size: 28rpx; color: #1e293b; font-weight: 500; }
	.logout-dashed {
		margin: 16rpx 0 32rpx; border: 2rpx dashed #fca5a5; border-radius: 16rpx;
		padding: 24rpx; display: flex; align-items: center; justify-content: center;
	}
	.logout-text { font-size: 30rpx; color: #ef4444; font-weight: 700; }
</style>
