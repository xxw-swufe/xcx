'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

const DEFAULT_COZE_API_BASE = 'https://api.coze.cn';
const DEFAULT_COZE_BOT_ID = '7619186763315249193';
const DEFAULT_COZE_TOKEN = 'sat_hBYTVDXcBXZEj30zDcCNwEZ4S6cGetB4uYvhupH2wefPDfcSZ8GtETvAdxMz7ZCh';
const COZE_TIMEOUT = [300000, 300000];
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
    apiBase: process.env.COZE_API_BASE || DEFAULT_COZE_API_BASE
  };
}

function getBotId(scene) {
  return BOT_ID_MAP[scene] || BOT_ID_MAP.general;
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

async function callCozeChat({ token, botId, apiBase, userId, content, conversationId = '' }) {
  const url = `${apiBase}/v3/chat`;

  console.log('[coze-chat] Requesting Coze V3:', {
    url,
    botId,
    userId,
    hasConversationId: !!conversationId
  });

  const res = await cozeRequest({
    token,
    url,
    method: 'POST',
    dataType: 'text',
    data: {
      bot_id: botId,
      user_id: String(userId),
      stream: true,
      auto_save_history: true,
      conversation_id: conversationId || undefined,
      additional_messages: [
        {
          content: String(content),
          content_type: 'text',
          role: 'user'
        }
      ]
    }
  });

  const traceInfo = getTraceInfo(res);
  const rawText = String(res.data || '');
  
  // 如果返回的是 JSON 错误（非 SSE）
  if (!rawText.includes('event:') && !rawText.includes('data:')) {
    try {
      const jsonRes = JSON.parse(rawText);
      if (jsonRes.code !== 0) {
        throw new Error(`Coze API Error: ${jsonRes.msg || jsonRes.message} (Code: ${jsonRes.code})`);
      }
    } catch (e) {
      if (traceInfo.statusCode !== 200) {
        throw new Error(`Coze HTTP Error: ${traceInfo.statusCode} - ${rawText.slice(0, 100)}`);
      }
    }
  }

  const parsed = parseSseReply(rawText);
  
  if (!parsed.reply) {
    console.error('[coze-chat] Parse failed, raw response preview:', rawText.slice(0, 500));
    throw new Error('未能解析到 AI 回复，请检查 Bot 是否已发布到 API 渠道');
  }

  return {
    reply: parsed.reply,
    conversationId: parsed.conversationId || conversationId,
    status: 'completed',
    traceInfo
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
  const oldConversationId = session && session.coze_conversation_id ? session.coze_conversation_id : '';

  // 3. 构建包含上下文的提示词 (如果存在引用)
  let apiContent = content;
  if (quote && typeof quote.content === 'string' && quote.content.trim()) {
    apiContent = `[CONTEXT: 用户引用了之前的消息]:\n"${quote.content.trim()}"\n\n[USER REPLY]:\n${content}`;
  }

  let cozeResult;
  try {
    cozeResult = await callCozeChat({
      token,
      botId,
      apiBase,
      userId,
      content: apiContent,
      conversationId: oldConversationId
    });
  } catch (err) {
    const errorText = err.message || String(err);
    const fallbackReply = `抱歉，连接 AI 助手出错：${errorText}`;

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
