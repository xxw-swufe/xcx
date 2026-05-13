<template>
  <view class="consult-page">
    <view class="nav-header">
      <view v-if="showBack" class="nav-left">
        <view class="nav-back" @click="handleBack">
          <uni-icons type="left" size="18" color="#1e3a8a" />
        </view>
        <image class="nav-logo" src="/static/brand-icon.png" mode="aspectFit" />
        <view class="nav-title-group">
          <text class="nav-title">{{ pageTitle }}</text>
          <text class="nav-subtitle">{{ pageSubtitle }}</text>
        </view>
      </view>
      <view v-else class="nav-left">
        <view class="nav-history-btn" @click="openSessionHistory">
          <uni-icons type="list" size="20" color="#1e3a8a" />
          <text class="history-label">历史</text>
        </view>
        <view class="nav-new-chat" @click="startNewChat">
          <uni-icons type="plusempty" size="18" color="#1e3a8a" />
          <text class="new-label">新对话</text>
        </view>
      </view>
      <view class="nav-right">
        <view v-if="showBack" class="nav-history-icon" @click="openSessionHistory">
          <uni-icons type="list" size="22" color="#1e3a8a" />
        </view>
        <view class="nav-avatar" @click="goProfile">
          <image class="avatar-img" :src="userProfile.avatar || defaultAvatar" mode="aspectFill" />
        </view>
      </view>
    </view>

    <!-- 历史会话弹窗 -->
    <uni-popup ref="historyPopup" type="left">
      <view class="history-drawer">
        <view class="history-header">
          <text class="history-title">往期对话</text>
          <view class="history-close" @click="closeSessionHistory">
            <uni-icons type="closeempty" size="20" color="#64748b" />
          </view>
        </view>
        
        <view class="history-search">
          <uni-icons type="search" size="16" color="#94a3b8" />
          <input 
            class="search-input" 
            v-model="sessionKeyword" 
            placeholder="搜索历史对话..." 
            placeholder-class="placeholder"
          />
        </view>

        <scroll-view class="history-list" scroll-y>
          <view 
            class="history-item" 
            v-for="session in filteredSessionList" 
            :key="session._id"
            :class="{ active: sessionId === session._id }"
            @click="selectSession(session)"
          >
            <view class="history-item-main">
              <view class="history-item-top">
                <uni-icons type="chatbubble" size="16" :color="sessionId === session._id ? '#2563eb' : '#64748b'" />
                <text class="history-item-title">{{ session.title || '新对话' }}</text>
              </view>
              <view class="history-item-bottom">
                <text class="history-item-time">{{ formatTime(session.updated_at) }}</text>
                <text class="history-item-count">{{ session.message_count || 0 }} 条消息</text>
              </view>
            </view>
            <view class="history-item-actions">
              <view class="action-icon" @click.stop="handleRenameSession(session)">
                <uni-icons type="compose" size="18" color="#94a3b8" />
              </view>
              <view class="action-icon" @click.stop="handleDeleteSession(session)">
                <uni-icons type="trash" size="18" color="#f87171" />
              </view>
            </view>
          </view>
          <view v-if="!filteredSessionList.length" class="history-empty">
            <uni-icons type="chat-filled" size="48" color="#e2e8f0" />
            <text class="empty-text">未找到相关对话</text>
          </view>
        </scroll-view>
        <view class="history-footer">
          <button class="new-chat-btn" @click="startNewChat">
            <uni-icons type="plusempty" size="18" color="#FFFFFF" />
            <text>开启全新对话</text>
          </button>
        </view>
      </view>
    </uni-popup>

    <!-- 重命名弹窗 -->
    <uni-popup ref="renamePopup" type="dialog">
      <uni-popup-dialog
        mode="input"
        title="重命名会话"
        :value="currentRenamingTitle"
        placeholder="请输入新标题"
        @confirm="confirmRename"
      />
    </uni-popup>

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
          <view class="msg-body">
            <view v-if="msg.role === 'assistant'" class="msg-bubble bubble-ai" @longpress="copyMessage(msg)">
              <view v-if="msg.quote" class="quote-content" @click="scrollToMessage(msg.quote.id)">
                <text class="quote-text" selectable="true">「 {{ msg.quote.content }} 」</text>
              </view>
              <rich-text v-if="msg.html" class="rich-content" :nodes="msg.html" user-select="true" />
              <view v-if="msg.downloadLinks && msg.downloadLinks.length" class="download-links">
              <view
                v-for="(link, linkIdx) in msg.downloadLinks"
                :key="link.url || linkIdx"
                class="download-link"
                @click.stop="downloadDocument(link)"
              >
                <view class="file-icon-box" :class="getFileTypeClass(link.url)">
                  <text class="file-icon-text">{{ getFileTypeLabel(link.url) }}</text>
                </view>
                <text class="download-link-text" selectable="true">{{ link.label }}</text>
                <uni-icons type="download" size="14" color="#94a3b8" />
              </view>
            </view>
              <view v-if="msg.expertCard" class="expert-card" @click.stop="openExpertCard(msg.expertCard)">
                <view class="expert-card-icon">
                  <text class="expert-card-icon-text">专</text>
                </view>
                <view class="expert-card-main">
                  <text class="expert-card-name" selectable="true">{{ msg.expertCard.name }}</text>
                  <text class="expert-card-subtitle">点击进入实时专家咨询</text>
                </view>
                <view class="expert-card-action">
                  <uni-icons type="right" size="16" color="#2563eb" />
                </view>
              </view>
            </view>
            <view v-if="msg.role === 'assistant'" class="msg-op-bar">
              <view class="op-btn" @click.stop="handleCopy(msg)">
                <uni-icons type="chatboxes" size="20" color="#1e3a8a" />
              </view>
            </view>
            <view v-if="msg.role === 'user'" class="msg-bubble bubble-user" @longpress="copyMessage(msg)">
              <view v-if="msg.quote" class="quote-content" @click="scrollToMessage(msg.quote.id)">
                <text class="quote-text" selectable="true">「 {{ msg.quote.content }} 」</text>
              </view>
              <template v-if="msg.type === 'image'">
                <image class="chat-image" :src="msg.filePath" mode="widthFix" />
                <text class="msg-text file-note" selectable="true">{{ msg.content }}</text>
              </template>
              <template v-else-if="msg.type === 'audio'">
                <view class="audio-card">
                  <uni-icons type="mic" size="18" color="#1e3a8a" />
                  <view class="audio-info">
                    <text class="msg-text" selectable="true">{{ msg.content }}</text>
                    <text class="file-note">{{ msg.extra || '' }}</text>
                  </view>
                </view>
              </template>
              <template v-else-if="msg.type === 'file'">
                <view class="audio-card">
                  <uni-icons type="paperclip" size="18" color="#1e3a8a" />
                  <view class="audio-info">
                    <text class="msg-text" selectable="true">{{ msg.content }}</text>
                    <text class="file-note">{{ msg.extra || '' }}</text>
                  </view>
                </view>
              </template>
              <text v-else class="msg-text" selectable="true">{{ msg.content }}</text>
            </view>
            <view v-if="msg.role === 'user'" class="msg-op-bar">
              <view class="op-btn" @click.stop="handleCopy(msg)">
                <uni-icons type="chatboxes" size="20" color="#1e3a8a" />
              </view>
            </view>
          </view>
          <view v-if="msg.role === 'user'" class="msg-avatar user-avatar">
            <image class="avatar-img" :src="userProfile.avatar || defaultAvatar" mode="aspectFill" />
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="input-area">
      <!-- 引用消息预览 -->
      <view v-if="quoteMessage" class="quote-preview">
        <view class="quote-inner">
          <text class="quote-title">引用内容：</text>
          <text class="quote-text">{{ quoteMessage.content }}</text>
        </view>
        <view class="quote-remove" @click="cancelQuote">
          <uni-icons type="closeempty" size="14" color="#94a3b8" />
        </view>
      </view>

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
          <view class="pending-preview pending-file" v-else-if="item.type === 'file'">
            <uni-icons type="paperclip" size="18" color="#1e3a8a" />
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
          <uni-icons type="trash" size="20" color="#6b7280" />
        </view>
        <view class="quick-btn quick-upload" @click="goUpload">
          <uni-icons type="paperclip" size="20" color="#FFFFFF" />
        </view>
      </view>

      <view class="input-row">
        <view class="voice-btn" @touchstart="startVoiceInput" @touchend="stopVoiceInput">
          <uni-icons type="mic" size="22" :color="isRecording ? '#2563eb' : '#6b7280'" />
        </view>
        <input
          class="chat-input"
          v-model="inputText"
          :placeholder="isRecording ? '正在听你说...' : '输入你的问题...'"
          confirm-type="send"
          @confirm="sendMessage"
        />
        <view class="send-btn" :class="{ disabled: sending }" @click="sendMessage">
          <uni-icons type="paperplane" size="18" color="#FFFFFF" />
        </view>
      </view>

      <!-- 语音识别动画遮罩 -->
      <view v-if="isRecording" class="recording-mask">
        <view class="recording-card">
          <view class="voice-waves">
            <view class="wave" v-for="i in 5" :key="i"></view>
          </view>
          <text class="recording-text">松开 发送</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getAiHistory, getAiSessions, sendAiMessage, deleteAiSession, updateAiSession, deleteAiMessage } from '@/utils/cloud-api'

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
      lastScene: '',
      sessionList: [],
      sessionKeyword: '',
      currentRenamingSession: null,
      currentRenamingTitle: '',
      quoteMessage: null,
      isRecording: false,
      recorderManager: null,
      pendingAttachments: [],
      uploadingAttachments: false,
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
    },
    filteredSessionList() {
      const q = this.sessionKeyword.trim().toLowerCase()
      if (!q) return this.sessionList
      return this.sessionList.filter(s => 
        (s.title || '').toLowerCase().includes(q) || 
        (s.last_message || '').toLowerCase().includes(q)
      )
    }
  },
  onShow() {
    this.initializeChat()
    // 监听文件上传完成事件
    uni.$off('upload-files-completed')
    uni.$on('upload-files-completed', (files) => {
      if (Array.isArray(files) && files.length > 0) {
        this.pendingAttachments = [...this.pendingAttachments, ...files]
        this.scrollToBottom()
      }
    })
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
      this.initVoice()
    },
    initVoice() {
      // #ifdef MP-WEIXIN
      this.recorderManager = uni.getRecorderManager()
      this.recorderManager.onStop((res) => {
        if (res.tempFilePath) {
          this.translateVoice(res.tempFilePath)
        }
      })
      // #endif
    },
    startVoiceInput() {
      // #ifndef MP-WEIXIN
      uni.showToast({ title: '语音转文字仅支持微信小程序', icon: 'none' })
      return
      // #endif
      
      this.isRecording = true
      this.recorderManager.start({
        duration: 60000,
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 96000,
        format: 'mp3'
      })
      uni.vibrateShort()
    },
    stopVoiceInput() {
      if (!this.isRecording) return
      this.isRecording = false
      this.recorderManager.stop()
    },
    translateVoice(filePath) {
      uni.showLoading({ title: '识别中...' })
      // 调用微信语音识别接口
      wx.translateVoice({
        filePath: filePath,
        isShowProgressTips: false,
        success: (res) => {
          if (res.translateResult) {
            this.inputText = (this.inputText || '') + res.translateResult
          }
        },
        fail: (err) => {
          console.error('语音识别失败', err)
          uni.showToast({ title: '未能识别出文字', icon: 'none' })
        },
        complete: () => {
          uni.hideLoading()
        }
      })
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
      if (!text) return ''
      let result = this.escapeHtml(text)

      // 1. 行内代码
      result = result.replace(/`([^`]+)`/g, '<code style="padding:2rpx 8rpx;border-radius:8rpx;background:#f1f5f9;color:#0f172a;font-family:monospace;font-size:24rpx;margin:0 4rpx;">$1</code>')

      // 2. 粗体 + 斜体 (***)
      result = result.replace(/\*\*\*(.+?)\*\*\*/g, '<strong style="font-weight:700;font-style:italic;color:#0f172a;">$1</strong>')
      result = result.replace(/___(.+?)___/g, '<strong style="font-weight:700;font-style:italic;color:#0f172a;">$1</strong>')

      // 3. 粗体 (**)
      result = result.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700;color:#0f172a;">$1</strong>')
      result = result.replace(/__(.+?)__/g, '<strong style="font-weight:700;color:#0f172a;">$1</strong>')

      // 4. 斜体 (*)
      result = result.replace(/\*(.+?)\*/g, '<em style="font-style:italic;color:#1e293b;">$1</em>')
      result = result.replace(/_(.+?)_/g, '<em style="font-style:italic;color:#1e293b;">$1</em>')

      // 5. 删除线 (~~)
      result = result.replace(/~~(.+?)~~/g, '<del style="text-decoration:line-through;color:#94a3b8;">$1</del>')

      // 6. 链接 [text](url)
      result = result.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi, '<span style="color:#2563eb;text-decoration:underline;word-break:break-all;">$1</span>')

      return result
    },
    markdownToHtml(text) {
      const source = String(text || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
      if (!source) return ''

      const lines = source.split('\n')
      const blocks = []
      let i = 0

      while (i < lines.length) {
        let line = lines[i]
        let trimmed = line.trim()

        if (!trimmed) {
          i++
          continue
        }

        // 1. 代码块 - 使用最稳妥的 pre 标签，并强制背景色
        if (trimmed.startsWith('```')) {
          i++
          const codeLines = []
          while (i < lines.length && !lines[i].trim().startsWith('```')) {
            codeLines.push(lines[i])
            i++
          }
          i++
          const codeText = this.escapeHtml(codeLines.join('\n'))
          blocks.push(`<div style="margin:12rpx 0;padding:20rpx;border-radius:12rpx;background:#1e293b;color:#f8fafc;font-size:24rpx;line-height:1.5;overflow-x:auto;"><pre style="white-space:pre;word-break:normal;margin:0;"><code style="font-family:monospace;">${codeText}</code></pre></div>`)
          continue
        }

        // 2. 标题 - 统一使用 div 模拟，避免默认 margin 干扰
        const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
        if (headerMatch) {
          const level = headerMatch[1].length
          const fontSize = [0, '36rpx', '32rpx', '30rpx', '28rpx', '26rpx', '24rpx'][level]
          blocks.push(`<div style="margin:20rpx 0 10rpx;font-size:${fontSize};font-weight:bold;color:#0f172a;line-height:1.4;">${this.formatMarkdownInline(headerMatch[2])}</div>`)
          i++
          continue
        }

        // 3. 引用 - 使用 div 模拟，border 更稳定
        if (trimmed.startsWith('>')) {
          const quoteLines = []
          while (i < lines.length && (lines[i].trim().startsWith('>') || (lines[i].trim() && !lines[i-1]?.trim().endsWith('  ')))) {
             if (lines[i].trim().startsWith('>')) {
               quoteLines.push(lines[i].trim().replace(/^>\s*/, ''))
             } else {
               quoteLines.push(lines[i].trim())
             }
             i++
          }
          blocks.push(`<div style="margin:16rpx 0;padding:12rpx 24rpx;border-left:8rpx solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:26rpx;line-height:1.6;border-radius:4rpx;">${this.formatMarkdownInline(quoteLines.join(' '))}</div>`)
          continue
        }

        // 4. 列表 - 核心修复：彻底解决缩进问题
        const listMatch = trimmed.match(/^([-*+]|\d+\.)\s+/)
        if (listMatch) {
          const isOrdered = /^\d/.test(listMatch[1])
          const items = []
          
          while (i < lines.length) {
            const currTrim = lines[i].trim()
            if (!currTrim) {
              if (i + 1 < lines.length && lines[i+1].trim().match(/^([-*+]|\d+\.)\s+/)) {
                i++
                continue
              } else {
                break
              }
            }
            const itemMatch = currTrim.match(/^([-*+]|\d+\.)\s+(.*)$/)
            if (itemMatch) {
              const marker = isOrdered ? itemMatch[1] : '•'
              items.push(`<div style="display:flex;flex-direction:row;margin-bottom:8rpx;align-items:flex-start;">
                <div style="width:32rpx;flex-shrink:0;color:#64748b;font-weight:bold;">${marker}</div>
                <div style="flex:1;">${this.formatMarkdownInline(itemMatch[2])}</div>
              </div>`)
              i++
            } else {
              if (items.length > 0) {
                const lastIdx = items.length - 1
                items[lastIdx] = items[lastIdx].replace(/<\/div>(\s*)<\/div>$/, ` ${this.formatMarkdownInline(currTrim)}</div></div>`)
                i++
              } else {
                break
              }
            }
          }
          blocks.push(`<div style="margin:16rpx 0;color:#334155;font-size:28rpx;line-height:1.6;">${items.join('')}</div>`)
          continue
        }

        // 5. 水平线
        if (/^([-*_])\1{2,}$/.test(trimmed)) {
          blocks.push('<div style="height:2rpx;background:#e2e8f0;margin:32rpx 0;overflow:hidden;"></div>')
          i++
          continue
        }

        // 6. 段落
        const paraLines = []
        while (i < lines.length && lines[i].trim()) {
          const t = lines[i].trim()
          if (t.startsWith('```') || t.match(/^#{1,6}\s+/) || t.match(/^([-*+]|\d+\.)\s+/) || t.startsWith('>') || /^([-*_])\1{2,}$/.test(t)) {
            break
          }
          paraLines.push(lines[i].trim())
          i++
        }
        if (paraLines.length) {
          blocks.push(`<div style="margin-bottom:16rpx;color:#1e293b;font-size:28rpx;line-height:1.7;word-wrap:break-word;">${this.formatMarkdownInline(paraLines.join(' '))}</div>`)
        }
      }

      return blocks.join('')
    },
    defaultHtml(text) {
      return this.markdownToHtml(text)
    },
    normalizeUrl(url) {
      let cleaned = String(url || '').trim()
      // 只去除末尾明显的中文标点和非单词字符的英文标点（保留 .pdf 这种后缀中的点）
      // 使用正则：如果点后面紧跟的是非字母数字，或者是字符串末尾且前面是字母数字，则可能是后缀，不应删除
      // 这里采用更简单稳妥的方法：只删除末尾的 [，。；;！!？?] 和紧跟在非字母数字后的句号
      return cleaned.replace(/[，。；;！!？?,]+$/, '').replace(/([^a-zA-Z0-9])\.$/, '$1')
    },
    getFileNameFromUrl(url) {
      if (!url) return '文件'
      const path = url.split('?')[0].split('#')[0]
      const parts = path.split('/')
      const lastPart = parts[parts.length - 1] || '文件'
      try {
        return decodeURIComponent(lastPart) || '文件'
      } catch (error) {
        return lastPart || '文件'
      }
    },
    isWordFileUrl(url) {
      if (!url) return false
      const path = url.split('?')[0].split('#')[0].toLowerCase()
      return /\.(doc|docx|pdf|xls|xlsx|ppt|pptx|txt|zip|rar)$/i.test(path)
    },
    extractDownloadLinks(text) {
      const source = String(text || '')
      const links = []
      
      // 策略 1: 贪婪捕捉以特定后缀结尾的 URL (这是最稳妥的方案，不依赖正则的复杂性)
      // 我们寻找 http，然后一直抓到 .pdf, .docx 等后缀出现为止
      const commonExtensions = ['pdf', 'docx', 'doc', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'txt', 'png', 'jpg', 'jpeg'];
      
      let tempText = source;
      
      // 先尝试寻找所有的 http 链接
      const httpIndices = [];
      let pos = tempText.indexOf('http');
      while (pos !== -1) {
        httpIndices.push(pos);
        pos = tempText.indexOf('http', pos + 4);
      }
      
      // 倒序处理，防止替换时位置错乱
      for (let i = httpIndices.length - 1; i >= 0; i--) {
        const start = httpIndices[i];
        // 从 http 开始向后寻找最近的空白字符或中文或引号
        let end = tempText.length;
        for (let j = start; j < tempText.length; j++) {
          const char = tempText[j];
          // 遇到空格、换行、双引号、或者是中文，则认为是 URL 的潜在结束
          if (/[\s"\u4e00-\u9fa5]/.test(char)) {
            end = j;
            break;
          }
        }
        
        let rawUrl = tempText.substring(start, end);
        
        // 核心加固：检查这个抓到的片段里是否包含我们要的后缀
        // 如果 rawUrl 看起来被截断了（比如后面紧跟着 .pdf），我们要把它补回来
        const lowerUrl = rawUrl.toLowerCase();
        let hasExt = commonExtensions.some(ext => lowerUrl.includes('.' + ext));
        
        // 如果没找到后缀，尝试继续向后探查，直到找到后缀或遇到真正的分隔符
        if (!hasExt) {
          const remaining = tempText.substring(end);
          for (const ext of commonExtensions) {
            const extIndex = remaining.toLowerCase().indexOf('.' + ext);
            if (extIndex !== -1) {
              // 找到了！补全它
              const bonus = remaining.substring(0, extIndex + ext.length + 1);
              // 检查 bonus 中是否包含空格，如果有空格说明不是同一个链接
              if (!/\s/.test(bonus)) {
                end += extIndex + ext.length + 1;
                rawUrl = tempText.substring(start, end);
                break;
              }
            }
          }
        }

        // 净化 URL：去掉末尾的标点（但保留后缀的点）
        const finalUrl = rawUrl.replace(/[，。；！!？?,)\]"']+$/, '');
        const fileName = this.getFileNameFromUrl(finalUrl);
        
        links.push({
          label: fileName,
          url: finalUrl
        });
        
        // 在正文中用图标占位
        tempText = tempText.substring(0, start) + `🔗[${fileName}]` + tempText.substring(end);
      }

      return {
        content: tempText.replace(/\n{3,}/g, '\n\n').trim(),
        links: links.reverse() // 恢复正序
      }
    },
    extractExpertCard(text) {
      const source = String(text || '')
      const hasExpertMarker = /专家咨询链接|专家姓名/.test(source)
      if (!hasExpertMarker) return null

      const markdownLink = source.match(/\[专家咨询链接\]\((https?:\/\/[^)\s]+)\)/i)
      const labelLink = source.match(/专家咨询链接\s*[：:]\s*(https?:\/\/[^\s)\]，。]+)/i)
      const urlMatch = labelLink || markdownLink || source.match(/https?:\/\/[^\s)\]，。]+/i)
      if (!urlMatch) return null

      const rawUrl = labelLink ? labelLink[1] : markdownLink ? markdownLink[1] : urlMatch[0]
      const url = String(rawUrl || '').replace(/[，。；;,.]+$/, '')
      if (!url) return null

      const nameMatch = source.match(/专家姓名\s*[：:]\s*([^\s\n\r，。]+)/)
      const name = nameMatch && nameMatch[1] ? nameMatch[1].trim() : '专家咨询'

      return {
        name,
        url
      }
    },
    removeExpertCardLines(text, card) {
      if (!card) return String(text || '')

      return String(text || '')
        .split('\n')
        .filter((line) => {
          const trimmed = line.trim()
          if (!trimmed) return true
          if (/专家咨询链接\s*[：:]/.test(trimmed)) return false
          if (/^\[专家咨询链接\]\(https?:\/\/[^)]+\)/i.test(trimmed)) return false
          if (/专家姓名\s*[：:]/.test(trimmed)) return false
          if (trimmed === card.url) return false
          return true
        })
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    },
    buildAssistantMessage(content, extra = {}) {
      const downloadBlock = this.extractDownloadLinks(content)
      const expertCard = this.extractExpertCard(content)
      const displayContent = this.removeExpertCardLines(downloadBlock.content, expertCard)

      return {
        ...extra,
        role: 'assistant',
        content,
        html: displayContent ? this.defaultHtml(displayContent) : '',
        expertCard,
        downloadLinks: downloadBlock.links
      }
    },
    getCurrentUserInfo() {
      return uni.getStorageSync('uni-id-pages-userInfo') || {}
    },
    getWelcomeMessage() {
      const content = '你好，我是智能咨询助手。请先输入问题，或者手动添加图片、语音附件后再发送。'
      return this.buildAssistantMessage(content, {
        id: 'welcome',
      })
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
      const isSameScene = this.lastScene === this.pageScene
      
      this.userId = userId
      this.lastScene = this.pageScene
      this.sessionId = uni.getStorageSync(this.storageSessionKey) || ''
      const isCleared = !!uni.getStorageSync(this.clearedSessionKey)

      if (isCleared) {
        this.sessionId = ''
      }

      if (this.loading) return
      
      // 增加场景校验：如果场景变了，必须重新加载
      if (this.initialized && isSameUser && isSameScene && this.messages.length) return

      // 如果场景变了，先清空当前消息列表，防止显示串味
      if (!isSameScene) {
        this.messages = []
        this.initialized = false
      }

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
        this.sessionList = (sessionRes && sessionRes.list) || []

        if (!this.sessionId && this.sessionList.length) {
          this.sessionId = this.sessionList[0]._id
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
        this.messages = list.map((item) => {
          if (item.role === 'assistant') {
            return this.buildAssistantMessage(item.content, {
              id: item._id
            })
          }

          return {
            id: item._id,
            role: item.role,
            content: item.content,
            html: ''
          }
        })
        this.scrollToBottom()
      } catch (error) {
        console.error('loadHistory failed', error)
      }
    },
    openSessionHistory() {
      this.$refs.historyPopup.open()
    },
    closeSessionHistory() {
      this.$refs.historyPopup.close()
    },
    async selectSession(session) {
      if (this.sessionId === session._id) {
        this.closeSessionHistory()
        return
      }
      
      this.sessionId = session._id
      this.quoteMessage = null
      this.pendingAttachments = []
      this.inputText = ''
      
      uni.setStorageSync(this.storageSessionKey, this.sessionId)
      uni.removeStorageSync(this.clearedSessionKey)
      
      this.closeSessionHistory()
      uni.showLoading({ title: '加载中...' })
      await this.loadHistory(this.sessionId)
      uni.hideLoading()
    },
    startNewChat() {
      this.sessionId = ''
      this.messages = [this.getWelcomeMessage()]
      this.quoteMessage = null
      this.pendingAttachments = []
      this.inputText = ''
      uni.removeStorageSync(this.storageSessionKey)
      uni.setStorageSync(this.clearedSessionKey, 1)
      this.closeSessionHistory()
      uni.showToast({ title: '新会话已开启', icon: 'none' })
    },
    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const now = new Date()
      const isToday = date.toDateString() === now.toDateString()
      
      if (isToday) {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      }
      return `${date.getMonth() + 1}月${date.getDate()}日`
    },
    handleRenameSession(session) {
      this.currentRenamingSession = session
      this.currentRenamingTitle = session.title || ''
      this.$refs.renamePopup.open()
    },
    async confirmRename(val) {
      const newTitle = val.trim()
      if (!newTitle || !this.currentRenamingSession) return
      
      uni.showLoading({ title: '修改中...' })
      try {
        await updateAiSession(this.currentRenamingSession._id, newTitle, this.userId)
        this.currentRenamingSession.title = newTitle
        uni.showToast({ title: '重命名成功', icon: 'success' })
      } catch (e) {
        uni.showToast({ title: '修改失败', icon: 'none' })
      } finally {
        uni.hideLoading()
        this.currentRenamingSession = null
      }
    },
    handleDeleteSession(session) {
      uni.showModal({
        title: '提示',
        content: '确定要删除这段对话吗？',
        confirmColor: '#f87171',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '删除中...' })
            try {
              await deleteAiSession(session._id, this.userId)
              const idx = this.sessionList.findIndex(s => s._id === session._id)
              if (idx > -1) this.sessionList.splice(idx, 1)
              
              if (this.sessionId === session._id) {
                this.startNewChat()
              }
              uni.showToast({ title: '已删除', icon: 'success' })
            } catch (e) {
              uni.showToast({ title: '删除失败', icon: 'none' })
            } finally {
              uni.hideLoading()
            }
          }
        }
      })
    },
    buildPendingSummary(text, attachments = this.pendingAttachments) {
      const parts = []
      if (text) parts.push(text)
      attachments.forEach((item) => {
        const fileUrl = item.fileUrl || item.url || item.fileID || ''
        if (item.type === 'image') {
          parts.push(`图片附件：${item.title}`)
        } else if (item.type === 'audio') {
          parts.push(`语音附件：${item.title}`)
        } else {
          parts.push(`文件附件：${item.title}`)
        }

        if (fileUrl) {
          parts.push(`附件地址：${fileUrl}`)
        }
      })
      return parts.join('\n')
    },
    getFileExt(fileName) {
      const match = String(fileName || '').match(/\.([^.?#/]+)$/)
      return match ? match[1].toLowerCase() : ''
    },
    getFileTypeClass(url) {
      const ext = this.getFileExt(url.split('?')[0].split('#')[0])
      if (['pdf'].includes(ext)) return 'icon-pdf'
      if (['doc', 'docx'].includes(ext)) return 'icon-word'
      if (['xls', 'xlsx'].includes(ext)) return 'icon-excel'
      if (['ppt', 'pptx'].includes(ext)) return 'icon-ppt'
      return 'icon-file'
    },
    getFileTypeLabel(url) {
      const ext = this.getFileExt(url.split('?')[0].split('#')[0])
      return ext.toUpperCase() || 'FILE'
    },
    getCloudPath(fileName) {
      const safeName = String(fileName || 'file').replace(/[\\/:*?"<>|#%&{}$!'@+=`]/g, '_')
      return `chat-attachments/${this.userId || 'anonymous'}/${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}`
    },
    uploadAttachment(item) {
      if (!item || !item.filePath) {
        return Promise.resolve(item)
      }

      if (item.fileID || item.fileUrl) {
        return Promise.resolve(item)
      }

      const cloudPath = this.getCloudPath(item.title)
      return uniCloud.uploadFile({
        filePath: item.filePath,
        cloudPath,
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent && progressEvent.total
            ? Math.round((progressEvent.loaded / progressEvent.total) * 100)
            : 0
          const index = this.pendingAttachments.findIndex((pending) => pending.id === item.id)
          if (index > -1) {
            this.$set(this.pendingAttachments, index, {
              ...this.pendingAttachments[index],
              subtitle: progress > 0 ? `上传中 ${progress}%` : '上传中'
            })
          }
        }
      }).then(async (res) => {
        const fileID = res.fileID || ''
        let fileUrl = fileID

        if (fileID && uniCloud.getTempFileURL) {
          try {
            const urlRes = await uniCloud.getTempFileURL({ fileList: [fileID] })
            const fileItem = urlRes && urlRes.fileList && urlRes.fileList[0]
            fileUrl = (fileItem && (fileItem.tempFileURL || fileItem.download_url)) || fileID
          } catch (error) {
            console.warn('get temp file url failed', error)
          }
        }

        const uploaded = {
          ...item,
          subtitle: '已上传',
          fileID,
          fileUrl,
          cloudPath
        }
        const index = this.pendingAttachments.findIndex((pending) => pending.id === item.id)
        if (index > -1) {
          this.$set(this.pendingAttachments, index, uploaded)
        }
        return uploaded
      })
    },
    async uploadPendingAttachments() {
      if (!this.pendingAttachments.length) return []
      this.uploadingAttachments = true
      try {
        const uploaded = []
        for (const item of this.pendingAttachments) {
          uploaded.push(await this.uploadAttachment(item))
        }
        return uploaded
      } finally {
        this.uploadingAttachments = false
      }
    },
    normalizeAttachmentForRequest(item) {
      return {
        type: item.type || 'file',
        name: item.title || '文件',
        url: item.fileUrl || item.fileID || '',
        fileID: item.fileID || '',
        size: item.fileSize || 0,
        ext: this.getFileExt(item.title)
      }
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

      let uploadedAttachments = []
      try {
        uploadedAttachments = await this.uploadPendingAttachments()
      } catch (error) {
        console.error('upload attachments failed', error)
        this.sending = false
        uni.showToast({ title: '附件上传失败', icon: 'none' })
        return
      }

      const requestAttachments = uploadedAttachments.map(this.normalizeAttachmentForRequest)
      
      // 1. 构建 UI 显示用的纯净内容
      const displayContent = this.buildPendingSummary(text, uploadedAttachments)
      const quote = (this.quoteMessage && this.quoteMessage.content) ? { ...this.quoteMessage } : null
      
      // 2. 将消息推入本地列表（UI 显示）
      this.messages.push({
        id: `user-${Date.now()}`,
        role: 'user',
        content: displayContent, 
        quote: quote,
        type: uploadedAttachments.length === 1 ? uploadedAttachments[0].type : 'text'
      })

      this.inputText = ''
      this.pendingAttachments = []
      this.quoteMessage = null // 发送后立即清除引用状态
      this.scrollToBottom()

      const placeholder = this.createAssistantPlaceholder()

      try {
        const result = await sendAiMessage({
          userId: this.userId,
          sessionId: this.sessionId,
          content: displayContent, // 发送纯净内容，引用由云函数处理
          scene: this.pageScene,
          quote: quote, // 单独传递引用对象
          attachments: requestAttachments
        })

        if (result && result.sessionId) {
          this.sessionId = result.sessionId
          uni.setStorageSync(this.storageSessionKey, this.sessionId)
          uni.removeStorageSync(this.clearedSessionKey)
        }

        const reply = (result && result.reply) || '暂时没有返回有效内容，请稍后重试。'
        await this.typewriterReply(placeholder, reply)
      } catch (error) {
        console.error('sendMessage failed', error)
        const message = (error && (error.message || error.msg)) || '发送失败，请稍后再试'
        uni.showToast({ title: message, icon: 'none' })
        // 添加 [DEBUG] 标签，确认是否加载了新代码
        await this.typewriterReply(placeholder, `[系统提示]：${message}`)
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
        html: '',
        expertCard: null,
        downloadLinks: []
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
            const finalMsg = this.buildAssistantMessage(text, {
              id: targetMsg.id
            })
            Object.assign(targetMsg, finalMsg)
            this.$set(this.messages, this.messages.length - 1, { ...targetMsg })
            this.scrollToBottom()
            resolve()
            return
          }

          targetMsg.content += chars[index]
          targetMsg.html = this.defaultHtml(targetMsg.content)
          targetMsg.expertCard = null
          targetMsg.downloadLinks = []
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
      if (typeof uni.chooseMessageFile === 'function') {
        uni.chooseMessageFile({
          count: 1,
          type: 'file',
          success: (res) => {
            const file = (res.tempFiles && res.tempFiles[0]) || {}
            const filePath = file.path || file.tempFilePath || ''
            const fileName = file.name || (filePath ? filePath.split('/').pop() : '文件')
            const isImage = /\.(png|jpe?g|gif|bmp|webp)$/i.test(fileName)
            this.pendingAttachments.push({
              id: `${isImage ? 'img' : 'file'}-${Date.now()}`,
              type: isImage ? 'image' : 'file',
              title: fileName,
              subtitle: '等待发送',
              filePath,
              fileSize: file.size || 0
            })
            this.scrollToBottom()
            uni.showToast({ title: '文件已加入待发送区', icon: 'none' })
          },
          fail: () => {
            uni.showToast({ title: '未能选择文件', icon: 'none' })
          }
        })
        return
      }

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
    openExpertCard(card) {
      if (!card || !card.url) return

      const url = `/pages/consult/expert-webview?url=${encodeURIComponent(card.url)}&name=${encodeURIComponent(card.name || '专家咨询')}`
      uni.navigateTo({
        url,
        fail: () => {
          uni.setClipboardData({
            data: card.url,
            success: () => {
              uni.showToast({ title: '链接已复制', icon: 'none' })
            }
          })
        }
      })
    },
    downloadDocument(link) {
      const url = this.normalizeUrl(link && link.url)
      if (!url) return

      const fileName = (link && link.label) || this.getFileNameFromUrl(url)
      const path = url.split('?')[0].split('#')[0].toLowerCase()
      
      // 判断是否为支持直接打开的文件类型
      const isFile = this.isWordFileUrl(url) || path.endsWith('.pdf') || path.endsWith('.ppt') || path.endsWith('.pptx')

      if (isFile) {
        uni.showLoading({ title: '正在下载文件' })
        uni.downloadFile({
          url,
          success: (res) => {
            if (!res || res.statusCode !== 200 || !res.tempFilePath) {
              uni.hideLoading()
              uni.showToast({ title: '下载失败', icon: 'none' })
              return
            }

            const ext = path.split('.').pop()
            uni.openDocument({
              filePath: res.tempFilePath,
              fileType: ext,
              success: () => {
                uni.hideLoading()
              },
              fail: () => {
                uni.hideLoading()
                uni.showToast({ title: '暂不支持打开此类型文件', icon: 'none' })
              }
            })
          },
          fail: () => {
            uni.hideLoading()
            uni.showToast({ title: '文件下载失败', icon: 'none' })
          }
        })
      } else {
        // 普通网页链接，尝试在 web-view 打开，或复制到剪贴板
        uni.showActionSheet({
          itemList: ['直接打开链接', '复制链接'],
          success: (e) => {
            if (e.tapIndex === 0) {
              uni.navigateTo({
                url: `/pages/consult/expert-webview?url=${encodeURIComponent(url)}&name=${encodeURIComponent(fileName)}`,
                fail: () => {
                  uni.setClipboardData({ data: url })
                }
              })
            } else {
              uni.setClipboardData({
                data: url,
                success: () => uni.showToast({ title: '链接已复制', icon: 'none' })
              })
            }
          }
        })
      }
    },
    handleBack() {
      if (this.backUrl) {
        uni.navigateTo({ url: this.backUrl })
        return
      }

      uni.navigateBack()
    },
    handleCopy(message) {
      const text = String(message && message.content ? message.content : '').trim()
      if (!text) return
      
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({ title: '内容已复制', icon: 'success' })
        }
      })
    },
    copyMessage(message) {
      const text = String(message && message.content ? message.content : '').trim()
      if (!text) return

      uni.showActionSheet({
        itemList: ['引用回复', '复制文字', '删除此条消息', '重新发送'],
        success: (e) => {
          if (e.tapIndex === 0) {
            this.quoteMessage = {
              id: message.id,
              content: text.length > 50 ? text.slice(0, 50) + '...' : text
            }
          } else if (e.tapIndex === 1) {
            uni.setClipboardData({
              data: text,
              success: () => {
                uni.showToast({ title: '已复制', icon: 'success' })
              }
            })
          } else if (e.tapIndex === 2) {
            this.handleDeleteMessage(message)
          } else if (e.tapIndex === 3) {
            if (message.role === 'user') {
              this.inputText = message.content
              uni.showToast({ title: '已填入输入框', icon: 'none' })
            } else {
              uni.showToast({ title: '仅支持重新发送用户消息', icon: 'none' })
            }
          }
        }
      })
    },
    async handleDeleteMessage(message) {
      if (String(message.id).startsWith('user-') || String(message.id).startsWith('assistant-')) {
        // 本地临时消息
        const idx = this.messages.findIndex(m => m.id === message.id)
        if (idx > -1) this.messages.splice(idx, 1)
        return
      }

      uni.showLoading({ title: '删除中...' })
      try {
        await deleteAiMessage(message.id, this.userId)
        const idx = this.messages.findIndex(m => m.id === message.id)
        if (idx > -1) this.messages.splice(idx, 1)
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch (e) {
        uni.showToast({ title: '删除失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
    cancelQuote() {
      this.quoteMessage = null
    },
    scrollToMessage(id) {
      // 简单模拟跳转，实际可结合 selectorQuery
      uni.showToast({ title: '正在定位消息...', icon: 'none' })
    },
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

.nav-right {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.nav-history-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 14rpx;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #e2e8f0;
}

.nav-history-btn, .nav-new-chat {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  background: #f0f7ff;
  border-radius: 12rpx;
  margin-right: 16rpx;
  border: 1rpx solid #dbeafe;
}

.history-label, .new-label {
  font-size: 24rpx;
  color: #1e3a8a;
  font-weight: 600;
}

/* 历史记录侧边栏样式 */
.history-drawer {
  width: 620rpx;
  height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  box-shadow: 4rpx 0 20rpx rgba(0, 0, 0, 0.1);
}

.history-search {
  margin: 0 32rpx 20rpx;
  padding: 16rpx 24rpx;
  background: #f1f5f9;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  
  .search-input {
    flex: 1;
    font-size: 26rpx;
    color: #1e293b;
  }
  
  .placeholder {
    color: #94a3b8;
  }
}

.history-header {
  padding: 40rpx 32rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #0f172a;
}

.history-list {
  flex: 1;
}

.history-item {
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f8fafc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
  
  &:active {
    background: #f1f5f9;
  }
  
  &.active {
    background: #eff6ff;
    border-left: 8rpx solid #2563eb;
    padding-left: 24rpx;
    
    .history-item-title {
      color: #2563eb;
    }
  }
}

.history-item-main {
  flex: 1;
  min-width: 0;
  margin-right: 20rpx;
}

.history-item-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.action-icon {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  background: #f8fafc;
  
  &:active {
    background: #e2e8f0;
  }
}

.history-item-top {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.history-item-title {
  font-size: 28rpx;
  color: #1e293b;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-item-time {
  font-size: 22rpx;
  color: #94a3b8;
}

.history-item-count {
  font-size: 22rpx;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2rpx 12rpx;
  border-radius: 20rpx;
}

.history-empty {
  padding: 100rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.empty-text {
  font-size: 26rpx;
  color: #94a3b8;
}

.history-footer {
  padding: 32rpx;
  border-top: 1rpx solid #f1f5f9;
}

.new-chat-btn {
  background: #2563eb;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 600;
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(37, 99, 235, 0.3);
  
  &:active {
    opacity: 0.9;
    transform: scale(0.98);
  }
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

.msg-body {
  display: flex;
  flex-direction: column;
  max-width: 540rpx;
}

.msg-right .msg-body {
  align-items: flex-end;
}

.msg-left .msg-body {
  align-items: flex-start;
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
  user-select: text;
  -webkit-user-select: text;
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
  user-select: text;
  -webkit-user-select: text;
}

.download-links {
  margin-top: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.download-link {
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  background: #f8fafc;
  border: 1rpx solid #e2e8f0;
  border-radius: 16rpx;
  gap: 20rpx;
  transition: all 0.2s;
  
  &:active {
    background: #f1f5f9;
    transform: scale(0.98);
  }
}

.file-icon-box {
  width: 72rpx;
  height: 72rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &.icon-pdf { background: #fee2e2; .file-icon-text { color: #dc2626; } }
  &.icon-word { background: #e0e7ff; .file-icon-text { color: #2563eb; } }
  &.icon-excel { background: #dcfce7; .file-icon-text { color: #16a34a; } }
  &.icon-ppt { background: #ffedd5; .file-icon-text { color: #ea580c; } }
  &.icon-file { background: #f1f5f9; .file-icon-text { color: #475569; } }
}

.file-icon-text {
  font-size: 20rpx;
  font-weight: 800;
}

.download-link-text {
  flex: 1;
  color: #334155;
  font-size: 26rpx;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.msg-op-bar {
  display: flex;
  margin-top: 8rpx;
  padding: 0 4rpx;
}

.op-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 14rpx;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid #e2e8f0;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.9);
    background: #eef4ff;
    border-color: #dbeafe;
  }
}

.expert-card {
  margin-top: 16rpx;
  padding: 20rpx;
  border: 1rpx solid #bfdbfe;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 8rpx 20rpx rgba(37, 99, 235, 0.1);
}

.expert-card-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  background: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.expert-card-icon-text {
  font-size: 28rpx;
  font-weight: 800;
  color: #ffffff;
}

.expert-card-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.expert-card-name {
  font-size: 28rpx;
  font-weight: 800;
  color: #1e3a8a;
  line-height: 1.35;
}

.expert-card-subtitle {
  margin-top: 6rpx;
  font-size: 23rpx;
  color: #64748b;
  line-height: 1.4;
}

.expert-card-action {
  width: 42rpx;
  height: 42rpx;
  border-radius: 50%;
  background: #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.input-area {
  background: rgba(255, 255, 255, 0.94);
  padding: 16rpx 24rpx 12rpx;
  border-top: 1rpx solid #e5e7eb;
  flex-shrink: 0;
  position: relative;
}

.quote-preview {
  margin: 0 0 16rpx;
  padding: 16rpx 20rpx;
  background: #f8fafc;
  border-radius: 12rpx;
  border-left: 6rpx solid #2563eb;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  
  .quote-inner {
    flex: 1;
    min-width: 0;
  }
  
  .quote-title {
    font-size: 22rpx;
    color: #2563eb;
    font-weight: 700;
    display: block;
    margin-bottom: 4rpx;
  }
  
  .quote-text {
    font-size: 24rpx;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
}

.quote-content {
  margin-bottom: 12rpx;
  padding: 8rpx 16rpx;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8rpx;
  border-left: 4rpx solid #94a3b8;
  
  .quote-text {
    font-size: 24rpx;
    color: #64748b;
    font-style: italic;
  }
}

.bubble-user .quote-content {
  background: rgba(255, 255, 255, 0.2);
  border-left-color: #2563eb;
  .quote-text { color: #1e3a8a; }
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

.pending-file {
  background: #e0f2fe;
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
  background: #f1f5f9;
  box-shadow: none;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.voice-btn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 50%;
  transition: all 0.2s;
  
  &:active {
    background: #e2e8f0;
    transform: scale(0.9);
  }
}

.chat-input {
  flex: 1;
  height: 80rpx;
  background: #f1f5f9;
  border-radius: 40rpx;
  padding: 0 32rpx;
  font-size: 28rpx;
  color: #1e293b;
}

/* 录音遮罩样式 */
.recording-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recording-card {
  width: 320rpx;
  height: 320rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
}

.voice-waves {
  display: flex;
  align-items: flex-end;
  gap: 8rpx;
  height: 60rpx;
  margin-bottom: 32rpx;
}

.wave {
  width: 8rpx;
  background: #2563eb;
  border-radius: 4rpx;
  animation: wave-anim 0.6s infinite ease-in-out;
  
  @for $i from 1 through 5 {
    &:nth-child(#{$i}) {
      height: 20rpx + random(40rpx);
      animation-delay: 0.1s * $i;
    }
  }
}

@keyframes wave-anim {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.5); }
}

.recording-text {
  font-size: 28rpx;
  color: #1e293b;
  font-weight: 600;
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
