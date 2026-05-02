<template>
	<view class="home-page">
		<text class="home-title">管行宝</text>
		<text class="home-subtitle">首页</text>
		<text class="home-hint">登录成功，欢迎使用</text>
	</view>
</template>

<script>
	export default {
		data() {
			return {}
		}
	}
</script>

<style lang="scss" scoped>
	.home-page {
		min-height: 100vh;
		background: #F5F8FC;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.home-title {
		font-size: 56rpx;
		font-weight: bold;
		color: #07127A;
		margin-bottom: 16rpx;
	}

	.home-subtitle {
		font-size: 32rpx;
		color: #333;
		margin-bottom: 24rpx;
	}

	.home-hint {
		font-size: 26rpx;
		color: #999;
	}
</style>
