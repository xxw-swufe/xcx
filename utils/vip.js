const VIP_STORAGE_KEY = 'isVip'

function readStorage(key) {
  const value = uni.getStorageSync(key)
  return value === undefined || value === null ? {} : value
}

function hasVipFlag(info = {}) {
  if (info.isVip === true) return true
  if (info.memberLevel && info.memberLevel !== 'free') return true
  if (info.member_level && info.member_level !== 'free') return true

  const expireAt = Number(
    info.memberExpireAt ||
      info.member_expire_at ||
      info.expireAt ||
      info.expire_at ||
      0
  )

  return expireAt > Date.now()
}

export function getVipStatus() {
  if (uni.getStorageSync(VIP_STORAGE_KEY) === true) {
    return true
  }

  const memberInfo = readStorage('memberInfo')
  const appUserInfo = readStorage('userInfo')
  const uniIdUserInfo = readStorage('uni-id-pages-userInfo')

  return (
    hasVipFlag(memberInfo) ||
    hasVipFlag(appUserInfo) ||
    hasVipFlag(uniIdUserInfo) ||
    memberInfo.status === 'active'
  )
}

export function setVipStatus(isVip) {
  const vip = !!isVip
  uni.setStorageSync(VIP_STORAGE_KEY, vip)

  const memberInfo = readStorage('memberInfo')
  memberInfo.status = vip ? 'active' : 'inactive'
  memberInfo.memberLevel = vip ? 'vip' : 'free'
  uni.setStorageSync('memberInfo', memberInfo)

  const appUserInfo = readStorage('userInfo')
  appUserInfo.isVip = vip
  appUserInfo.memberLevel = vip ? 'vip' : 'free'
  uni.setStorageSync('userInfo', appUserInfo)

  const uniIdUserInfo = readStorage('uni-id-pages-userInfo')
  uniIdUserInfo.isVip = vip
  uniIdUserInfo.memberLevel = vip ? 'vip' : 'free'
  uniIdUserInfo.member_level = vip ? 'vip' : 'free'
  uniIdUserInfo.memberExpireAt = vip ? Date.now() + 365 * 24 * 60 * 60 * 1000 : 0
  uniIdUserInfo.member_expire_at = uniIdUserInfo.memberExpireAt
  uni.setStorageSync('uni-id-pages-userInfo', uniIdUserInfo)
}
