<template>
	<view class="page-container">
		<!-- 顶部导航 -->
		<view class="nav-header">
			<view class="back-btn" @click="goBack">
				<uni-icons type="left" size="18" color="#374151"></uni-icons>
			</view>
			<text class="nav-title">帮助中心</text>
			<view class="nav-avatar">
				<uni-icons type="person" size="18" color="#FFFFFF"></uni-icons>
			</view>
		</view>

		<!-- 内容 -->
		<scroll-view class="content-area" scroll-y>
			<!-- 搜索 -->
			<view class="search-bar">
				<uni-icons type="search" size="18" color="#9ca3af"></uni-icons>
				<input class="search-input" placeholder="搜索帮助内容..." v-model="keyword" />
			</view>

			<!-- 常见问题 -->
			<view class="section">
				<text class="section-label">常见问题</text>
				<view class="faq-list">
					<view
						class="faq-item"
						v-for="(item, idx) in filteredFaq"
						:key="idx"
						@click="toggleFaq(idx)"
					>
						<view class="faq-question">
							<text class="faq-q-text">{{ item.q }}</text>
							<uni-icons
								:type="item.open ? 'up' : 'down'"
								size="14"
								color="#9ca3af"
							></uni-icons>
						</view>
						<view class="faq-answer" v-if="item.open">
							<text class="faq-a-text">{{ item.a }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 联系我们 -->
			<view class="section">
				<text class="section-label">联系我们</text>
				<view class="contact-card">
					<view class="contact-item">
						<uni-icons type="phone" size="20" color="#3b82f6"></uni-icons>
						<view class="contact-info">
							<text class="contact-name">客服热线</text>
							<text class="contact-value">400-888-6688</text>
						</view>
					</view>
					<view class="contact-item">
						<uni-icons type="email" size="20" color="#3b82f6"></uni-icons>
						<view class="contact-info">
							<text class="contact-name">邮箱支持</text>
							<text class="contact-value">support@guanxingbao.com</text>
						</view>
					</view>
					<view class="contact-item">
						<uni-icons type="chat" size="20" color="#3b82f6"></uni-icons>
						<view class="contact-info">
							<text class="contact-name">在线客服</text>
							<text class="contact-value">工作日 9:00 - 18:00</text>
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
				keyword: '',
				faqList: [
					{ q: '如何注册管行宝账号？', a: '在登录页面点击"微信登录"或输入手机号获取验证码即可快速注册。', open: false },
					{ q: '会员订阅如何取消？', a: '进入"个人中心 → 我的订单"，找到对应订阅点击"管理订阅"即可取消自动续费。', open: false },
					{ q: '智能文书生成的文件在哪里查看？', a: '生成完成后会自动保存到"智能文书"页面的"最近文书"列表中。', open: false },
					{ q: '如何修改个人资料？', a: '进入"个人中心"，点击右上角头像区域即可进入资料编辑页面。', open: false },
					{ q: '施工方案报告支持导出吗？', a: '会员用户支持导出PDF和Word格式，非会员仅支持在线预览。', open: false }
				]
			}
		},
		computed: {
			filteredFaq() {
				if (!this.keyword.trim()) return this.faqList
				return this.faqList.filter(item =>
					item.q.includes(this.keyword) || item.a.includes(this.keyword)
				)
			}
		},
		methods: {
			goBack() { uni.navigateBack() },
			toggleFaq(idx) {
				this.faqList[idx].open = !this.faqList[idx].open
				this.$set(this.faqList, idx, this.faqList[idx])
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

	/* 搜索栏 */
	.search-bar {
		display: flex; align-items: center; background: #ffffff; border-radius: 20rpx;
		padding: 0 24rpx; height: 72rpx; margin-bottom: 28rpx;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
	}
	.search-input { flex: 1; height: 72rpx; font-size: 26rpx; color: #1e293b; margin-left: 12rpx; }

	.section { margin-bottom: 28rpx; }
	.section-label { display: block; font-size: 24rpx; font-weight: 700; color: #6b7280; margin-bottom: 14rpx; padding-left: 8rpx; }

	/* FAQ列表 */
	.faq-list {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		background: #ffffff; border-radius: 20rpx; overflow: hidden;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
	}
	.faq-item { border-bottom: 1rpx solid #f1f5f9; }
	.faq-item:last-child { border-bottom: none; }
	.faq-question {
		display: flex; align-items: center; justify-content: space-between;
		padding: 28rpx 24rpx;
	}
	.faq-q-text { font-size: 28rpx; color: #1e293b; font-weight: 600; flex: 1; }
	.faq-answer { padding: 0 24rpx 24rpx; }
	.faq-a-text { font-size: 26rpx; color: #6b7280; line-height: 1.7; }

	/* 联系我们 */
	.contact-card {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		background: #ffffff; border-radius: 20rpx; padding: 24rpx;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
	}
	.contact-item {
		display: flex; align-items: center; padding: 20rpx 0;
		border-bottom: 1rpx solid #f1f5f9;
	}
	.contact-item:last-child { border-bottom: none; }
	.contact-info { margin-left: 20rpx; }
	.contact-name { display: block; font-size: 26rpx; color: #1e293b; font-weight: 600; }
	.contact-value { display: block; font-size: 22rpx; color: #6b7280; margin-top: 4rpx; }
</style>
