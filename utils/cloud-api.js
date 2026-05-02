function callCloud(name, data = {}) {
  return uniCloud.callFunction({
    name,
    data
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

export function getAiSessions(userId) {
  return callCloud('coze-chat', {
    action: 'getSessions',
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
