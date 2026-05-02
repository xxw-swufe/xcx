# uniCloud backend skeleton

This backend is only a first skeleton for the uni-app mini program. It uses uniCloud database and cloud functions. It does not use a traditional self-hosted server.

## Database collections

### users

Stores mini program users and membership snapshot.

Key fields:

- `openid`: WeChat openid or external openid.
- `unionid`: WeChat unionid, optional.
- `phone`, `nickname`, `avatar`: profile fields.
- `user_no`: business user number.
- `member_level`, `member_expire_at`: current membership snapshot.
- `status`: `active` or `disabled`.

### chat_sessions

Stores AI chat session metadata.

Key fields:

- `user_id`: owner user ID.
- `title`: session title.
- `scene`: `general`, `document`, `policy`, or `department`.
- `coze_conversation_id`: reserved Coze conversation ID.
- `last_message`, `message_count`: list page snapshot.
- `status`: `active`, `archived`, or `deleted`.

### chat_messages

Stores each AI chat message.

Key fields:

- `session_id`: related chat session.
- `user_id`: owner user ID.
- `role`: `user`, `assistant`, or `system`.
- `content`, `content_type`: message content.
- `tokens`, `raw_response`: reserved provider metadata.

### orders

Stores mock orders now and can later expand to real WeChat Pay.

Key fields:

- `user_id`: owner user ID.
- `order_no`: business order number.
- `order_type`: `member`, `document`, or `ai`.
- `amount`: amount in cents.
- `pay_channel`: currently `mock`, later `wechat`.
- `status`: `pending`, `paid`, `cancelled`, `refunded`, or `closed`.

### members

Stores membership records and purchase history.

Key fields:

- `user_id`: owner user ID.
- `level`: `free`, `monthly`, `quarterly`, `yearly`, or `lifetime`.
- `status`: `active`, `expired`, or `cancelled`.
- `start_at`, `expire_at`: membership period.
- `source_order_id`: related paid order.
- `benefits`: benefit snapshot.

### documents

Stores uploaded document records.

Key fields:

- `user_id`: owner user ID.
- `project_id`: reserved project relation.
- `category`: document category.
- `title`, `file_name`, `file_url`, `file_type`, `file_size`: file metadata.
- `status`: `pending`, `processing`, `approved`, `rejected`, or `deleted`.
- `ai_summary`: reserved AI summary.

## Cloud functions

### cloudfunctions/user

Actions:

- `loginOrCreate`: create or return user by `openid`.
- `getProfile`: get user profile by `userId`.
- `updateProfile`: update nickname, avatar, or phone.

Example:

```js
uniCloud.callFunction({
  name: 'user',
  data: {
    action: 'loginOrCreate',
    openid: 'mock-openid',
    nickname: 'Test User'
  }
})
```

### cloudfunctions/coze-chat

Actions:

- `sendMessage`: create session if needed, save user message, return mock AI reply.
- `getHistory`: get messages in one session.
- `getSessions`: get user's session list.

Coze is not connected yet. The future Coze API key must be configured inside the cloud function or uniCloud environment variables, never in frontend code.

Example:

```js
uniCloud.callFunction({
  name: 'coze-chat',
  data: {
    action: 'sendMessage',
    userId: 'user-id',
    content: '帮我分析这个项目'
  }
})
```

### cloudfunctions/order

Actions:

- `createOrder`: create a mock order.
- `mockPay`: mark order paid and activate membership for member orders.
- `getOrderList`: get user's order list.

Real WeChat Pay is not connected yet. Later, add `createWechatPay` and `handlePayNotify` inside this cloud function.

Example:

```js
uniCloud.callFunction({
  name: 'order',
  data: {
    action: 'createOrder',
    userId: 'user-id',
    orderType: 'member',
    title: '月度会员',
    amount: 990,
    extra: {
      level: 'monthly'
    }
  }
})
```

## Frontend call rule

Frontend should call backend through `uniCloud.callFunction` or cloud objects. Do not put Coze API Key, payment secret, or other backend credentials in frontend files.
