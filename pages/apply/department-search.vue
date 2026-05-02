<template>
	<view class="page">
		<view class="nav-header">
			<view class="back-btn" @click="goBack">
				<text class="back-icon">←</text>
			</view>
			<text class="nav-title">部门查询</text>
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
				<text class="section-title">管护职能部门</text>
				<text class="section-right">Registry</text>
			</view>

			<view class="dept-card" v-for="dept in departments" :key="dept.name">
				<view class="dept-head">
					<view class="dept-icon" :style="{ background: dept.iconBg, color: dept.iconColor }">{{ dept.icon }}</view>
					<view class="dept-meta">
						<text class="dept-name">{{ dept.name }}</text>
						<view class="tags">
							<text class="tag" v-for="tag in dept.tags" :key="tag">{{ tag }}</text>
						</view>
					</view>
				</view>

				<view class="dept-desc">{{ dept.desc }}</view>
				<view class="dept-address">📍 {{ dept.address }}</view>

				<view class="action-row">
					<view class="action-btn light">📞 拨打</view>
					<view class="action-btn dark">✈ 导航</view>
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
				departments: [
					{
						name: '发展和改革委员会（发改委）',
						tags: ['能源管理', '长输管线'],
						desc: '负责全区石油天然气管道保护工作的综合监管管理，组织协调部门管道保护重大问题。',
						address: '浦东新区世纪大道2001号',
						icon: '🏛',
						iconBg: '#e9e5ff',
						iconColor: '#3b3bb8'
					},
					{
						name: '住房和城乡建设局',
						tags: ['城镇燃气', '施工审批'],
						desc: '负责城镇燃气管道的保护与管理，监督市政工程建设中的管线迁移与保护措施落实。',
						address: '浦东新区杨高中路2000号',
						icon: '🏢',
						iconBg: '#e8f2ff',
						iconColor: '#2351c7'
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
		letter-spacing: 2rpx;
		text-transform: uppercase;
	}

	.dept-card {
		background: #ffffff;
		border-radius: 26rpx;
		padding: 20rpx 18rpx;
		margin-bottom: 16rpx;
		box-shadow: 0 12rpx 28rpx rgba(20, 40, 95, 0.08);
	}

	.dept-head {
		display: flex;
		align-items: flex-start;
		gap: 12rpx;
	}

	.dept-icon {
		width: 64rpx;
		height: 64rpx;
		border-radius: 18rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		flex-shrink: 0;
	}

	.dept-meta {
		flex: 1;
	}

	.dept-name {
		display: block;
		font-size: 25rpx;
		font-weight: 900;
		color: #152c69;
		line-height: 1.45;
	}

	.tags {
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

	.dept-desc {
		font-size: 18rpx;
		line-height: 1.65;
		color: #516688;
		padding-left: 76rpx;
		margin-top: 12rpx;
	}

	.dept-address {
		font-size: 18rpx;
		color: #7687a8;
		padding-left: 76rpx;
		margin-top: 10rpx;
	}

	.action-row {
		display: flex;
		gap: 12rpx;
		margin-top: 16rpx;
		padding-left: 76rpx;
	}

	.action-btn {
		flex: 1;
		height: 72rpx;
		border-radius: 18rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20rpx;
		font-weight: 800;
	}

	.action-btn.light {
		background: #dff0fb;
		color: #24408f;
	}

	.action-btn.dark {
		background: linear-gradient(135deg, #1f2f92 0%, #12276f 100%);
		color: #ffffff;
	}

	.tabbar-space {
		height: calc(100rpx + env(safe-area-inset-bottom));
	}
</style>
