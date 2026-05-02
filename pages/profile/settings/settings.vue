<template>
	<view class="page-container">
		<!-- 顶部导航 -->
		<view class="nav-header">
			<view class="back-btn" @click="goBack">
				<uni-icons type="left" size="18" color="#374151"></uni-icons>
			</view>
			<text class="nav-title">通用设置</text>
			<view class="nav-avatar">
				<uni-icons type="person" size="18" color="#FFFFFF"></uni-icons>
			</view>
		</view>

		<!-- 内容 -->
		<scroll-view class="content-area" scroll-y>
			<!-- 账户与安全 -->
			<view class="section">
				<text class="section-label">账户与安全</text>
				<view class="menu-card">
					<view class="menu-item" @click="handleItem('修改登录密码')">
						<text class="menu-name">修改登录密码</text>
						<uni-icons type="right" size="14" color="#c9cdd4"></uni-icons>
					</view>
					<view class="menu-item">
						<text class="menu-name">实名认证</text>
						<text class="menu-status verified">已认证</text>
					</view>
				</view>
			</view>

			<!-- 偏好设置 -->
			<view class="section">
				<text class="section-label">偏好设置</text>
				<view class="menu-card">
					<view class="menu-item">
						<text class="menu-name">消息通知推送</text>
						<switch :checked="notifyOn" @change="notifyOn = $event.detail.value" color="#22c55e" />
					</view>
					<view class="menu-item">
						<text class="menu-name">深色模式</text>
						<switch :checked="darkMode" @change="darkMode = $event.detail.value" color="#22c55e" />
					</view>
				</view>
			</view>

			<!-- 系统维护 -->
			<view class="section">
				<text class="section-label">系统维护</text>
				<view class="menu-card">
					<view class="menu-item" @click="handleItem('清理缓存')">
						<text class="menu-name">清理缓存</text>
						<view class="menu-right">
							<text class="menu-value">124.5 MB</text>
							<uni-icons type="right" size="14" color="#c9cdd4"></uni-icons>
						</view>
					</view>
					<view class="menu-item" @click="handleItem('关于我们')">
						<text class="menu-name">关于我们</text>
						<uni-icons type="right" size="14" color="#c9cdd4"></uni-icons>
					</view>
					<view class="menu-item" @click="handleItem('版本更新')">
						<text class="menu-name">版本更新</text>
						<view class="menu-right">
							<text class="menu-value">v2.4.1</text>
							<view class="new-badge"><text class="new-badge-text">New</text></view>
							<uni-icons type="right" size="14" color="#c9cdd4"></uni-icons>
						</view>
					</view>
				</view>
			</view>

			<!-- 退出登录 -->
			<view class="logout-dashed" @click="handleLogout">
				<text class="logout-text">退出登录</text>
			</view>

			<!-- 底部品牌 -->
			<view class="footer">
				<text class="footer-brand">管行宝</text>
				<text class="footer-sub">PROFESSIONAL INDUSTRIAL MANAGEMENT</text>
				<text class="footer-copy">© 2024 Digital Foreman. All Rights Reserved.</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				notifyOn: true,
				darkMode: false
			}
		},
		methods: {
			goBack() { uni.navigateBack() },
			handleItem(name) {
				uni.showToast({ title: `${name}（开发中）`, icon: 'none' })
			},
			handleLogout() {
				uni.showModal({
					title: '提示',
					content: '确定退出登录吗？',
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

	.content-area { flex: 1; overflow-y: auto; padding: 24rpx; }

	.section { margin-bottom: 28rpx; }
	.section-label { display: block; font-size: 22rpx; font-weight: 700; color: #6b7280; margin-bottom: 12rpx; padding-left: 8rpx; }

	.menu-card {
		background: #ffffff; border-radius: 20rpx; overflow: hidden;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
	}
	.menu-item {
		display: flex; align-items: center; justify-content: space-between;
		padding: 28rpx 24rpx; border-bottom: 1rpx solid #f1f5f9;
	}
	.menu-item:last-child { border-bottom: none; }
	.menu-name { font-size: 28rpx; color: #1e293b; font-weight: 500; }
	.menu-right { display: flex; align-items: center; gap: 8rpx; }
	.menu-value { font-size: 24rpx; color: #9ca3af; }
	.menu-status { font-size: 24rpx; font-weight: 700; }
	.verified { color: #22c55e; }

	.new-badge {
		background: #ef4444; border-radius: 8rpx; padding: 2rpx 10rpx;
	}
	.new-badge-text { font-size: 18rpx; color: #ffffff; font-weight: 700; }

	.logout-dashed {
		margin: 16rpx 0 32rpx; border: 2rpx dashed #fca5a5; border-radius: 16rpx;
		padding: 24rpx; display: flex; align-items: center; justify-content: center;
	}
	.logout-text { font-size: 30rpx; color: #ef4444; font-weight: 700; }

	.footer { display: flex; flex-direction: column; align-items: center; padding: 32rpx 0 48rpx; }
	.footer-brand { font-size: 28rpx; font-weight: 800; color: #1e2d6d; letter-spacing: 2rpx; }
	.footer-sub { font-size: 16rpx; color: #9ca3af; margin-top: 6rpx; letter-spacing: 1rpx; }
	.footer-copy { font-size: 18rpx; color: #d1d5db; margin-top: 8rpx; }
</style>
