<template>
  <view class="consult-page">
    <view class="nav-header">
      <view class="nav-left">
        <view v-if="showBack" class="nav-back" @click="handleBack">
          <uni-icons type="left" size="18" color="#1e3a8a" />
        </view>
        <image class="nav-logo" src="/static/brand-icon.png" mode="aspectFit" />
        <view class="nav-title-group">
          <text class="nav-title">{{ pageTitle }}</text>
          <text class="nav-subtitle">{{ pageSubtitle }}</text>
        </view>
      </view>
      <view class="nav-avatar" @click="goProfile">
        <image class="avatar-img" :src="userProfile.avatar || defaultAvatar" mode="aspectFill" />
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
          <view v-if="msg.role === 'assistant'" class="msg-bubble bubble-ai" @longpress="copyMessage(msg)">
            <rich-text class="rich-content" :nodes="msg.html || defaultHtml(msg.content)" />
          </view>
          <view v-if="msg.role === 'user'" class="msg-bubble bubble-user" @longpress="copyMessage(msg)">
            <template v-if="msg.type === 'image'">
              <image class="chat-image" :src="msg.filePath" mode="widthFix" />
              <text class="msg-text file-note">{{ msg.content }}</text>
            </template>
            <template v-else-if="msg.type === 'audio'">
              <view class="audio-card">
                <uni-icons type="mic" size="18" color="#1e3a8a" />
                <view class="audio-info">
                  <text class="msg-text">{{ msg.content }}</text>
                  <text class="file-note">{{ msg.extra || '' }}</text>
                </view>
              </view>
            </template>
            <text v-else class="msg-text">{{ msg.content }}</text>
          </view>
          <view v-if="msg.role === 'user'" class="msg-avatar user-avatar">
            <image class="avatar-img" :src="userProfile.avatar || defaultAvatar" mode="aspectFill" />
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="input-area">
      <view v-if="pendingAttachments.length" class="pending-box">
        <view
          class="pending-item"
          v-for="(item, index) in pendingAttachments"
          :key="item.id"
        >
          <view class="pending-preview" v-if="item.type === 'image'">
            <image class="pending-image" :src="item.filePath" mode="aspectFill" />
          </view>
          <view class="pending-preview pending-audio" v-else-if="item.type === 'audio'">
            <uni-icons type="mic" size="18" color="#1e3a8a" />
          </view>
          <view class="pending-info">
            <text class="pending-title">{{ item.title }}</text>
            <text class="pending-subtitle">{{ item.subtitle }}</text>
          </view>
          <view class="pending-remove" @click="removePending(index)">
            <uni-icons type="closeempty" size="14" color="#9ca3af" />
          </view>
        </view>
      </view>

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
        <view class="quick-btn quick-clear" @click="clearLocalChat">
          <uni-icons type="trash" size="20" color="#FFFFFF" />
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

const DEFAULT_SESSION_KEY = 'consult-current-session-id'
const CLEARED_SESSION_KEY_SUFFIX = '-cleared'
const USER_PROFILE_KEY = 'userProfile'
const DEFAULT_AVATAR = '/static/logo.png'
const DEFAULT_NICKNAME = '用户'

export default {
  props: {
    scene: {
      type: String,
      default: 'general'
    },
    title: {
      type: String,
      default: '智能咨询'
    },
    showBack: {
      type: Boolean,
      default: false
    },
    backUrl: {
      type: String,
      default: ''
    },
    subtitle: {
      type: String,
      default: '只有你手动选中的附件，才会在点发送后一起发出'
    },
    sessionKey: {
      type: String,
      default: ''
    }
  },
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
      pendingAttachments: [],
      streamTimer: null,
      voiceStopTimer: null,
      userProfile: {
        nickname: DEFAULT_NICKNAME,
        avatar: DEFAULT_AVATAR
      },
      defaultAvatar: DEFAULT_AVATAR
    }
  },
  computed: {
    pageScene() {
      return this.scene || 'general'
    },
    pageTitle() {
      return this.title || '智能咨询'
    },
    pageSubtitle() {
      return this.subtitle || ''
    },
    storageSessionKey() {
      return this.sessionKey || `${DEFAULT_SESSION_KEY}-${this.pageScene}`
    },
    clearedSessionKey() {
      return `${this.storageSessionKey}${CLEARED_SESSION_KEY_SUFFIX}`
    }
  },
  onShow() {
    this.initializeChat()
  },
  onUnload() {
    this.clearTimers()
  },
  methods: {
    clearTimers() {
      if (this.streamTimer) {
        clearTimeout(this.streamTimer)
        this.streamTimer = null
      }
      if (this.voiceStopTimer) {
        clearTimeout(this.voiceStopTimer)
        this.voiceStopTimer = null
      }
    },
    loadUserProfile() {
      const profile = uni.getStorageSync(USER_PROFILE_KEY) || {}
      this.userProfile = {
        nickname: profile.nickname || DEFAULT_NICKNAME,
        avatar: profile.avatar || DEFAULT_AVATAR
      }
    },
    initializeChat() {
      this.loadUserProfile()
      this.ensureLoginAndLoad()
    },
    escapeHtml(text) {
      return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    },
    formatMarkdownInline(text) {
      const safeText = this.escapeHtml(text)

      return safeText
        .replace(/`([^`]+)`/g, '<code style="padding:2rpx 8rpx;border-radius:8rpx;background:#f1f5f9;color:#0f172a;font-family:monospace;font-size:24rpx;">$1</code>')
        .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700;color:#0f172a;">$1</strong>')
    },
    markdownToHtml(text) {
      const source = String(text || '').replace(/\r\n/g, '\n').trim()
      if (!source) {
        return '<p style="margin:0;color:#1e293b;font-size:14px;line-height:1.8;"></p>'
      }

      const lines = source.split('\n')
      const blocks = []
      let index = 0

      const isOrderedItem = (line) => /^\d+\.\s+/.test(line)
      const isUnorderedItem = (line) => /^[-*+]\s+/.test(line)
      const isListItem = (line) => isOrderedItem(line) || isUnorderedItem(line)
      const flushParagraph = (buffer) => {
        const content = buffer.join('<br/>')
        if (content) {
          blocks.push(`<p style="margin:0 0 18rpx;color:#1e293b;font-size:28rpx;line-height:1.7;">${this.formatMarkdownInline(content)}</p>`)
        }
        buffer.length = 0
      }

      while (index < lines.length) {
        const line = lines[index]
        const trimmed = line.trim()

        if (!trimmed) {
          index += 1
          continue
        }

        if (/^```/.test(trimmed)) {
          index += 1
          const codeLines = []
          while (index < lines.length && !/^```/.test(lines[index].trim())) {
            codeLines.push(lines[index])
            index += 1
          }
          if (index < lines.length) index += 1
          const codeText = this.escapeHtml(codeLines.join('\n'))
          blocks.push(
            `<pre style="margin:0 0 18rpx;padding:18rpx 20rpx;border-radius:16rpx;background:#f8fafc;color:#0f172a;font-size:24rpx;line-height:1.6;overflow:hidden;white-space:pre-wrap;word-break:break-all;"><code style="font-family:monospace;">${codeText}</code></pre>`
          )
          continue
        }

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
        if (headingMatch) {
          const level = headingMatch[1].length
          const fontSize = level === 1 ? '34rpx' : level === 2 ? '32rpx' : level === 3 ? '30rpx' : '28rpx'
          const marginBottom = level <= 2 ? '18rpx' : '14rpx'
          blocks.push(
            `<p style="margin:0 0 ${marginBottom};font-size:${fontSize};line-height:1.35;font-weight:700;color:#0f172a;">${this.formatMarkdownInline(headingMatch[2])}</p>`
          )
          index += 1
          continue
        }

        if (isListItem(trimmed)) {
          const ordered = isOrderedItem(trimmed)
          const tagName = ordered ? 'ol' : 'ul'
          const listItems = []

          while (index < lines.length) {
            const current = lines[index].trim()
            if (!current || (ordered ? !isOrderedItem(current) : !isUnorderedItem(current))) {
              break
            }
            const itemText = current.replace(ordered ? /^\d+\.\s+/ : /^[-*+]\s+/, '')
            listItems.push(`<li style="margin:0 0 10rpx;">${this.formatMarkdownInline(itemText)}</li>`)
            index += 1
          }

          blocks.push(
            `<${tagName} style="margin:0 0 18rpx;padding-left:36rpx;color:#1e293b;font-size:28rpx;line-height:1.7;">${listItems.join('')}</${tagName}>`
          )
          continue
        }

        const paragraphLines = [line]
        index += 1
        while (index < lines.length) {
          const nextLine = lines[index]
          const nextTrimmed = nextLine.trim()
          if (!nextTrimmed) {
            index += 1
            break
          }
          if (/^```/.test(nextTrimmed) || /^#{1,6}\s+/.test(nextTrimmed) || isListItem(nextTrimmed)) {
            break
          }
          paragraphLines.push(nextLine)
          index += 1
        }
        flushParagraph(paragraphLines)
      }

      return blocks.join('')
    },
    defaultHtml(text) {
      return this.markdownToHtml(text)
    },
    getCurrentUserInfo() {
      return uni.getStorageSync('uni-id-pages-userInfo') || {}
    },
    getWelcomeMessage() {
      const content = '你好，我是智能咨询助手。请先输入问题，或者手动添加图片、语音附件后再发送。'
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
      this.sessionId = uni.getStorageSync(this.storageSessionKey) || ''
      const isCleared = !!uni.getStorageSync(this.clearedSessionKey)

      if (isCleared) {
        this.sessionId = ''
      }

      if (this.loading) return
      if (this.initialized && isSameUser && this.messages.length) return

      if (isCleared) {
        if (!this.messages.length) {
          this.messages = [this.getWelcomeMessage()]
        }
        this.initialized = true
        this.scrollToBottom()
        return
      }

      this.loadSessions()
    },
    async loadSessions() {
      this.loading = true
      try {
        const sessionRes = await getAiSessions({
          userId: this.userId,
          scene: this.pageScene
        })
        const list = (sessionRes && sessionRes.list) || []

        if (!this.sessionId && list.length) {
          this.sessionId = list[0]._id
          uni.setStorageSync(this.storageSessionKey, this.sessionId)
          uni.removeStorageSync(this.clearedSessionKey)
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
          scene: this.pageScene,
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
    buildPendingSummary(text) {
      const parts = []
      if (text) parts.push(text)
      this.pendingAttachments.forEach((item) => {
        if (item.type === 'image') {
          parts.push(`图片附件：${item.title}`)
        } else if (item.type === 'audio') {
          parts.push(`语音附件：${item.title}`)
        }
      })
      return parts.join('\n')
    },
    async sendMessage() {
      const text = this.inputText.trim()
      if ((!text && !this.pendingAttachments.length) || this.sending) return

      if (!this.userId) {
        this.ensureLoginAndLoad()
        return
      }

      this.clearTimers()
      this.sending = true

      const summary = this.buildPendingSummary(text)
      this.messages.push({
        id: `user-${Date.now()}`,
        role: 'user',
        content: summary,
        type: 'text'
      })

      this.inputText = ''
      this.pendingAttachments = []
      this.scrollToBottom()

      const placeholder = this.createAssistantPlaceholder()

      try {
        const result = await sendAiMessage({
          userId: this.userId,
          sessionId: this.sessionId,
          content: summary,
          scene: this.pageScene
        })

        if (result && result.sessionId) {
          this.sessionId = result.sessionId
          uni.setStorageSync(this.storageSessionKey, this.sessionId)
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
      if (type === 'camera') {
        this.pickCameraImage()
        return
      }

      if (type === 'voice') {
        this.recordVoice()
        return
      }

      if (type === 'link') {
        this.pickClipboardLink()
      }
    },
    pickCameraImage() {
      uni.chooseImage({
        count: 1,
        sourceType: ['camera'],
        sizeType: ['compressed'],
        success: (res) => {
          const filePath = (res.tempFilePaths && res.tempFilePaths[0]) || ''
          const fileName = filePath ? filePath.split('/').pop() : '相机图片'
          this.pendingAttachments.push({
            id: `img-${Date.now()}`,
            type: 'image',
            title: fileName,
            subtitle: '等待发送',
            filePath
          })
          this.scrollToBottom()
          uni.showToast({ title: '图片已加入待发送区', icon: 'none' })
        },
        fail: () => {
          uni.showToast({ title: '未能打开摄像头', icon: 'none' })
        }
      })
    },
    recordVoice() {
      const recorder = uni.getRecorderManager()
      uni.showToast({ title: '开始录音，5秒后自动结束', icon: 'none' })

      recorder.offStop && recorder.offStop()
      recorder.onStop((res) => {
        const filePath = (res && res.tempFilePath) || ''
        this.pendingAttachments.push({
          id: `audio-${Date.now()}`,
          type: 'audio',
          title: '语音附件',
          subtitle: filePath ? '等待发送' : '录音已结束',
          filePath
        })
        this.scrollToBottom()
        uni.showToast({ title: '录音已加入待发送区', icon: 'none' })
      })

      recorder.start({ format: 'mp3' })
      this.voiceStopTimer = setTimeout(() => {
        try {
          recorder.stop()
        } catch (error) {
          console.error('stop recorder failed', error)
        }
      }, 5000)
    },
    pickClipboardLink() {
      uni.getClipboardData({
        success: (res) => {
          const url = String(res.data || '').trim()
          if (!/^https?:\/\//i.test(url)) {
            uni.showToast({ title: '请先复制一个网页链接到剪贴板', icon: 'none' })
            return
          }

          this.inputText = this.inputText ? `${this.inputText}\n${url}` : url
          uni.showToast({ title: '链接已填入输入框', icon: 'none' })
        },
        fail: () => {
          uni.showToast({ title: '无法读取剪贴板', icon: 'none' })
        }
      })
    },
    removePending(index) {
      this.pendingAttachments.splice(index, 1)
    },
    clearLocalChat() {
      this.clearTimers()
      this.inputText = ''
      this.scrollTop = 0
      this.messages = []
      this.pendingAttachments = []
      this.sessionId = ''
      this.initialized = false
      uni.removeStorageSync(this.storageSessionKey)
      uni.setStorageSync(this.clearedSessionKey, 1)
      uni.showToast({ title: '聊天记录已清空', icon: 'none' })
    },
    goUpload() {
      uni.navigateTo({ url: '/pages/consult/upload' })
    },
    goProfile() {
      uni.switchTab({ url: '/pages/profile/profile' })
    },
    handleBack() {
      if (this.backUrl) {
        uni.navigateTo({ url: this.backUrl })
        return
      }

      uni.navigateBack()
    },
    copyMessage(message) {
      const text = String(message && message.content ? message.content : '').trim()
      if (!text) return

      uni.showActionSheet({
        itemList: ['复制'],
        success: () => {
          uni.setClipboardData({
            data: text,
            success: () => {
              uni.showToast({ title: '已复制', icon: 'success' })
            },
            fail: () => {
              uni.showToast({ title: '复制失败', icon: 'none' })
            }
          })
        }
      })
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

.nav-back {
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  background: #eef4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12rpx;
  flex-shrink: 0;
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
  overflow: hidden;
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
  margin-left: 16rpx;
  overflow: hidden;
}

.avatar-img {
  width: 40rpx;
  height: 40rpx;
  border-radius: 8rpx;
}

.nav-avatar .avatar-img,
.msg-avatar .avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.msg-bubble {
  max-width: 540rpx;
  width: fit-content;
  min-width: 0;
  box-sizing: border-box;
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

.file-note {
  font-size: 22rpx;
  color: #64748b;
  margin-top: 8rpx;
}

.chat-image {
  width: 280rpx;
  border-radius: 16rpx;
  margin-bottom: 8rpx;
  background: #f8fafc;
}

.audio-card {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.audio-info {
  display: flex;
  flex-direction: column;
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

.pending-box {
  background: #f8fafc;
  border-radius: 18rpx;
  padding: 12rpx;
  margin-bottom: 12rpx;
}

.pending-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 10rpx 8rpx;
  border-radius: 14rpx;
  background: #ffffff;
  margin-bottom: 10rpx;
}

.pending-item:last-child {
  margin-bottom: 0;
}

.pending-preview {
  width: 68rpx;
  height: 68rpx;
  border-radius: 12rpx;
  background: #e2e8f0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.pending-audio {
  background: #dbeafe;
}

.pending-image {
  width: 68rpx;
  height: 68rpx;
}

.pending-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pending-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #1e293b;
}

.pending-subtitle {
  font-size: 22rpx;
  color: #64748b;
  margin-top: 4rpx;
}

.pending-remove {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
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

.quick-clear {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.26);
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
