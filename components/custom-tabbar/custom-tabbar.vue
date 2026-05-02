<template>
	<view class="tabbar-wrap">
		<view class="tabbar">
			<view
				v-for="(tab, index) in tabs"
				:key="index"
				class="tab-item"
				:class="{ active: tab.active }"
				@click="switchTab(index)"
			>
				<view class="tab-icon-box">
					<uni-icons
						:type="tab.icon"
						:size="tab.active ? 26 : 22"
						:color="tab.active ? '#1e3a8a' : '#9ca3af'"
					></uni-icons>
				</view>
				<text class="tab-label" :class="{ active: tab.active }">{{ tab.name }}</text>
			</view>
		</view>
		<view class="safe-bottom"></view>
	</view>
</template>

<script>
	export default {
		name: 'CustomTabbar',
		props: {
			current: {
				type: Number,
				default: 0
			}
		},
		data() {
			return {
				tabs: [
					{ name: '智能咨询', icon: 'chatbubble', page: '/pages/consult/consult', active: false },
					{ name: '智能文书', icon: 'paperplane', page: '/pages/document/document', active: false },
					{ name: '申报服务', icon: 'checkbox', page: '/pages/apply/apply', active: false },
					{ name: '个人中心', icon: 'person', page: '/pages/profile/profile', active: false }
				]
			}
		},
		created() {
			this.tabs.forEach((tab, i) => {
				tab.active = (i === this.current)
			})
		},
		methods: {
			switchTab(index) {
				if (index === this.current) return
				const page = this.tabs[index].page
				uni.reLaunch({ url: page })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.tabbar-wrap {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 999;
		background: rgba(255, 255, 255, 0.96);
		box-shadow: 0 -10rpx 30rpx rgba(18, 40, 95, 0.08);
		backdrop-filter: blur(16px);
	}

	.tabbar {
		display: flex;
		align-items: center;
		justify-content: space-around;
		height: 112rpx;
		padding: 12rpx 16rpx 10rpx;
	}

	.tab-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
		height: 92rpx;
		border-radius: 22rpx;
		transition: all 0.2s ease;
	}

	.tab-item.active {
		background: #e8efff;
	}

	.tab-icon-box {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 52rpx;
		height: 44rpx;
	}

	.tab-label {
		font-size: 18rpx;
		color: #9ca3af;
		margin-top: 6rpx;
		font-weight: 600;
	}

	.tab-label.active {
		color: #1e3a8a;
		font-weight: 800;
	}

	.safe-bottom {
		height: env(safe-area-inset-bottom);
	}
</style>
