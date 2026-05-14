'use strict';

const http = require('http');
const https = require('https');

const db = uniCloud.database();
const dbCmd = db.command;

const DEFAULT_COZE_API_BASE = 'https://api.coze.cn';
const DEFAULT_COZE_BOT_ID = '7619186763315249193';
const DEFAULT_COZE_TOKEN = 'sat_hBYTVDXcBXZEj30zDcCNwEZ4S6cGetB4uYvhupH2wefPDfcSZ8GtETvAdxMz7ZCh';
const COZE_TIMEOUT = [300000, 300000];
const HISTORY_MESSAGE_LIMIT = 24;
const HISTORY_CONTEXT_CHAR_LIMIT = 12000;
const BOT_ID_MAP = {
  general: process.env.COZE_BOT_ID_GENERAL || process.env.COZE_BOT_ID || DEFAULT_COZE_BOT_ID,
  letter: process.env.COZE_BOT_ID_LETTER || '7633245375314329600',
  document: process.env.COZE_BOT_ID_DOCUMENT || process.env.COZE_BOT_ID || DEFAULT_COZE_BOT_ID,
  policy: process.env.COZE_BOT_ID_POLICY || process.env.COZE_BOT_ID || DEFAULT_COZE_BOT_ID,
  department: process.env.COZE_BOT_ID_DEPARTMENT || process.env.COZE_BOT_ID || DEFAULT_COZE_BOT_ID
};

function success(data = {}) {
  return { code: 0, message: 'ok', data };
}

function fail(message, code = 400) {
  return { code, message, data: null };
}

function now() {
  return Date.now();
}

function getCurrentUid() {
  const currentUserInfo = uniCloud.getCurrentUserInfo && uniCloud.getCurrentUserInfo();
  return (currentUserInfo && (currentUserInfo.uid || currentUserInfo._id)) || '';
}

function getRequesterUid(event) {
  return getCurrentUid() || event.userId || '';
}

function getCozeConfig() {
  return {
    token: process.env.COZE_API_TOKEN || process.env.COZE_BOT_TOKEN || DEFAULT_COZE_TOKEN,
    apiBase: process.env.COZE_API_BASE || DEFAULT_COZE_API_BASE,
    streamRunUrl: process.env.COZE_STREAM_RUN_URL || '',
    projectId: process.env.COZE_PROJECT_ID || ''
  };
}

function getBotId(scene) {
  return BOT_ID_MAP[scene] || BOT_ID_MAP.general;
}

function compactText(value, maxLength = 1200) {
  const text = String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

async function getRecentHistoryMessages(userId, sessionId, scene) {
  if (!userId || !sessionId) return [];

  const result = await db.collection('chat_messages')
    .where({
      user_id: userId,
      session_id: sessionId,
      scene
    })
    .orderBy('created_at', 'desc')
    .limit(HISTORY_MESSAGE_LIMIT)
    .get();

  return ((result && result.data) || []).reverse();
}

function buildHistoryContext(messages) {
  if (!Array.isArray(messages) || !messages.length) return '';

  const lines = [];
  for (const message of messages) {
    const role = message.role === 'assistant' ? '助手' : message.role === 'user' ? '用户' : '系统';
    const content = compactText(message.content, 900);
    if (!content) continue;
    lines.push(`${role}：${content}`);
  }

  let context = lines.join('\n\n');
  if (context.length > HISTORY_CONTEXT_CHAR_LIMIT) {
    context = context.slice(context.length - HISTORY_CONTEXT_CHAR_LIMIT);
    const firstBreak = context.indexOf('\n\n');
    if (firstBreak > -1) {
      context = context.slice(firstBreak + 2);
    }
  }

  return context.trim();
}

function hasFragmentedCozeHistory(messages, currentConversationId) {
  if (!currentConversationId || !Array.isArray(messages) || !messages.length) return false;

  return messages.some((message) => {
    if (!message || message.role !== 'assistant') return false;
    const response = message.raw_response || {};
    const messageConversationId = response.conversationId || response.conversation_id || '';
    return messageConversationId && messageConversationId !== currentConversationId;
  });
}

function buildCozeInput({ content, quote, historyContext }) {
  const currentContent = String(content || '').trim();
  const quoteContent = quote && typeof quote.content === 'string'
    ? compactText(quote.content, 1200)
    : '';

  if (!historyContext && !quoteContent) {
    return currentContent;
  }

  const sections = [];

  if (historyContext) {
    sections.push(
      '[本次会话的历史上下文]\n' +
      '以下内容来自当前历史会话的真实聊天记录。回答用户当前问题时必须参考这些历史；如果用户询问“之前说过什么”“总共和你说了哪些话”等，请依据这里的历史记录回答，不要只看当前这一句。\n' +
      historyContext
    );
  }

  if (quoteContent) {
    sections.push(`用户引用了之前的消息：\n${quoteContent}`);
  }

  sections.push(`请回答用户这次的问题：\n${currentContent}`);

  return sections.join('\n\n---\n\n');
}

function isHttpUrl(url) {
  return /^https?:\/\//i.test(String(url || '').trim());
}

function stripAttachmentSummary(content) {
  const text = String(content || '');
  return text
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      return !/^(图片附件|语音附件|文件附件|附件地址)：/.test(trimmed);
    })
    .join('\n')
    .trim();
}

function getAttachmentType(item = {}) {
  const ext = String(item.ext || item.name || item.url || item.fileID || '').split('?')[0].split('#')[0].split('.').pop().toLowerCase();
  if (item.type === 'image' || ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
  if (item.type === 'audio' || ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'amr'].includes(ext)) return 'audio';
  return 'file';
}

function buildCozeUserMessage(content, attachments = []) {
  const httpAttachments = (Array.isArray(attachments) ? attachments : [])
    .map((item) => {
      const url = item.url || item.fileUrl || item.fileID || '';
      return {
        ...item,
        url
      };
    })
    .filter((item) => isHttpUrl(item.url));

  if (!httpAttachments.length) {
    return {
      content: String(content),
      content_type: 'text',
      role: 'user'
    };
  }

  const text = stripAttachmentSummary(content) || String(content || '').trim() || '请查看附件。';
  const objectContent = [
    ...httpAttachments.map((item) => ({
      type: getAttachmentType(item),
      file_url: item.url
    })),
    {
      type: 'text',
      text
    }
  ];

  return {
    content: JSON.stringify(objectContent),
    content_type: 'object_string',
    role: 'user'
  };
}

function getTraceInfo(res) {
  const headers = (res && res.headers) || {};
  return {
    statusCode: res && typeof res.statusCode === 'number' ? res.statusCode : 0,
    xLogId: headers['x-tt-logid'] || headers['X-TT-Logid'] || '',
    xTraceId: headers['x-tt-trace-id'] || headers['X-TT-Trace-Id'] || '',
    contentType: headers['content-type'] || headers['Content-Type'] || ''
  };
}

function safeJsonParse(value) {
  if (value == null || typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    return value;
  }
}

function toPlainObject(value) {
  const parsed = safeJsonParse(value);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  return {};
}

function stringifyForDisplay(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'string') {
    const parsed = safeJsonParse(value);
    if (parsed !== value) return stringifyForDisplay(parsed);
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}

function normalizeText(value) {
  if (value == null) return '';
  if (typeof value === 'string') {
    const parsed = safeJsonParse(value);
    if (parsed !== value) return normalizeText(parsed);
    return value;
  }
  if (Array.isArray(value)) {
    let result = '';
    for (const item of value) {
      const text = normalizeText(item);
      if (text) result += text;
    }
    return result;
  }
  if (typeof value.text === 'string') return value.text;
  if (typeof value.content === 'string') return value.content;
  if (typeof value.output === 'string') return value.output;
  if (value.message) return normalizeText(value.message);
  if (value.data) return normalizeText(value.data);
  return '';
}

function getNestedPayload(parsed) {
  if (!parsed) return {};
  return {
    ...toPlainObject(parsed.data && parsed.data.content),
    ...toPlainObject(parsed.event && parsed.event.content),
    ...toPlainObject(parsed.content)
  };
}

function isKnowledgeCozeEvent(messageType, payload = {}, data = {}) {
  const text = [
    messageType,
    payload.msg_type,
    payload.name,
    payload.tool_name,
    payload.function_name,
    payload.from_module,
    payload.from_unit,
    data.msg_type,
    data.name,
    data.tool_name,
    data.function_name,
    data.from_module,
    data.from_unit
  ].filter(Boolean).join(' ').toLowerCase();

  return /knowledge|knowledge_recall|dataset|recall/.test(text);
}

function getCozeConversationId(event, data) {
  return (
    data.conversation_id ||
    data.conversation?.id ||
    data.conversationId ||
    event.conversation_id ||
    event.conversation?.id ||
    event.conversationId ||
    data.chat?.conversation_id ||
    data.chat?.conversation?.id ||
    ''
  );
}

function parseSseBlock(block) {
  const lines = String(block || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const eventLine = lines.find((line) => line.startsWith('event:'));
  const dataLines = lines.filter((line) => line.startsWith('data:'));
  if (!dataLines.length) return null;

  const eventName = eventLine ? eventLine.replace(/^event:\s?/, '') : '';
  const payloadText = dataLines.map((line) => line.replace(/^data:\s?/, '')).join('\n');
  if (!payloadText || payloadText === '[DONE]') {
    return { eventName, done: true };
  }

  const event = JSON.parse(payloadText);
  const data = event.data || event;
  const messageType = event.type || data.type || '';
  const role = event.role || data.role || '';
  const content = event.content ?? data.content;

  return {
    eventName,
    event,
    data,
    messageType,
    role,
    content,
    conversationId: getCozeConversationId(event, data)
  };
}

function updateReplyFromSse(parsed, state) {
  if (!parsed || parsed.done) return;

  const { eventName, data, event, messageType, role, content } = parsed;
  if (parsed.conversationId && !state.conversationId) {
    state.conversationId = parsed.conversationId;
  }

  if (eventName === 'conversation.message.delta') {
    const deltaText = normalizeText(content);
    if (deltaText) state.reply += deltaText;
    return;
  }

  if (eventName === 'conversation.message.completed') {
    if (role === 'assistant' && messageType === 'answer') {
      const fullText = normalizeText(content);
      if (fullText) state.reply = fullText;
    }
    return;
  }

  if (eventName === 'conversation.chat.completed') {
    const status = data.status;
    if (status === 'requires_action') {
      state.reply = 'Bot 需要调用工具，但当前环境未配置工具回调。请检查 Bot 配置，关闭不需要的插件或工作流。';
    } else if (status === 'failed') {
      const lastError = data.last_error || event.last_error || {};
      state.reply = `对话失败：${lastError.msg || lastError.message || '未知错误'}`;
    }
    return;
  }

  if (messageType === 'answer' && role === 'assistant') {
    const textReply = normalizeText(content);
    if (textReply) state.reply = textReply;
  }
}

function getEventTitle(messageType, eventName, data = {}, payload = {}) {
  const lowerType = String(messageType || '').toLowerCase();
  if (isKnowledgeCozeEvent(messageType, payload, data)) return '检索知识库';
  if (lowerType === 'knowledge') return '检索知识库';
  if (lowerType === 'function_call') {
    const name = payload.name || payload.tool_name || payload.function_name || data.name || data.tool_name || data.function_name || '';
    return name ? `调用工具：${name}` : '调用工具';
  }
  if (lowerType === 'tool_response' || lowerType === 'tool_output') {
    const name = payload.name || payload.tool_name || payload.function_name || data.name || data.tool_name || data.function_name || '';
    return name ? `工具返回：${name}` : '工具返回';
  }
  if (lowerType === 'verbose') {
    const name = payload.from_unit || payload.from_module || payload.msg_type || data.from_unit || data.from_module || data.msg_type || '';
    return name ? `工作流输出：${name}` : '工作流输出';
  }
  if (lowerType === 'follow_up') return '生成追问建议';
  if (eventName === 'conversation.chat.created') return '创建 Coze 会话';
  if (eventName === 'conversation.chat.in_progress') return '智能体开始执行';
  if (eventName === 'conversation.chat.completed') {
    if (data.status === 'failed') return '执行失败';
    if (data.status === 'requires_action') return '等待工具处理';
    return '执行完成';
  }
  return '智能体事件';
}

function getEventContent(parsed) {
  if (!parsed || parsed.done) return '';

  const { data, event, messageType, content, eventName } = parsed;
  const lowerType = String(messageType || '').toLowerCase();
  const payload = getNestedPayload(parsed);
  if (isKnowledgeCozeEvent(messageType, payload, data)) {
    return '';
  }

  let text = normalizeText(content);

  if (!text && lowerType === 'function_call') {
    const name = payload.name || payload.tool_name || payload.function_name || data.name || data.tool_name || data.function_name || event.name || '';
    const args = payload.arguments || payload.args || payload.parameters || data.arguments || data.args || data.parameters || '';
    const thought = payload.thought || data.thought || '';
    text = [
      name ? `工具：${name}` : '',
      args ? `参数：${stringifyForDisplay(args)}` : '',
      thought ? `思路：${thought}` : ''
    ].filter(Boolean).join('\n');
  }

  if (!text && (lowerType === 'tool_response' || lowerType === 'tool_output')) {
    const output =
      payload.response_for_model ||
      payload.output ||
      payload.result ||
      payload.response ||
      payload.data ||
      data.output ||
      data.result ||
      data.response ||
      data.content ||
      event.output ||
      '';
    text = normalizeText(output) || stringifyForDisplay(output);
  }

  if (!text && lowerType === 'verbose') {
    const verboseData = payload.data || payload.message || payload.content || data.content || data.message || data.data || '';
    const meta = [payload.from_module || data.from_module, payload.from_unit || data.from_unit, payload.msg_type || data.msg_type]
      .filter(Boolean)
      .join(' / ');
    text = [meta, normalizeText(verboseData) || stringifyForDisplay(verboseData)].filter(Boolean).join('\n');
  }

  if (!text && lowerType === 'knowledge') {
    const knowledgeText =
      payload.query ||
      payload.keyword ||
      payload.content ||
      payload.output ||
      payload.result ||
      data.query ||
      data.keyword ||
      data.content ||
      '';
    text = normalizeText(knowledgeText) || stringifyForDisplay(knowledgeText);
  }

  if (!text && eventName === 'conversation.chat.completed') {
    const error = data.last_error || event.last_error || {};
    text = error.msg || error.message || (data.status ? `状态：${data.status}` : '');
  }

  if (!text && data.status && eventName !== 'conversation.message.delta') {
    text = `状态：${data.status}`;
  }

  return compactText(text, 1200);
}

function shouldPersistCozeEvent(parsed) {
  if (!parsed || parsed.done) return false;
  const lowerType = String(parsed.messageType || '').toLowerCase();
  if (parsed.eventName === 'conversation.message.delta') return false;
  if (parsed.eventName === 'conversation.message.completed' && lowerType === 'answer') return false;
  if (parsed.eventName === 'conversation.message.completed') return lowerType !== 'answer';
  if (String(parsed.eventName || '').startsWith('conversation.chat.')) return true;
  if (parsed.eventName === 'error' || lowerType === 'error') return true;
  return lowerType && lowerType !== 'answer';
}

function getPersistedEventStatus(parsed) {
  if (!parsed || parsed.done) return 'running';
  if (parsed.eventName === 'error' || String(parsed.messageType || '').toLowerCase() === 'error') return 'error';
  if (parsed.eventName === 'conversation.chat.completed') {
    return parsed.data && parsed.data.status === 'failed' ? 'error' : 'done';
  }
  if (parsed.eventName === 'conversation.message.completed') return 'done';
  return 'running';
}

function isAnswerDelta(parsed) {
  return parsed &&
    parsed.eventName === 'conversation.message.delta' &&
    String(parsed.messageType || '').toLowerCase() === 'answer';
}

async function addChatEvent({ requestId, sessionId, userId, scene, eventType, title, content, status = 'running', rawEvent = null }) {
  if (!requestId || !userId) return null;

  try {
    return await db.collection('chat_events').add({
      request_id: requestId,
      session_id: sessionId || '',
      user_id: userId,
      scene: scene || 'general',
      event_type: eventType || 'coze_event',
      title: title || '智能体事件',
      content: content || '',
      status,
      raw_event: rawEvent || null,
      created_at: now()
    });
  } catch (error) {
    console.error('[coze-chat] addChatEvent failed', error);
    return null;
  }
}

function parseSseReply(text) {
  const blocks = String(text || '').split(/\r?\n\r?\n/);
  let reply = '';
  let conversationId = '';

  console.log('[coze-chat] parseSseReply blocks count:', blocks.length);

  for (const block of blocks) {
    const lines = block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const eventLine = lines.find((line) => line.startsWith('event:'));
    const dataLine = lines.find((line) => line.startsWith('data:'));
    if (!dataLine) continue;

    const eventName = eventLine ? eventLine.replace(/^event:\s?/, '') : '';
    const payloadText = dataLine.replace(/^data:\s?/, '');
    if (!payloadText || payloadText === '[DONE]') continue;

    try {
      const event = JSON.parse(payloadText);
      const data = event.data || event; // 兼容直接在 root 的情况
      const messageType = event.type || data.type || '';
      const role = event.role || data.role || '';
      const content = event.content ?? data.content;

      if (!conversationId) {
        conversationId =
          data.conversation_id ||
          data.conversation?.id ||
          event.conversation_id ||
          event.conversation?.id ||
          '';
      }

      // 1. 处理消息增量 (delta)
      if (eventName === 'conversation.message.delta') {
        const deltaText = normalizeText(content);
        if (deltaText) reply += deltaText;
        continue;
      }

      // 2. 处理消息完成 (message.completed)
      if (eventName === 'conversation.message.completed') {
        if (role === 'assistant' && messageType === 'answer') {
          const fullText = normalizeText(content);
          if (fullText) reply = fullText; 
        }
        continue;
      }

      // 3. 处理对话完成 (chat.completed) - 此时可以结束解析
      if (eventName === 'conversation.chat.completed') {
        const status = data.status;
        if (status === 'completed') {
          // 对话成功完成
        } else if (status === 'requires_action') {
          reply = 'Bot 需要调用工具，但当前环境未配置工具回调。请检查 Bot 配置，关闭不需要的插件或工作流。';
        } else if (status === 'failed') {
          const lastError = data.last_error || {};
          reply = `对话失败：${lastError.msg || '未知错误'}`;
        }
        break; // 收到 chat.completed 就可以提前跳出循环了
      }

      // 3. 兼容旧逻辑或其他事件
      if (messageType === 'answer' && role === 'assistant') {
        const textReply = normalizeText(content);
        if (textReply) reply = textReply;
      }
    } catch (err) {
      console.error('[coze-chat] parse block error:', err, payloadText);
      continue;
    }
  }

  return { reply: reply.trim(), conversationId };
}

function cozeRequest({ token, url, method = 'GET', data, dataType = 'text' }) {
  return uniCloud.httpclient.request(url, {
    method,
    data,
    dataType,
    contentType: 'json',
    timeout: COZE_TIMEOUT,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}

function cozeStreamRequest({ token, url, data, onSseEvent }) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    const body = JSON.stringify(data || {});
    const state = {
      reply: '',
      conversationId: '',
      rawText: '',
      traceInfo: {
        statusCode: 0,
        xLogId: '',
        xTraceId: '',
        contentType: ''
      }
    };

    const req = client.request({
      method: 'POST',
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || undefined,
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: COZE_TIMEOUT[0]
    }, (res) => {
      const headers = res.headers || {};
      state.traceInfo = {
        statusCode: res.statusCode || 0,
        xLogId: headers['x-tt-logid'] || headers['X-TT-Logid'] || '',
        xTraceId: headers['x-tt-trace-id'] || headers['X-TT-Trace-Id'] || '',
        contentType: headers['content-type'] || headers['Content-Type'] || ''
      };

      res.setEncoding('utf8');
      let buffer = '';

      const processBlock = (block) => {
        const trimmed = String(block || '').trim();
        if (!trimmed) return;

        state.rawText += `${trimmed}\n\n`;
        let parsed;
        try {
          parsed = parseSseBlock(trimmed);
        } catch (error) {
          console.error('[coze-chat] stream parse block failed', error, trimmed.slice(0, 300));
          return;
        }

        if (!parsed) return;
        updateReplyFromSse(parsed, state);
        if (typeof onSseEvent === 'function') {
          onSseEvent(parsed);
        }
      };

      res.on('data', (chunk) => {
        buffer += String(chunk || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const block = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          processBlock(block);
          boundary = buffer.indexOf('\n\n');
        }
      });

      res.on('end', () => {
        if (buffer.trim()) {
          processBlock(buffer);
        }

        if (state.traceInfo.statusCode < 200 || state.traceInfo.statusCode >= 300) {
          reject(new Error(`Coze HTTP Error: ${state.traceInfo.statusCode} - ${state.rawText.slice(0, 160)}`));
          return;
        }

        if (!state.rawText.includes('event:') && !state.rawText.includes('data:')) {
          try {
            const jsonRes = JSON.parse(state.rawText);
            if (jsonRes.code !== 0) {
              reject(new Error(`Coze API Error: ${jsonRes.msg || jsonRes.message} (Code: ${jsonRes.code})`));
              return;
            }
          } catch (error) {
            // SSE may be empty in abnormal cases; let the common reply check handle it.
          }
        }

        resolve({
          reply: state.reply.trim(),
          conversationId: state.conversationId,
          status: 'completed',
          traceInfo: state.traceInfo,
          rawText: state.rawText
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('Coze request timeout'));
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(body);
    req.end();
  });
}

async function callCozeChat({ token, botId, apiBase, userId, content, conversationId = '', requestId = '', sessionId = '', scene = 'general', attachments = [] }) {
  const url = conversationId
    ? `${apiBase}/v3/chat?conversation_id=${encodeURIComponent(conversationId)}`
    : `${apiBase}/v3/chat`;

  console.log('[coze-chat] Requesting Coze V3:', {
    url,
    botId,
    userId,
    hasConversationId: !!conversationId
  });

  const eventWriteQueue = {
    promise: Promise.resolve(),
    seen: new Set()
  };

  const answerStreamQueue = {
    promise: Promise.resolve(),
    pending: '',
    timer: null,
    index: 0,
    lastFlushAt: 0
  };

  const flushAnswerDelta = () => {
    if (!answerStreamQueue.pending) return;
    const chunk = answerStreamQueue.pending;
    answerStreamQueue.pending = '';
    answerStreamQueue.index += 1;
    answerStreamQueue.lastFlushAt = now();

    answerStreamQueue.promise = answerStreamQueue.promise
      .then(() => addChatEvent({
        requestId,
        sessionId,
        userId,
        scene,
        eventType: 'answer_delta',
        title: '回答生成中',
        content: chunk,
        status: 'running',
        rawEvent: {
          eventName: 'conversation.message.delta',
          type: 'answer',
          index: answerStreamQueue.index
        }
      }))
      .catch((error) => {
        console.error('[coze-chat] enqueue answer delta failed', error);
      });
  };

  const enqueueAnswerDelta = (parsed) => {
    if (!isAnswerDelta(parsed)) return;
    const chunk = normalizeText(parsed.content);
    if (!chunk) return;

    answerStreamQueue.pending += chunk;
    const shouldFlushNow = answerStreamQueue.pending.length >= 28 || now() - answerStreamQueue.lastFlushAt > 320;
    if (shouldFlushNow) {
      if (answerStreamQueue.timer) {
        clearTimeout(answerStreamQueue.timer);
        answerStreamQueue.timer = null;
      }
      flushAnswerDelta();
      return;
    }

    if (!answerStreamQueue.timer) {
      answerStreamQueue.timer = setTimeout(() => {
        answerStreamQueue.timer = null;
        flushAnswerDelta();
      }, 180);
    }
  };

  const enqueueEvent = (parsed) => {
    enqueueAnswerDelta(parsed);
    if (!shouldPersistCozeEvent(parsed)) return;

    const payload = getNestedPayload(parsed);
    const title = getEventTitle(parsed.messageType, parsed.eventName, parsed.data, payload);
    const contentText = getEventContent(parsed);
    const status = getPersistedEventStatus(parsed);
    const key = [
      parsed.eventName,
      parsed.messageType,
      title,
      contentText
    ].join('|');

    if (eventWriteQueue.seen.has(key)) return;
    eventWriteQueue.seen.add(key);

    eventWriteQueue.promise = eventWriteQueue.promise
      .then(() => addChatEvent({
        requestId,
        sessionId,
        userId,
        scene,
        eventType: parsed.messageType || parsed.eventName || 'coze_event',
        title,
        content: contentText,
        status,
        rawEvent: {
          eventName: parsed.eventName,
          type: parsed.messageType || '',
          role: parsed.role || '',
          conversationId: parsed.conversationId || ''
        }
      }))
      .catch((error) => {
        console.error('[coze-chat] enqueue event failed', error);
      });
  };

  const cozeData = {
    bot_id: botId,
    user_id: String(userId),
    stream: true,
    auto_save_history: true,
    additional_messages: [
      buildCozeUserMessage(content, attachments)
    ]
  };

  const streamResult = await cozeStreamRequest({
    token,
    url,
    data: cozeData,
    onSseEvent: enqueueEvent
  });

  if (answerStreamQueue.timer) {
    clearTimeout(answerStreamQueue.timer);
    answerStreamQueue.timer = null;
  }
  flushAnswerDelta();
  await answerStreamQueue.promise;
  await eventWriteQueue.promise;
  
  if (!streamResult.reply) {
    console.error('[coze-chat] Parse failed, raw response preview:', streamResult.rawText.slice(0, 500));
    throw new Error('未能解析到 AI 回复，请检查 Bot 是否已发布到 API 渠道');
  }

  return {
    reply: streamResult.reply,
    conversationId: streamResult.conversationId || conversationId,
    status: 'completed',
    traceInfo: streamResult.traceInfo
  };
}

async function getOrCreateSession(userId, sessionId, content, scene) {
  const currentTime = now();

  if (sessionId) {
    const sessionDoc = await db.collection('chat_sessions').doc(sessionId).get();
    const session = (sessionDoc.data && sessionDoc.data[0]) || null;
    if (!session) return fail('session not found', 404);
    if (session.user_id !== userId) return fail('session does not belong to current user', 403);
    
    // 增加场景校验：如果会话 ID 对应的场景与当前场景不符，则视为无效会话 ID，强制创建新会话
    if (session.scene !== scene) {
      console.warn('[coze-chat] session scene mismatch, creating new session', {
        sessionId,
        expectedScene: scene,
        actualScene: session.scene
      });
      return createNewSession(userId, content, scene, currentTime);
    }
    
    return { currentSessionId: sessionId, currentTime, session };
  }

  return createNewSession(userId, content, scene, currentTime);
}

async function createNewSession(userId, content, scene, currentTime) {
  const sessionResult = await db.collection('chat_sessions').add({
    user_id: userId,
    title: (content || '新会话').slice(0, 20),
    scene,
    status: 'active',
    last_message: content,
    message_count: 0,
    created_at: currentTime,
    updated_at: currentTime
  });

  return { currentSessionId: sessionResult.id, currentTime, session: null };
}

async function sendMessage(event) {
  const { sessionId, content, scene = 'general', quote } = event;
  const attachments = Array.isArray(event.attachments) ? event.attachments : [];
  const userId = getRequesterUid(event);
  const requestId = event.requestId || `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  if (!userId || !content) {
    return fail('login required or content is empty', 401);
  }

  console.log('[coze-chat] sendMessage start', {
    userId: String(userId),
    sessionId: sessionId || '',
    scene,
    contentLength: String(content).length,
    hasQuote: !!quote
  });

  const sessionResult = await getOrCreateSession(userId, sessionId, content, scene);
  if (sessionResult.code && sessionResult.code !== 0) return sessionResult;

  const { currentSessionId, currentTime, session } = sessionResult;
  const oldConversationId = session && session.coze_conversation_id ? session.coze_conversation_id : '';
  const historyMessages = await getRecentHistoryMessages(userId, currentSessionId, scene);
  const shouldInjectLocalHistory = hasFragmentedCozeHistory(historyMessages, oldConversationId);
  const historyContext = shouldInjectLocalHistory ? buildHistoryContext(historyMessages) : '';

  await addChatEvent({
    requestId,
    sessionId: currentSessionId,
    userId,
    scene,
    eventType: 'request_started',
    title: '开始执行',
    content: oldConversationId ? '已连接当前 Coze 会话，正在等待智能体动作。' : '正在创建新的 Coze 会话。',
    status: 'running'
  });

  // 1. 存储用户消息到数据库
  await db.collection('chat_messages').add({
    session_id: currentSessionId,
    user_id: userId,
    scene,
    role: 'user',
    content: content,
    content_type: 'text',
    attachments,
    quote: quote || null,
    created_at: now()
  });

  // 2. 获取 Coze 配置
  const { token, apiBase } = getCozeConfig();
  const botId = getBotId(scene);

  // 3. 优先依赖 Coze conversation_id 续上下文；仅当历史已被旧逻辑打散到多个 Coze 会话时注入本地历史兜底
  const apiContent = buildCozeInput({
    content,
    quote,
    historyContext
  });

  let cozeResult;
  try {
    cozeResult = await callCozeChat({
      token,
      botId,
      apiBase,
      userId,
      content: apiContent,
      conversationId: oldConversationId,
      requestId,
      sessionId: currentSessionId,
      scene,
      attachments
    });
  } catch (err) {
    const errorText = err.message || String(err);
    const fallbackReply = `抱歉，连接 AI 助手出错：${errorText}`;

    await addChatEvent({
      requestId,
      sessionId: currentSessionId,
      userId,
      scene,
      eventType: 'request_error',
      title: '执行异常',
      content: errorText,
      status: 'error'
    });

    console.log('[coze-chat] sendMessage failed', {
      userId: String(userId),
      sessionId: currentSessionId,
      error: errorText
    });

    await db.collection('chat_messages').add({
      session_id: currentSessionId,
      user_id: userId,
      scene,
      role: 'assistant',
      content: fallbackReply,
      content_type: 'text',
      raw_response: { provider: 'coze', error: errorText },
      created_at: now()
    });

    await db.collection('chat_sessions').doc(currentSessionId).update({
      last_message: fallbackReply,
      message_count: dbCmd.inc(2),
      updated_at: now()
    });

    return success({
      sessionId: currentSessionId,
      requestId,
      reply: fallbackReply,
      error: errorText
    });
  }

  const reply = cozeResult.reply || 'Coze 已返回完成状态，但没有取到助手回复。';

  console.log('[coze-chat] sendMessage success', {
    userId: String(userId),
    sessionId: currentSessionId,
    replyLength: reply.length,
    conversationId: cozeResult.conversationId || ''
  });

  await db.collection('chat_messages').add({
    session_id: currentSessionId,
    user_id: userId,
    scene,
    role: 'assistant',
    content: reply,
    content_type: 'text',
    raw_response: {
      provider: 'coze',
      conversationId: cozeResult.conversationId || ''
    },
    created_at: now()
  });

  const sessionUpdate = {
    last_message: reply,
    message_count: dbCmd.inc(2),
    updated_at: now()
  };

  if (cozeResult.conversationId && (!session || session.coze_conversation_id !== cozeResult.conversationId)) {
    sessionUpdate.coze_conversation_id = cozeResult.conversationId;
  }

  await db.collection('chat_sessions').doc(currentSessionId).update(sessionUpdate);

  return success({
    sessionId: currentSessionId,
    requestId,
    reply,
    conversationId: cozeResult.conversationId || ''
  });
}

async function getHistory(event) {
  const { sessionId, limit = 50, scene = 'general' } = event;
  const userId = getRequesterUid(event);

  if (!userId || !sessionId) {
    return fail('login required or sessionId is required', 401);
  }

  const sessionDoc = await db.collection('chat_sessions').doc(sessionId).get();
  const session = (sessionDoc.data && sessionDoc.data[0]) || null;
  if (!session) return fail('session not found', 404);
  if (session.user_id !== userId) return fail('session does not belong to current user', 403);
  if (session.scene !== scene) return fail('session scene mismatch', 403);

  const result = await db.collection('chat_messages')
    .where({ user_id: userId, session_id: sessionId, scene })
    .orderBy('created_at', 'asc')
    .limit(Math.min(Number(limit) || 50, 100))
    .get();

  return success({ list: result.data });
}

async function getSessions(event) {
  const { limit = 20, scene = 'general' } = event;
  const userId = getRequesterUid(event);

  if (!userId) {
    return fail('login required', 401);
  }

  const result = await db.collection('chat_sessions')
    .where({ user_id: userId, scene, status: dbCmd.neq('deleted') })
    .orderBy('updated_at', 'desc')
    .limit(Math.min(Number(limit) || 20, 100))
    .get();

  return success({ list: result.data });
}

async function getEvents(event) {
  const { requestId, after = 0, limit = 80 } = event;
  const userId = getRequesterUid(event);

  if (!userId || !requestId) {
    return fail('login required or requestId is required', 401);
  }

  const where = {
    user_id: userId,
    request_id: requestId
  };

  const afterTime = Number(after) || 0;
  if (afterTime > 0) {
    where.created_at = dbCmd.gt(afterTime - 1);
  }

  const result = await db.collection('chat_events')
    .where(where)
    .orderBy('created_at', 'asc')
    .limit(Math.min(Number(limit) || 80, 200))
    .get();

  return success({ list: result.data || [] });
}

async function deleteSession(event) {
  const { sessionId } = event;
  const userId = getRequesterUid(event);

  if (!userId || !sessionId) {
    return fail('login required or sessionId is required', 401);
  }

  // 软删除，标记状态为 deleted，同时增加 userId 校验
  const result = await db.collection('chat_sessions').where({
    _id: sessionId,
    user_id: userId
  }).update({
    status: 'deleted',
    updated_at: now()
  });

  if (result.updated === 0) {
    return fail('session not found or permission denied', 403);
  }

  return success({ message: 'session deleted' });
}

async function updateSession(event) {
  const { sessionId, title } = event;
  const userId = getRequesterUid(event);

  if (!userId || !sessionId) {
    return fail('login required or sessionId is required', 401);
  }

  // 增加 userId 校验
  const result = await db.collection('chat_sessions').where({
    _id: sessionId,
    user_id: userId
  }).update({
    title: String(title).slice(0, 50),
    updated_at: now()
  });

  if (result.updated === 0) {
    return fail('session not found or permission denied', 403);
  }

  return success({ message: 'session updated' });
}

async function deleteMessage(event) {
  const { messageId } = event;
  const userId = getRequesterUid(event);

  if (!userId || !messageId) {
    return fail('login required or messageId is required', 401);
  }

  // 物理删除该条消息，增加 userId 校验
  const result = await db.collection('chat_messages').where({
    _id: messageId,
    user_id: userId
  }).remove();

  if (result.deleted === 0) {
    return fail('message not found or permission denied', 403);
  }

  return success({ message: 'message deleted' });
}

exports.main = async (event) => {
  const { action } = event;

  switch (action) {
    case 'sendMessage':
      return sendMessage(event);
    case 'getHistory':
      return getHistory(event);
    case 'getSessions':
      return getSessions(event);
    case 'getEvents':
      return getEvents(event);
    case 'deleteSession':
      return deleteSession(event);
    case 'updateSession':
      return updateSession(event);
    case 'deleteMessage':
      return deleteMessage(event);
    default:
      return fail(`Unknown action: ${action}`, 404);
  }
};
