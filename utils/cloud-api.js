function callCloud(name, data = {}) {
  // 为 AI 聊天增加更长的客户端等待时间（300秒）
  const timeout = name === 'coze-chat' ? 300000 : 10000;
  
  return uniCloud.callFunction({
    name,
    data,
    timeout
  }).then((res) => {
    const result = res.result || {};
    if (result.code && result.code !== 0) {
      return Promise.reject(result);
    }
    return result.data;
  });
}

export function loginOrCreateUser(payload) {
  return callCloud('user', {
    action: 'loginOrCreate',
    ...payload
  });
}

export function getUserProfile(userId) {
  return callCloud('user', {
    action: 'getProfile',
    userId
  });
}

export function updateUserProfile(payload) {
  return callCloud('user', {
    action: 'updateProfile',
    ...payload
  });
}

export function sendAiMessage(payload) {
  return callCloud('coze-chat', {
    action: 'sendMessage',
    ...payload
  });
}

export function getAiHistory(payload) {
  return callCloud('coze-chat', {
    action: 'getHistory',
    ...payload
  });
}

export function getAiSessions(payload) {
  const data = typeof payload === 'string' ? { userId: payload } : (payload || {});
  return callCloud('coze-chat', {
    action: 'getSessions',
    ...data
  });
}

export function getAiEvents(payload) {
  return callCloud('coze-chat', {
    action: 'getEvents',
    ...payload
  });
}

export function deleteAiSession(sessionId, userId) {
  return callCloud('coze-chat', {
    action: 'deleteSession',
    sessionId,
    userId
  });
}

export function updateAiSession(sessionId, title, userId) {
  return callCloud('coze-chat', {
    action: 'updateSession',
    sessionId,
    title,
    userId
  });
}

export function deleteAiMessage(messageId, userId) {
  return callCloud('coze-chat', {
    action: 'deleteMessage',
    messageId,
    userId
  });
}

export function createOrder(payload) {
  return callCloud('order', {
    action: 'createOrder',
    ...payload
  });
}

export function mockPay(payload) {
  return callCloud('order', {
    action: 'mockPay',
    ...payload
  });
}

export function getOrderList(payload) {
  return callCloud('order', {
    action: 'getOrderList',
    ...payload
  });
}
