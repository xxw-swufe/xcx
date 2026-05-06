<template>
	<view class="page">
		<view class="nav-header">
			<view class="nav-left">
				<image class="nav-logo" src="/static/brand-icon.png" mode="aspectFit"></image>
				<text class="nav-title">管行宝</text>
			</view>
			<view class="nav-avatar">
				<image class="avatar-img" :src="userProfile.avatar || defaultAvatar" mode="aspectFill"></image>
			</view>
		</view>

		<scroll-view class="content" scroll-y>
			<view class="title-block">
				<text class="page-title">涉油气管道施工审批</text>
				<text class="page-subtitle">保护管道，人人有责，施工审批，合法合规</text>
			</view>

			<view class="tool-grid">
				<view class="tool-card left" @click="goPolicySearch">
					<view class="tool-head">
						<view class="tool-icon icon-blue">⚲</view>
						<text class="tool-name">政策速查</text>
					</view>
					<text class="tool-desc">输入施工地点，获取管道规定与提示。</text>
					<view class="search-box">
						<text class="search-placeholder">输入地区...</text>
						<view class="search-btn">⌕</view>
					</view>
				</view>

				<view class="tool-card right" @click="goDepartmentSearch">
					<view class="tool-head">
						<view class="tool-icon icon-green">▦</view>
						<text class="tool-name">部门查询</text>
					</view>
					<text class="tool-desc">建立并联络负责该区域的路政、安监等部门。</text>
					<view class="mini-entry">
						<view class="mini-thumb"></view>
						<text class="mini-text">深圳路田</text>
					</view>
				</view>
			</view>

			<view class="main-card">
				<view class="main-head">
					<view class="main-title-wrap">
						<view class="main-icon">⚙</view>
						<view class="main-texts">
							<text class="main-title">涉油气管道施工审批</text>
							<text class="main-subtitle">基于《石油天然气管道保护法》及区域行政规章生成涉油气管道审批材料</text>
						</view>
					</view>
					<view class="vip-badge">会员专享</view>
				</view>

				<view class="status-grid">
					<view class="status-card success">
						<text class="status-label">最近生成: 供电局500KV百通电缆线路跨油气管道施工</text>
					</view>
					<view class="status-card progress">
						<text class="status-label">生成进度: 已就绪 3 份基础文件，进度 60%</text>
					</view>
				</view>
			</view>
		</scroll-view>

		<view class="tabbar-space"></view>
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
				defaultAvatar: DEFAULT_AVATAR
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
			goDepartmentSearch() {
				uni.navigateTo({ url: '/pages/apply/department-search' })
			},
			goPolicySearch() {
				uni.navigateTo({ url: '/pages/apply/policy-search' })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.page {
		min-height: 100vh;
		background: linear-gradient(180deg, #eef4ff 0%, #f4f8fd 100%);
		display: flex;
		flex-direction: column;
	}

	.nav-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: calc(var(--status-bar-height, 44px) + 16rpx) 28rpx 16rpx;
		background: transparent;
	}

	.nav-left {
		display: flex;
		align-items: center;
	}

	.nav-logo {
		width: 54rpx;
		height: 54rpx;
		border-radius: 14rpx;
		margin-right: 16rpx;
	}

	.nav-title {
		font-size: 32rpx;
		font-weight: 800;
		color: #14285f;
	}

	.nav-avatar {
		width: 58rpx;
		height: 58rpx;
		border-radius: 50%;
		overflow: hidden;
		box-shadow: 0 10rpx 24rpx rgba(20, 40, 95, 0.12);
	}

	.avatar-img {
		width: 100%;
		height: 100%;
	}

	.content {
		flex: 1;
		padding: 0 20rpx 0;
		box-sizing: border-box;
	}

	.title-block {
		padding: 10rpx 8rpx 22rpx;
		text-align: center;
	}

	.page-title {
		display: block;
		font-size: 38rpx;
		font-weight: 900;
		color: #12285f;
		letter-spacing: 0.5rpx;
	}

	.page-subtitle {
		display: block;
		margin-top: 12rpx;
		font-size: 20rpx;
		color: #7d8db1;
	}

	.tool-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 14rpx;
		margin-bottom: 16rpx;
		width: 100%;
		box-sizing: border-box;
	}

	.tool-card {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		min-height: 272rpx;
		padding: 22rpx 18rpx 18rpx;
		border-radius: 28rpx;
		background: #ffffff;
		box-shadow: 0 14rpx 30rpx rgba(20, 40, 95, 0.08);
	}

	.tool-card.left {
		background: linear-gradient(180deg, #edf6ff 0%, #dff1ff 100%);
	}

	.tool-card.right {
		background: linear-gradient(180deg, #ffffff 0%, #fefefe 100%);
	}

	.tool-head {
		display: flex;
		align-items: center;
		gap: 12rpx;
		margin-bottom: 12rpx;
	}

	.tool-icon {
		width: 36rpx;
		height: 36rpx;
		border-radius: 12rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 22rpx;
		font-weight: 700;
	}

	.icon-blue {
		background: rgba(37, 99, 235, 0.12);
		color: #1947d7;
	}

	.icon-green {
		background: rgba(34, 197, 94, 0.12);
		color: #15803d;
	}

	.tool-name {
		font-size: 27rpx;
		font-weight: 800;
		color: #15306d;
	}

	.tool-desc {
		display: block;
		font-size: 19rpx;
		line-height: 1.6;
		color: #6f82aa;
		margin-bottom: 16rpx;
	}

	.search-box {
		height: 76rpx;
		border-radius: 20rpx;
		background: rgba(255, 255, 255, 0.78);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 12rpx 0 16rpx;
		box-shadow: inset 0 0 0 1rpx rgba(94, 126, 198, 0.10);
	}

	.search-placeholder {
		font-size: 19rpx;
		color: #9aabc7;
	}

	.search-btn {
		width: 48rpx;
		height: 48rpx;
		border-radius: 16rpx;
		background: #203eac;
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		font-weight: 700;
	}

	.mini-entry {
		height: 72rpx;
		margin-top: 20rpx;
		border-radius: 18rpx;
		background: #dff0fb;
		display: flex;
		align-items: center;
		padding: 0 16rpx;
		gap: 12rpx;
	}

	.mini-thumb {
		width: 42rpx;
		height: 42rpx;
		border-radius: 12rpx;
		background: linear-gradient(135deg, #93c5fd, #bfdbfe);
	}

	.mini-text {
		font-size: 18rpx;
		font-weight: 700;
		color: #24408f;
	}

	.main-card {
		background: #ffffff;
		border-radius: 30rpx;
		padding: 22rpx 18rpx 20rpx;
		box-shadow: 0 16rpx 36rpx rgba(20, 40, 95, 0.09);
	}

	.main-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 14rpx;
		margin-bottom: 16rpx;
	}

	.main-title-wrap {
		display: flex;
		align-items: flex-start;
		gap: 12rpx;
		flex: 1;
	}

	.main-icon {
		width: 84rpx;
		height: 84rpx;
		border-radius: 24rpx;
		background: #1d2a86;
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 36rpx;
		flex-shrink: 0;
	}

	.main-texts {
		flex: 1;
	}

	.main-title {
		display: block;
		font-size: 30rpx;
		font-weight: 900;
		color: #182b63;
		margin-top: 2rpx;
	}

	.main-subtitle {
		display: block;
		font-size: 18rpx;
		line-height: 1.65;
		color: #6f82aa;
		margin-top: 10rpx;
	}

	.vip-badge {
		padding: 8rpx 16rpx;
		border-radius: 999rpx;
		background: #fff1c7;
		color: #d08900;
		font-size: 17rpx;
		font-weight: 800;
		flex-shrink: 0;
		margin-top: 4rpx;
	}

	.status-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 14rpx;
		width: 100%;
		box-sizing: border-box;
	}

	.status-card {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		min-height: 128rpx;
		border-radius: 20rpx;
		padding: 18rpx 16rpx;
		display: flex;
		align-items: flex-end;
		box-shadow: inset 0 0 0 1rpx rgba(20, 40, 95, 0.05);
	}

	.status-card.success {
		background: linear-gradient(180deg, #eff9f2 0%, #dff5e6 100%);
		border-left: 4rpx solid #15803d;
	}

	.status-card.progress {
		background: linear-gradient(180deg, #eef4ff 0%, #dbe6ff 100%);
		border-left: 4rpx solid #1d4ed8;
	}

	.status-label {
		font-size: 18rpx;
		line-height: 1.6;
		color: #1d3b77;
		font-weight: 700;
	}

	.tabbar-space {
		height: calc(100rpx + env(safe-area-inset-bottom));
	}
</style>
