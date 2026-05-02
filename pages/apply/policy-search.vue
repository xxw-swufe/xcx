<template>
	<view class="page">
		<view class="nav-header">
			<view class="back-btn" @click="goBack">
				<text class="back-icon">←</text>
			</view>
			<text class="nav-title">区域政策速查</text>
			<view class="back-btn ghost"></view>
		</view>

		<scroll-view class="content" scroll-y>
			<view class="location-card">
				<view class="loc-row">
					<text class="loc-pin">📍</text>
					<text class="loc-text">当前定位: 上海市 浦东新区</text>
				</view>

				<view class="search-box">
					<text class="search-icon">⌕</text>
					<text class="search-placeholder">输入地区/路段名称</text>
				</view>

				<view class="auto-btn">◎ 自动定位</view>
			</view>

			<view class="section-head">
				<text class="section-title">推荐政策法规</text>
				<text class="section-right">共 12 份</text>
			</view>

			<view class="policy-card" v-for="item in policies" :key="item.title">
				<view class="policy-top">
					<view class="policy-icon" :style="{ background: item.iconBg, color: item.iconColor }">{{ item.icon }}</view>
					<view class="policy-main">
						<text class="policy-title">{{ item.title }}</text>
						<view class="policy-tags">
							<text class="tag" v-for="tag in item.tags" :key="tag">{{ tag }}</text>
						</view>
					</view>
				</view>

				<view class="policy-actions">
					<view class="btn light">查看</view>
					<view class="btn dark">下载</view>
				</view>
			</view>
		</scroll-view>

		<view class="tabbar-space"></view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				policies: [
					{
						title: '《上海市石油天然气管道保护办法》',
						tags: ['上海市', '强制性'],
						icon: '▣',
						iconBg: '#e9f2ff',
						iconColor: '#2d4fb5'
					},
					{
						title: '深圳市油气管道管理规定',
						tags: ['通知', '2023发布'],
						icon: '▤',
						iconBg: '#eaf6ff',
						iconColor: '#2763c8'
					},
					{
						title: '《浦东新区地下管线安全防护指导手册》',
						tags: ['浦东区', '操作指南'],
						icon: '🛡',
						iconBg: '#edf4ff',
						iconColor: '#214d9d'
					}
				]
			}
		},
		methods: {
			goBack() {
				uni.navigateBack()
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
		padding: calc(var(--status-bar-height, 44px) + 14rpx) 18rpx 12rpx;
	}

	.back-btn {
		width: 62rpx;
		height: 62rpx;
		border-radius: 50%;
		border: 2rpx dashed #9dc0ff;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #1b2f74;
		font-size: 30rpx;
	}

	.back-btn.ghost {
		border-color: transparent;
	}

	.nav-title {
		font-size: 32rpx;
		font-weight: 900;
		color: #18306b;
	}

	.content {
		flex: 1;
		padding: 8rpx 18rpx 0;
	}

	.location-card {
		background: rgba(255, 255, 255, 0.92);
		border-radius: 28rpx;
		padding: 22rpx 18rpx 18rpx;
		box-shadow: 0 14rpx 30rpx rgba(20, 40, 95, 0.09);
	}

	.loc-row {
		display: flex;
		align-items: center;
		gap: 10rpx;
		color: #11625e;
		font-size: 20rpx;
		font-weight: 700;
		margin-bottom: 18rpx;
	}

	.loc-pin {
		font-size: 26rpx;
	}

	.search-box {
		height: 78rpx;
		border-radius: 20rpx;
		background: #dff0fb;
		display: flex;
		align-items: center;
		padding: 0 20rpx;
		color: #91a8c4;
		margin-bottom: 18rpx;
	}

	.search-icon {
		font-size: 32rpx;
		margin-right: 12rpx;
	}

	.search-placeholder {
		font-size: 20rpx;
	}

	.auto-btn {
		height: 82rpx;
		border-radius: 41rpx;
		background: linear-gradient(135deg, #0c116c 0%, #101b81 100%);
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 22rpx;
		font-weight: 800;
	}

	.section-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 24rpx 4rpx 14rpx;
	}

	.section-title {
		font-size: 30rpx;
		font-weight: 900;
		color: #102b71;
	}

	.section-right {
		font-size: 17rpx;
		font-weight: 800;
		color: #8fa0c2;
	}

	.policy-card {
		background: #ffffff;
		border-radius: 26rpx;
		padding: 20rpx 18rpx;
		margin-bottom: 16rpx;
		box-shadow: 0 12rpx 28rpx rgba(20, 40, 95, 0.08);
	}

	.policy-top {
		display: flex;
		align-items: flex-start;
		gap: 12rpx;
	}

	.policy-icon {
		width: 64rpx;
		height: 64rpx;
		border-radius: 18rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		flex-shrink: 0;
	}

	.policy-main {
		flex: 1;
	}

	.policy-title {
		display: block;
		font-size: 25rpx;
		font-weight: 900;
		color: #152c69;
		line-height: 1.45;
	}

	.policy-tags {
		display: flex;
		gap: 10rpx;
		flex-wrap: wrap;
		margin-top: 10rpx;
	}

	.tag {
		padding: 5rpx 12rpx;
		border-radius: 999rpx;
		background: #edf6ff;
		color: #2260b8;
		font-size: 17rpx;
		font-weight: 700;
	}

	.policy-actions {
		display: flex;
		gap: 12rpx;
		margin-top: 16rpx;
		padding-left: 76rpx;
	}

	.btn {
		flex: 1;
		height: 70rpx;
		border-radius: 18rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20rpx;
		font-weight: 800;
	}

	.btn.light {
		background: #d9d6ff;
		color: #2d2b74;
	}

	.btn.dark {
		background: #dceefe;
		color: #24408f;
	}

	.tabbar-space {
		height: calc(100rpx + env(safe-area-inset-bottom));
	}
</style>
