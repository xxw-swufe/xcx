<template>
  <view class="consult-page">
    <view class="nav-header">
      <view class="nav-left">
        <image class="nav-logo" src="/static/brand-icon.png" mode="aspectFit" />
        <view class="nav-title-group">
          <text class="nav-title">智能咨询</text>
          <text class="nav-subtitle">在线问答 · 记录同步 · 流式展示</text>
        </view>
      </view>
      <view class="nav-avatar" @click="goProfile">
        <uni-icons type="person" size="20" color="#FFFFFF" />
      </view>
    </view>

    <scroll-view class="chat-area" scroll-y :scroll-top="scrollTop" :scroll-with-animation="true">
      <view class="chat-list">
        <view
          v-for="(msg, idx) in messages"
          :key="msg.id || idx"
          class="msg-wrap"
          :class="msg.role === 'user' ? 'msg-right' : 'msg-left'"
        >
          <view v-if="msg.role === 'assistant'" class="msg-avatar ai-avatar">
            <image class="avatar-img" src="/static/brand-icon.png" mode="aspectFit" />
          </view>
          <view v-if="msg.role === 'assistant'" class="msg-bubble bubble-ai">
            <rich-text class="rich-content" :nodes="msg.html || defaultHtml(msg.content)" />
          </view>
          <view v-if="msg.role === 'user'" class="msg-bubble bubble-user">
            <text class="msg-text">{{ msg.content }}</text>
          </view>
          <view v-if="msg.role === 'user'" class="msg-avatar user-avatar">
            <uni-icons type="person" size="18" color="#FFFFFF" />
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="input-area">
      <view class="quick-actions">
        <view class="quick-btn" @click="handleAction('camera')">
          <uni-icons type="camera" size="20" color="#6b7280" />
        </view>
        <view class="quick-btn" @click="handleAction('voice')">
          <uni-icons type="mic" size="20" color="#6b7280" />
        </view>
        <view class="quick-btn" @click="handleAction('link')">
          <uni-icons type="link" size="20" color="#6b7280" />
        </view>
        <view class="quick-btn quick-upload" @click="goUpload">
          <uni-icons type="paperclip" size="20" color="#FFFFFF" />
        </view>
      </view>
      <view class="input-row">
        <input
          class="chat-input"
          v-model="inputText"
          placeholder="输入你的问题..."
          confirm-type="send"
          @confirm="sendMessage"
        />
        <view class="send-btn" :class="{ disabled: sending }" @click="sendMessage">
          <uni-icons type="paperplane" size="18" color="#FFFFFF" />
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getAiHistory, getAiSessions, sendAiMessage } from '@/utils/cloud-api'

const SESSION_KEY = 'consult-current-session-id'

export default {
  data() {
    return {
      inputText: '',
      scrollTop: 0,
      sending: false,
      loading: false,
      initialized: false,
      sessionId: '',
      userId: '',
      messages: [],
      streamTimer: null
    }
  },
  onShow() {
    this.ensureLoginAndLoad()
  },
  onUnload() {
    this.clearStreamTimer()
  },
  methods: {
    clearStreamTimer() {
      if (this.streamTimer) {
        clearTimeout(this.streamTimer)
        this.streamTimer = null
      }
    },
    escapeHtml(text) {
      return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    },
    defaultHtml(text) {
      return `<p style="color:#1e293b;font-size:14px;line-height:1.8;">${this.escapeHtml(text)}</p>`
    },
    getCurrentUserInfo() {
      return uni.getStorageSync('uni-id-pages-userInfo') || {}
    },
    getWelcomeMessage() {
      const content = '你好，我是智能咨询助手。你可以直接输入问题，我会帮你整理答复。'
      return {
        id: 'welcome',
        role: 'assistant',
        content,
        html: this.defaultHtml(content)
      }
    },
    ensureLoginAndLoad() {
      const userInfo = this.getCurrentUserInfo()
      const userId = userInfo && userInfo._id
      if (!userId) {
        uni.showToast({ title: '请先登录后再使用智能咨询', icon: 'none' })
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/login/login' })
        }, 300)
        return
      }

      const isSameUser = this.userId && this.userId === userId
      this.userId = userId
      this.sessionId = uni.getStorageSync(SESSION_KEY) || ''

      if (this.loading) return
      if (this.initialized && isSameUser && this.messages.length) return

      this.loadSessions()
    },
    async loadSessions() {
      this.loading = true
      try {
        const sessionRes = await getAiSessions(this.userId)
        const list = (sessionRes && sessionRes.list) || []

        if (!this.sessionId && list.length) {
          this.sessionId = list[0]._id
          uni.setStorageSync(SESSION_KEY, this.sessionId)
        }

        if (this.sessionId) {
          await this.loadHistory(this.sessionId)
        }

        if (!this.messages.length) {
          this.messages = [this.getWelcomeMessage()]
        }

        this.initialized = true
        this.scrollToBottom()
      } catch (error) {
        console.error('loadSessions failed', error)
        if (!this.messages.length) {
          this.messages = [this.getWelcomeMessage()]
        }
      } finally {
        this.loading = false
      }
    },
    async loadHistory(sessionId) {
      try {
        const historyRes = await getAiHistory({
          userId: this.userId,
          sessionId,
          limit: 50
        })
        const list = (historyRes && historyRes.list) || []
        this.messages = list.map((item) => ({
          id: item._id,
          role: item.role,
          content: item.content,
          html: item.role === 'assistant' ? this.defaultHtml(item.content) : ''
        }))
      } catch (error) {
        console.error('loadHistory failed', error)
      }
    },
    async sendMessage() {
      const text = this.inputText.trim()
      if (!text || this.sending) return

      if (!this.userId) {
        this.ensureLoginAndLoad()
        return
      }

      this.clearStreamTimer()
      this.sending = true
      const userMsg = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text
      }
      this.messages.push(userMsg)
      this.inputText = ''
      this.scrollToBottom()

      const placeholder = this.createAssistantPlaceholder()

      try {
        const result = await sendAiMessage({
          userId: this.userId,
          sessionId: this.sessionId,
          content: text,
          scene: 'general'
        })

        if (result && result.sessionId) {
          this.sessionId = result.sessionId
          uni.setStorageSync(SESSION_KEY, this.sessionId)
        }

        const reply = (result && result.reply) || '暂时没有返回有效内容，请稍后重试。'
        await this.typewriterReply(placeholder, reply)
      } catch (error) {
        console.error('sendMessage failed', error)
        const message = (error && error.message) || '发送失败，请稍后再试'
        uni.showToast({ title: message, icon: 'none' })
        await this.typewriterReply(placeholder, '当前服务暂不可用，请稍后再试。')
      } finally {
        this.sending = false
        this.scrollToBottom()
      }
    },
    createAssistantPlaceholder() {
      const msg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        html: this.defaultHtml('')
      }
      this.messages.push(msg)
      this.scrollToBottom()
      return msg
    },
    typewriterReply(targetMsg, text) {
      return new Promise((resolve) => {
        const chars = String(text || '').split('')
        let index = 0

        const tick = () => {
          if (!targetMsg) {
            resolve()
            return
          }

          if (index >= chars.length) {
            targetMsg.content = text
            targetMsg.html = this.defaultHtml(text)
            this.$set(this.messages, this.messages.length - 1, { ...targetMsg })
            this.scrollToBottom()
            resolve()
            return
          }

          targetMsg.content += chars[index]
          targetMsg.html = this.defaultHtml(targetMsg.content)
          this.$set(this.messages, this.messages.length - 1, { ...targetMsg })
          index += 1
          this.scrollToBottom()
          this.streamTimer = setTimeout(tick, 18)
        }

        tick()
      })
    },
    scrollToBottom() {
      this.$nextTick(() => {
        this.scrollTop += 9999
      })
    },
    handleAction(type) {
      const labels = {
        camera: '摄像头',
        voice: '麦克风',
        link: '网页链接'
      }
      uni.showToast({ title: `${labels[type]}入口暂时保留`, icon: 'none' })
    },
    goUpload() {
      uni.navigateTo({ url: '/pages/consult/upload' })
    },
    goProfile() {
      uni.switchTab({ url: '/pages/profile/profile' })
    }
  }
}
</script>

<style lang="scss" scoped>
.consult-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(30, 58, 138, 0.12), transparent 28%),
    linear-gradient(180deg, #eef4ff 0%, #f6f8fc 42%, #edf2f7 100%);
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--status-bar-height, 44px) + 16rpx) 28rpx 16rpx;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(14px);
  box-shadow: 0 2rpx 18rpx rgba(15, 23, 42, 0.05);
  flex-shrink: 0;
}

.nav-left {
  display: flex;
  align-items: center;
}

.nav-logo {
  width: 56rpx;
  height: 56rpx;
  border-radius: 12rpx;
  margin-right: 16rpx;
}

.nav-title-group {
  display: flex;
  flex-direction: column;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #1e2d6d;
}

.nav-subtitle {
  font-size: 18rpx;
  color: #6b7280;
  margin-top: 4rpx;
}

.nav-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(59, 130, 246, 0.28);
}

.chat-area {
  flex: 1;
  overflow-y: auto;
}

.chat-list {
  padding: 24rpx 24rpx 16rpx;
}

.msg-wrap {
  display: flex;
  align-items: flex-start;
  margin-bottom: 28rpx;
}

.msg-right {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-avatar {
  background: #e8edf5;
  margin-right: 16rpx;
}

.user-avatar {
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  margin-left: 16rpx;
}

.avatar-img {
  width: 40rpx;
  height: 40rpx;
  border-radius: 8rpx;
}

.msg-bubble {
  max-width: 540rpx;
  padding: 24rpx 28rpx;
  line-height: 1.7;
}

.bubble-ai {
  background: #ffffff;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.07);
  border-radius: 4rpx 20rpx 20rpx 20rpx;
}

.bubble-user {
  background: #dbeafe;
  border-radius: 20rpx 4rpx 20rpx 20rpx;
}

.msg-text {
  font-size: 28rpx;
  line-height: 1.7;
  color: #1e293b;
  white-space: pre-wrap;
}

.rich-content {
  font-size: 28rpx;
  line-height: 1.7;
}

.input-area {
  background: rgba(255, 255, 255, 0.94);
  padding: 16rpx 24rpx 12rpx;
  border-top: 1rpx solid #e5e7eb;
  flex-shrink: 0;
}

.quick-actions {
  display: flex;
  gap: 14rpx;
  margin-bottom: 14rpx;
}

.quick-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 16rpx;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-upload {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 4rpx 12rpx rgba(59, 130, 246, 0.3);
}

.input-row {
  display: flex;
  align-items: center;
}

.chat-input {
  flex: 1;
  height: 72rpx;
  background: #f1f5f9;
  border-radius: 36rpx;
  padding: 0 28rpx;
  font-size: 26rpx;
  color: #1e293b;
}

.send-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1e3a8a);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(30, 58, 138, 0.3);
}

.send-btn.disabled {
  opacity: 0.7;
}
</style>
