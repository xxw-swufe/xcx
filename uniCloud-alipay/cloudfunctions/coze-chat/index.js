'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

const DEFAULT_COZE_API_BASE = 'https://api.coze.cn';
const DEFAULT_COZE_BOT_ID = '7619186763315249193';
const DEFAULT_COZE_TOKEN = 'sat_hBYTVDXcBXZEj30zDcCNwEZ4S6cGetB4uYvhupH2wefPDfcSZ8GtETvAdxMz7ZCh';
const COZE_TIMEOUT = [60000, 60000];

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
    botId: process.env.COZE_BOT_ID || DEFAULT_COZE_BOT_ID,
    apiBase: process.env.COZE_API_BASE || DEFAULT_COZE_API_BASE
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

function normalizeText(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const parsed = safeJsonParse(value);
    if (parsed !== value) return normalizeText(parsed);
    return value;
  }
  if (typeof value.text === 'string') return value.text;
  if (typeof value.content === 'string') return value.content;
  if (typeof value.output === 'string') return value.output;
  if (value.message) return normalizeText(value.message);
  if (value.data) return normalizeText(value.data);
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = normalizeText(item);
      if (text) return text;
    }
  }
  return '';
}

function parseSseReply(text) {
  const blocks = String(text || '').split(/\r?\n\r?\n/);
  let reply = '';
  let conversationId = '';

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
      const data = event.data || {};
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

      if (messageType === 'answer' && role === 'assistant') {
        const textReply = normalizeText(content) || normalizeText(event.message?.content) || normalizeText(event.output);
        if (textReply) reply = textReply;
        continue;
      }

      if (messageType === 'verbose') {
        continue;
      }

      if (eventName === 'conversation.message.completed' && role === 'assistant' && messageType !== 'verbose') {
        const textReply = normalizeText(content) || normalizeText(event.message?.content) || normalizeText(event.output);
        if (textReply) reply = textReply;
      }
    } catch (err) {
      continue;
    }
  }

  return { reply, conversationId };
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
  const url = conversationId
    ? `${apiBase}/v3/chat?conversation_id=${encodeURIComponent(conversationId)}`
    : `${apiBase}/v3/chat`;

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
      additional_messages: [
        {
          content,
          content_type: 'text',
          role: 'user',
          type: 'question'
        }
      ],
      parameters: {}
    }
  });

  const traceInfo = getTraceInfo(res);
  const rawText = String(res.data || '');
  const hasSsePayload = rawText.includes('event:') && rawText.includes('data:');

  console.log('[coze-chat] chat created', {
    statusCode: traceInfo.statusCode,
    traceInfo,
    preview: rawText.slice(0, 800)
  });

  if (!hasSsePayload && (traceInfo.statusCode < 200 || traceInfo.statusCode >= 300)) {
    throw new Error(`Coze create chat failed: ${traceInfo.statusCode} ${rawText}`);
  }

  const parsed = parseSseReply(rawText);
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
    return { currentSessionId: sessionId, currentTime, session };
  }

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
  const { sessionId, content, scene = 'general' } = event;
  const userId = getRequesterUid(event);

  if (!userId || !content) {
    return fail('login required or content is empty', 401);
  }

  console.log('[coze-chat] sendMessage start', {
    userId: String(userId),
    sessionId: sessionId || '',
    scene,
    contentLength: String(content).length
  });

  const sessionResult = await getOrCreateSession(userId, sessionId, content, scene);
  if (sessionResult.code && sessionResult.code !== 0) return sessionResult;

  const { currentSessionId, currentTime, session } = sessionResult;

  await db.collection('chat_messages').add({
    session_id: currentSessionId,
    user_id: userId,
    role: 'user',
    content,
    content_type: 'text',
    created_at: currentTime
  });

  const { token, botId, apiBase } = getCozeConfig();
  const oldConversationId = session && session.coze_conversation_id ? session.coze_conversation_id : '';

  let cozeResult;
  try {
    cozeResult = await callCozeChat({
      token,
      botId,
      apiBase,
      userId,
      content,
      conversationId: oldConversationId
    });
  } catch (err) {
    const errorText = err && err.message ? err.message : 'unknown';
    const fallbackReply = `Coze 调用失败：${errorText}`;

    console.log('[coze-chat] sendMessage failed', {
      userId: String(userId),
      sessionId: currentSessionId,
      error: errorText
    });

    await db.collection('chat_messages').add({
      session_id: currentSessionId,
      user_id: userId,
      role: 'assistant',
      content: fallbackReply,
      content_type: 'text',
      raw_response: { provider: 'coze', mocked: false, error: errorText },
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
      mocked: false,
      error: errorText
    });
  }

  const reply = cozeResult.reply || 'Coze 已返回完成状态，但没有取到助手回复。';

  console.log('[coze-chat] sendMessage success', {
    userId: String(userId),
    sessionId: currentSessionId,
    replyLength: reply.length,
    conversationId: cozeResult.conversationId || '',
    status: cozeResult.status || ''
  });

  await db.collection('chat_messages').add({
    session_id: currentSessionId,
    user_id: userId,
    role: 'assistant',
    content: reply,
    content_type: 'text',
    raw_response: {
      provider: 'coze',
      mocked: false,
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
    mocked: false,
    conversationId: cozeResult.conversationId || ''
  });
}

async function getHistory(event) {
  const { sessionId, limit = 50 } = event;
  const userId = getRequesterUid(event);

  if (!userId || !sessionId) {
    return fail('login required or sessionId is required', 401);
  }

  const sessionDoc = await db.collection('chat_sessions').doc(sessionId).get();
  const session = (sessionDoc.data && sessionDoc.data[0]) || null;
  if (!session) return fail('session not found', 404);
  if (session.user_id !== userId) return fail('session does not belong to current user', 403);

  const result = await db.collection('chat_messages')
    .where({ user_id: userId, session_id: sessionId })
    .orderBy('created_at', 'asc')
    .limit(Math.min(Number(limit) || 50, 100))
    .get();

  return success({ list: result.data });
}

async function getSessions(event) {
  const { limit = 20 } = event;
  const userId = getRequesterUid(event);

  if (!userId) {
    return fail('login required', 401);
  }

  const result = await db.collection('chat_sessions')
    .where({ user_id: userId, status: dbCmd.neq('deleted') })
    .orderBy('updated_at', 'desc')
    .limit(Math.min(Number(limit) || 20, 100))
    .get();

  return success({ list: result.data });
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
    default:
      return fail(`Unknown action: ${action}`, 404);
  }
};
