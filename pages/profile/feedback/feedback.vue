<template>
	<view class="page-container">
		<!-- 顶部导航 -->
		<view class="nav-header">
			<view class="back-btn" @click="goBack">
				<uni-icons type="left" size="18" color="#374151"></uni-icons>
			</view>
			<text class="nav-title">管行宝</text>
			<view class="nav-right">
				<text class="nav-subtitle">问题反馈</text>
				<view class="nav-avatar">
					<uni-icons type="person" size="16" color="#FFFFFF"></uni-icons>
				</view>
			</view>
		</view>

		<!-- 内容 -->
		<scroll-view class="content-area" scroll-y>
			<view class="form-card">
				<text class="form-title">问题反馈</text>
				<text class="form-subtitle">您的反馈对我们改进工业作业流程至关重要。请详细描述您遇到的问题或建议。</text>

				<!-- 问题描述 -->
				<view class="form-section">
					<text class="form-label">问题详细描述</text>
					<view class="textarea-wrap">
						<textarea
							class="textarea"
							v-model="content"
							placeholder="请详细描述问题发生的背景、过程以及造成的影响..."
							maxlength="500"
						></textarea>
						<text class="char-count">{{ content.length }} / 500</text>
					</view>
				</view>

				<!-- 上传证据 -->
				<view class="form-section">
					<text class="form-label">上传现场证据（可选）</text>
					<view class="upload-row">
						<view class="upload-add" @click="chooseImage">
							<uni-icons type="camera" size="32" color="#93c5fd"></uni-icons>
							<text class="upload-add-text">添加图片</text>
						</view>
						<view class="upload-preview" v-if="imageUrl">
							<image class="preview-img" :src="imageUrl" mode="aspectFill"></image>
						</view>
					</view>
					<text class="upload-hint">支持 JPG、PNG 格式，单张不超过 10MB</text>
				</view>

				<!-- 提交按钮 -->
				<view class="submit-btn" @click="handleSubmit">
					<text class="submit-text">提交反馈报告</text>
					<uni-icons type="right" size="16" color="#FFFFFF"></uni-icons>
				</view>
				<text class="draft-link" @click="handleDraft">暂存至草稿箱</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				content: '',
				imageUrl: ''
			}
		},
		methods: {
			goBack() { uni.navigateBack() },
			chooseImage() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						this.imageUrl = res.tempFilePaths[0]
					}
				})
			},
			handleSubmit() {
				if (!this.content.trim()) {
					uni.showToast({ title: '请填写问题描述', icon: 'none' })
					return
				}
				uni.showToast({ title: '反馈提交成功', icon: 'success' })
				setTimeout(() => { uni.navigateBack() }, 800)
			},
			handleDraft() {
				uni.showToast({ title: '已暂存至草稿箱', icon: 'none' })
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
	.nav-right { display: flex; align-items: center; gap: 12rpx; }
	.nav-subtitle { font-size: 22rpx; color: #6b7280; }
	.nav-avatar {
		width: 44rpx; height: 44rpx; border-radius: 50%; background: linear-gradient(135deg, #f97316, #ea580c);
		display: flex; align-items: center; justify-content: center;
	}

	.content-area { flex: 1; overflow-y: auto; padding: 24rpx; box-sizing: border-box; }

	.form-card {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		background: #ffffff; border-radius: 24rpx; padding: 32rpx;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
	}
	.form-title { display: block; font-size: 34rpx; font-weight: 800; color: #1e1b4b; margin-bottom: 10rpx; }
	.form-subtitle { display: block; font-size: 24rpx; color: #6b7280; line-height: 1.6; margin-bottom: 32rpx; }

	.form-section { margin-bottom: 32rpx; }
	.form-label { display: block; font-size: 26rpx; font-weight: 700; color: #374151; margin-bottom: 14rpx; }

	.textarea-wrap {
		background: #f8fafc; border: 2rpx solid #bfdbfe; border-radius: 16rpx; padding: 20rpx;
	}
	.textarea {
		width: 100%; height: 200rpx; font-size: 26rpx; color: #1e293b; line-height: 1.6;
	}
	.char-count { display: block; text-align: right; font-size: 20rpx; color: #9ca3af; margin-top: 8rpx; }

	.upload-row { display: flex; gap: 16rpx; width: 100%; min-width: 0; box-sizing: border-box; }
	.upload-add {
		width: 160rpx; height: 160rpx; border-radius: 16rpx; background: #f0f7ff;
		border: 2rpx dashed #93c5fd; display: flex; flex-direction: column;
		align-items: center; justify-content: center;
	}
	.upload-add-text { font-size: 20rpx; color: #6b7280; margin-top: 8rpx; }
	.upload-preview {
		width: 160rpx; height: 160rpx; border-radius: 16rpx; overflow: hidden;
	}
	.preview-img { width: 160rpx; height: 160rpx; }
	.upload-hint { display: block; font-size: 20rpx; color: #9ca3af; margin-top: 12rpx; }

	.submit-btn {
		height: 92rpx; border-radius: 48rpx; background: linear-gradient(135deg, #1e3a8a, #1e2d6d);
		display: flex; align-items: center; justify-content: center;
		box-shadow: 0 12rpx 24rpx rgba(30,58,138,0.25); margin-top: 16rpx;
	}
	.submit-text { font-size: 30rpx; color: #ffffff; font-weight: 700; margin-right: 8rpx; }

	.draft-link {
		display: block; text-align: center; font-size: 24rpx; color: #9ca3af;
		margin-top: 20rpx; text-decoration: underline;
	}
</style>
