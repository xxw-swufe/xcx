<template>
	<view class="page-container">
		<view class="nav-header">
			<view class="back-btn" @click="goBack">
				<uni-icons type="left" size="18" color="#374151"></uni-icons>
			</view>
			<text class="nav-title">订单管理</text>
			<view class="nav-avatar">
				<uni-icons type="person" size="18" color="#FFFFFF"></uni-icons>
			</view>
		</view>

		<scroll-view class="content-area" scroll-y>
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

			<view v-if="loading" class="empty-state">
				<text class="empty-text">正在加载订单...</text>
			</view>

			<view v-else-if="filteredOrders.length" class="order-list">
				<view class="order-card" v-for="order in filteredOrders" :key="order._id || order.orderNo">
					<view class="order-header">
						<view class="order-tag">
							<text class="order-tag-text">{{ order.status === 'paid' ? '已支付' : '待支付' }}</text>
						</view>
						<text class="order-title">{{ order.title || '订单' }}</text>
					</view>
					<view class="order-detail">
						<text class="order-info">订单号 {{ order.orderNo || '-' }}</text>
						<text class="order-info">创建时间 {{ formatTime(order.createdAt || order.created_at) }}</text>
						<text class="order-price">￥{{ formatAmount(order.amount) }}</text>
					</view>
					<view class="order-footer">
						<view class="order-status">
							<uni-icons
								:type="order.status === 'paid' ? 'checkmarkempty' : 'circle'"
								size="16"
								:color="order.status === 'paid' ? '#22c55e' : '#f59e0b'"
							></uni-icons>
							<text class="order-status-text">{{ order.status === 'paid' ? '已完成' : '待支付' }}</text>
						</view>
						<view class="order-btn" @click="goDetail(order)">
							<text class="order-btn-text">查看订单</text>
						</view>
					</view>
				</view>
			</view>

			<view v-else class="empty-state">
				<text class="empty-text">暂无订单</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import { getOrderList } from '@/utils/cloud-api'

export default {
	data() {
		return {
			activeTab: 0,
			loading: false,
			tabs: ['全部', '待支付', '已完成'],
			orders: []
		}
	},
	computed: {
		filteredOrders() {
			if (this.activeTab === 1) return this.orders.filter((o) => o.status !== 'paid')
			if (this.activeTab === 2) return this.orders.filter((o) => o.status === 'paid')
			return this.orders
		}
	},
	onShow() {
		this.loadOrders()
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		async loadOrders() {
			const userInfo = uni.getStorageSync('uni-id-pages-userInfo') || {}
			const userId = userInfo._id
			if (!userId) {
				this.orders = []
				return
			}

			this.loading = true
			try {
				const res = await getOrderList({ userId, limit: 50 })
				const list = (res && res.list) || []
				this.orders = list.map((item) => ({
					_id: item._id,
					orderNo: item.order_no || item.orderNo || '',
					title: item.title || '订单',
					amount: item.amount || 0,
					status: item.status || 'pending',
					createdAt: item.created_at || item.createdAt || 0
				}))
			} catch (error) {
				console.error('loadOrders failed', error)
				uni.showToast({ title: '订单加载失败', icon: 'none' })
				this.orders = []
			} finally {
				this.loading = false
			}
		},
		formatTime(value) {
			if (!value) return '-'
			const date = new Date(Number(value))
			if (Number.isNaN(date.getTime())) return '-'
			const y = date.getFullYear()
			const m = String(date.getMonth() + 1).padStart(2, '0')
			const d = String(date.getDate()).padStart(2, '0')
			return `${y}-${m}-${d}`
		},
		formatAmount(value) {
			const amount = Number(value) || 0
			return amount.toFixed(2)
		},
		goDetail(order) {
			if (!order || !order.orderNo) return
			uni.showToast({ title: `订单号：${order.orderNo}`, icon: 'none' })
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
		width: 48rpx; height: 48rpx; border-radius: 50%;
		background: linear-gradient(135deg, #f97316, #ea580c);
		display: flex; align-items: center; justify-content: center;
	}
	.content-area { flex: 1; overflow-y: auto; padding: 24rpx; box-sizing: border-box; }
	.tab-row { display: flex; gap: 12rpx; margin-bottom: 24rpx; }
	.tab-item { padding: 12rpx 28rpx; border-radius: 20rpx; background: #e0f2fe; }
	.tab-item.active { background: #1e3a8a; }
	.tab-text { font-size: 24rpx; color: #6b7280; font-weight: 600; }
	.tab-text.active { color: #ffffff; }
	.order-list { display: flex; flex-direction: column; gap: 20rpx; width: 100%; min-width: 0; box-sizing: border-box; }
	.order-card {
		width: 100%; min-width: 0; box-sizing: border-box;
		background: #ffffff; border-radius: 20rpx; padding: 28rpx;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
	}
	.order-header { display: flex; align-items: center; gap: 12rpx; margin-bottom: 16rpx; }
	.order-tag { background: #dcfce7; border-radius: 8rpx; padding: 4rpx 14rpx; }
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
	.empty-state {
		padding: 120rpx 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.empty-text {
		font-size: 26rpx;
		color: #94a3b8;
	}
</style>
