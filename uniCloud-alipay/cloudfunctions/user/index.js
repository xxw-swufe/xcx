'use strict';

const db = uniCloud.database();

function success(data = {}) {
  return { code: 0, message: 'ok', data };
}

function fail(message, code = 400) {
  return { code, message, data: null };
}

function now() {
  return Date.now();
}

function createUserNo() {
  return `U${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
}

async function loginOrCreate(event) {
  const { openid, unionid = '', phone = '', nickname = '', avatar = '' } = event;

  if (!openid) {
    return fail('openid is required');
  }

  const users = db.collection('users');
  const existed = await users.where({ openid }).limit(1).get();

  if (existed.data.length) {
    return success({ user: existed.data[0], isNew: false });
  }

  const currentTime = now();
  const result = await users.add({
    openid,
    unionid,
    phone,
    nickname,
    avatar,
    user_no: createUserNo(),
    member_level: 'free',
    status: 'active',
    created_at: currentTime,
    updated_at: currentTime
  });

  const user = await users.doc(result.id).get();
  return success({ user: user.data[0], isNew: true });
}

async function getProfile(event) {
  const { userId } = event;

  if (!userId) {
    return fail('userId is required');
  }

  const result = await db.collection('users').doc(userId).get();
  const user = result.data && result.data[0];

  if (!user) {
    return fail('User not found', 404);
  }

  return success({ user });
}

async function updateProfile(event) {
  const { userId, nickname, avatar, phone } = event;

  if (!userId) {
    return fail('userId is required');
  }

  const data = {
    updated_at: now()
  };

  if (nickname !== undefined) data.nickname = nickname;
  if (avatar !== undefined) data.avatar = avatar;
  if (phone !== undefined) data.phone = phone;

  await db.collection('users').doc(userId).update(data);

  return getProfile({ userId });
}

exports.main = async (event) => {
  const { action } = event;

  switch (action) {
    case 'loginOrCreate':
      return loginOrCreate(event);
    case 'getProfile':
      return getProfile(event);
    case 'updateProfile':
      return updateProfile(event);
    default:
      return fail(`Unknown action: ${action}`, 404);
  }
};