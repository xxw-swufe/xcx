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

function createOrderNo() {
  return `MO${Date.now()}${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
}

async function createOrder(event) {
  const { userId, orderType = 'member', title = 'Member order', amount = 0, extra = {} } = event;

  if (!userId) {
    return fail('userId is required');
  }

  const currentTime = now();
  const orderNo = createOrderNo();
  const result = await db.collection('orders').add({
    user_id: userId,
    order_no: orderNo,
    order_type: orderType,
    title,
    amount: Number(amount) || 0,
    pay_channel: 'mock',
    status: 'pending',
    extra,
    created_at: currentTime,
    updated_at: currentTime
  });

  return success({
    orderId: result.id,
    orderNo,
    mocked: true
  });
}

async function mockPay(event) {
  const { userId, orderId } = event;

  if (!userId || !orderId) {
    return fail('userId and orderId are required');
  }

  const orderResult = await db.collection('orders').doc(orderId).get();
  const order = orderResult.data && orderResult.data[0];

  if (!order || order.user_id !== userId) {
    return fail('Order not found', 404);
  }

  if (order.status === 'paid') {
    return success({ orderId, status: 'paid' });
  }

  const currentTime = now();
  await db.collection('orders').doc(orderId).update({
    status: 'paid',
    paid_at: currentTime,
    updated_at: currentTime
  });

  if (order.order_type === 'member') {
    const days = (order.extra && order.extra.days) || 30;
    const expireAt = currentTime + days * 24 * 60 * 60 * 1000;
    await db.collection('members').add({
      user_id: userId,
      level: (order.extra && order.extra.level) || 'monthly',
      status: 'active',
      start_at: currentTime,
      expire_at: expireAt,
      source_order_id: orderId,
      benefits: {
        ai_chat: true,
        document_assist: true
      },
      created_at: currentTime,
      updated_at: currentTime
    });

    const userRes = await db.collection('users').doc(userId).get();
    if (userRes.data && userRes.data.length) {
      await db.collection('users').doc(userId).update({
        member_level: (order.extra && order.extra.level) || 'monthly',
        member_expire_at: expireAt,
        updated_at: currentTime
      });
    } else {
      await db.collection('users').add({
        _id: userId,
        openid: userId,
        member_level: (order.extra && order.extra.level) || 'monthly',
        member_expire_at: expireAt,
        status: 'active',
        created_at: currentTime,
        updated_at: currentTime
      });
    }
  }

  return success({ orderId, status: 'paid', mocked: true });
}

async function getOrderList(event) {
  const { userId, status, limit = 20 } = event;

  if (!userId) {
    return fail('userId is required');
  }

  const where = { user_id: userId };
  if (status) {
    where.status = status;
  }

  const result = await db.collection('orders')
    .where(where)
    .orderBy('created_at', 'desc')
    .limit(Math.min(Number(limit) || 20, 100))
    .get();

  return success({ list: result.data });
}

exports.main = async (event) => {
  const { action } = event;

  switch (action) {
    case 'createOrder':
      return createOrder(event);
    case 'mockPay':
      return mockPay(event);
    case 'getOrderList':
      return getOrderList(event);
    default:
      return fail(`Unknown action: ${action}`, 404);
  }
};
