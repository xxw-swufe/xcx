<template>
	<view class="page-container">
		<!-- 顶部导航 -->
		<view class="nav-header">
			<view class="back-btn" @click="goBack">
				<uni-icons type="left" size="18" color="#374151"></uni-icons>
			</view>
			<text class="nav-title">管行宝</text>
			<view class="nav-avatar">
				<uni-icons type="person" size="18" color="#FFFFFF"></uni-icons>
			</view>
		</view>

		<!-- 内容 -->
		<scroll-view class="content-area" scroll-y>
			<!-- Tab切换 -->
			<view class="tab-row">
				<view
					v-for="(tab, idx) in tabs"
					:key="idx"
					class="tab-item"
					:class="{ active: activeTab === idx }"
					@click="activeTab = idx"
				>
					<text class="tab-text" :class="{ active: activeTab === idx }">{{ tab }}</text>
				</view>
			</view>

			<!-- 订单列表 -->
			<view class="order-list">
				<view class="order-card" v-for="(order, idx) in filteredOrders" :key="idx">
					<view class="order-header">
						<view class="order-tag">
							<text class="order-tag-text">有效订阅</text>
						</view>
						<text class="order-title">{{ order.name }}</text>
					</view>
					<view class="order-detail">
						<text class="order-info">服务记录号 {{ order.recordNo }}</text>
						<text class="order-info">服务日期 {{ order.date }}</text>
						<text class="order-price">会员价格 ¥{{ order.price }}</text>
					</view>
					<view class="order-footer">
						<view class="order-status">
							<uni-icons type="checkmarkempty" size="16" color="#22c55e"></uni-icons>
							<text class="order-status-text">已完成</text>
						</view>
						<view class="order-btn">
							<text class="order-btn-text">管理订阅</text>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				activeTab: 0,
				tabs: ['全部', '待支付', '已完成'],
				orders: [
					{ name: '企业年度会员', recordNo: '#DF-8829-2024', date: '2024-12-15', price: '12,800.00', status: 'done' },
					{ name: '月度黄金会员', recordNo: '#DF-9015-2024', date: '2024-06-15', price: '198.00', status: 'done' }
				]
			}
		},
		computed: {
			filteredOrders() {
				if (this.activeTab === 0) return this.orders
				if (this.activeTab === 1) return this.orders.filter(o => o.status === 'pending')
				return this.orders.filter(o => o.status === 'done')
			}
		},
		methods: {
			goBack() { uni.navigateBack() }
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

	/* Tab */
	.tab-row { display: flex; gap: 12rpx; margin-bottom: 24rpx; }
	.tab-item {
		padding: 12rpx 28rpx; border-radius: 20rpx; background: #e0f2fe;
	}
	.tab-item.active { background: #1e3a8a; }
	.tab-text { font-size: 24rpx; color: #6b7280; font-weight: 600; }
	.tab-text.active { color: #ffffff; }

	/* 订单卡片 */
	.order-list { display: flex; flex-direction: column; gap: 20rpx; }
	.order-card {
		background: #ffffff; border-radius: 20rpx; padding: 28rpx;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
	}
	.order-header { display: flex; align-items: center; gap: 12rpx; margin-bottom: 16rpx; }
	.order-tag {
		background: #dcfce7; border-radius: 8rpx; padding: 4rpx 14rpx;
	}
	.order-tag-text { font-size: 20rpx; color: #16a34a; font-weight: 700; }
	.order-title { font-size: 30rpx; font-weight: 800; color: #1e1b4b; }

	.order-detail { margin-bottom: 20rpx; }
	.order-info { display: block; font-size: 24rpx; color: #6b7280; margin-bottom: 6rpx; }
	.order-price { display: block; font-size: 28rpx; color: #22c55e; font-weight: 700; margin-top: 10rpx; }

	.order-footer { display: flex; align-items: center; justify-content: space-between; }
	.order-status { display: flex; align-items: center; gap: 6rpx; }
	.order-status-text { font-size: 24rpx; color: #22c55e; font-weight: 600; }

	.order-btn {
		background: #1e3a8a; border-radius: 20rpx; padding: 10rpx 28rpx;
	}
	.order-btn-text { font-size: 24rpx; color: #ffffff; font-weight: 700; }
</style>
