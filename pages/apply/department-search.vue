<template>
  <view class="page">
    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="nav-title">部门查询</text>
      <view class="back-btn ghost"></view>
    </view>

    <scroll-view class="content" scroll-y>
      <view class="location-card">
        <view class="loc-row">
          <text class="loc-pin">📍</text>
          <text class="loc-text">当前定位：{{ locationText }}</text>
        </view>

        <view class="search-box">
          <text class="search-icon">🔎</text>
          <input
            class="search-input"
            v-model="keyword"
            placeholder="搜索部门名称 / 关键词"
            placeholder-class="search-placeholder"
            confirm-type="search"
            @confirm="applySearch"
          />
        </view>

        <view class="auto-btn" @click="refreshLocation">重新定位</view>
      </view>

      <view class="section-head">
        <text class="section-title">附近部门查询</text>
        <text class="section-right">Registry</text>
      </view>

      <view class="dept-card" v-for="dept in filteredDepartments" :key="dept.name">
        <view class="dept-head">
          <view class="dept-icon" :style="{ background: dept.iconBg, color: dept.iconColor }">{{ dept.icon }}</view>
          <view class="dept-meta">
            <text class="dept-name">{{ dept.name }}</text>
            <view class="tags">
              <text class="tag" v-for="tag in dept.tags" :key="tag">{{ tag }}</text>
            </view>
          </view>
        </view>

        <view class="dept-desc">{{ dept.desc }}</view>
        <view class="dept-address">📍 {{ dept.address }}</view>

        <view class="action-row">
          <view class="action-btn light" @click="refreshLocation">定位附近</view>
          <view class="action-btn dark" @click="chooseDept(dept)">查看详情</view>
        </view>
      </view>

      <view v-if="filteredDepartments.length === 0" class="empty-state">
        <text class="empty-title">没有找到匹配部门</text>
        <text class="empty-desc">试试换个关键词，或者先点击重新定位。</text>
      </view>
    </scroll-view>

    <view class="tabbar-space"></view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      keyword: '',
      locationText: '点击按钮获取当前定位',
      departments: [
        {
          name: '办公室',
          tags: ['综合行政', '资料管理'],
          desc: '负责日常行政、资料归档、对外联络等综合事务。',
          address: '待定位后显示附近办公地点',
          icon: '办',
          iconBg: '#e9e5ff',
          iconColor: '#3b3bb8'
        },
        {
          name: '工程部',
          tags: ['施工管理', '现场协调'],
          desc: '负责项目施工、进度协调、现场管理及技术落实。',
          address: '待定位后显示附近工程管理点',
          icon: '工',
          iconBg: '#e8f2ff',
          iconColor: '#2351c7'
        }
      ]
    }
  },
  computed: {
    filteredDepartments() {
      const q = this.keyword.trim().toLowerCase()
      if (!q) return this.departments
      return this.departments.filter((dept) => {
        const haystack = [dept.name, dept.desc, dept.address, ...(dept.tags || [])].join(' ').toLowerCase()
        return haystack.includes(q)
      })
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    applySearch() {
      this.keyword = this.keyword.trim()
    },
    promptLocationSetting() {
      uni.showModal({
        title: '需要定位权限',
        content: '请在系统设置中开启定位权限，才能显示附近部门。',
        confirmText: '去设置',
        cancelText: '取消',
        success: (res) => {
          if (!res.confirm) return
          uni.openSetting({
            success: (settingRes) => {
              if (settingRes.authSetting && settingRes.authSetting['scope.userLocation']) {
                this.doGetLocation()
              }
            }
          })
        }
      })
    },
    doGetLocation() {
      uni.showLoading({ title: '定位中' })
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          const lat = res.latitude.toFixed(5)
          const lng = res.longitude.toFixed(5)
          this.locationText = `已获取当前位置 ${lat}, ${lng}`
          this.departments = this.departments.map((item, index) => ({
            ...item,
            address: index === 0 ? `距离当前位置约 ${Math.max(0.3, (index + 1) * 0.8).toFixed(1)} km` : `距离当前位置约 ${Math.max(0.6, (index + 1) * 1.2).toFixed(1)} km`
          }))
          uni.showToast({ title: '定位成功', icon: 'success' })
        },
        fail: () => {
          this.locationText = '定位失败，请检查权限后重试'
          this.promptLocationSetting()
        },
        complete: () => {
          uni.hideLoading()
        }
      })
    },
    refreshLocation() {
      uni.getSetting({
        success: (res) => {
          const auth = res.authSetting || {}
          if (auth['scope.userLocation'] === false) {
            this.promptLocationSetting()
            return
          }
          if (auth['scope.userLocation'] === true) {
            this.doGetLocation()
            return
          }
          uni.authorize({
            scope: 'scope.userLocation',
            success: () => this.doGetLocation(),
            fail: () => this.promptLocationSetting()
          })
        },
        fail: () => {
          this.doGetLocation()
        }
      })
    },
    chooseDept(dept) {
      uni.showModal({
        title: dept.name,
        content: `${dept.desc}\n${dept.address}`,
        showCancel: false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: linear-gradient(180deg, #eef4ff 0%, #f4f8fd 100%); display: flex; flex-direction: column; }
.nav-header { display: flex; align-items: center; justify-content: space-between; padding: calc(var(--status-bar-height, 44px) + 14rpx) 18rpx 12rpx; }
.back-btn { width: 62rpx; height: 62rpx; border-radius: 50%; border: 2rpx dashed #9dc0ff; display: flex; align-items: center; justify-content: center; color: #1b2f74; font-size: 30rpx; }
.back-btn.ghost { border-color: transparent; }
.nav-title { font-size: 32rpx; font-weight: 900; color: #18306b; }
.content { flex: 1; padding: 8rpx 18rpx 0; }
.location-card { background: rgba(255, 255, 255, 0.92); border-radius: 28rpx; padding: 22rpx 18rpx 18rpx; box-shadow: 0 14rpx 30rpx rgba(20, 40, 95, 0.09); }
.loc-row { display: flex; align-items: center; gap: 10rpx; color: #11625e; font-size: 20rpx; font-weight: 700; margin-bottom: 18rpx; }
.loc-pin { font-size: 26rpx; }
.search-box { height: 78rpx; border-radius: 20rpx; background: #dff0fb; display: flex; align-items: center; padding: 0 20rpx; color: #91a8c4; margin-bottom: 18rpx; }
.search-icon { font-size: 32rpx; margin-right: 12rpx; flex-shrink: 0; }
.search-input { flex: 1; height: 100%; font-size: 20rpx; color: #14315f; }
.search-placeholder { color: #91a8c4; font-size: 20rpx; }
.auto-btn { height: 82rpx; border-radius: 41rpx; background: linear-gradient(135deg, #0c116c 0%, #101b81 100%); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 22rpx; font-weight: 800; }
.section-head { display: flex; align-items: center; justify-content: space-between; margin: 24rpx 4rpx 14rpx; }
.section-title { font-size: 30rpx; font-weight: 900; color: #102b71; }
.section-right { font-size: 17rpx; font-weight: 800; color: #8fa0c2; letter-spacing: 2rpx; text-transform: uppercase; }
.dept-card { background: #ffffff; border-radius: 26rpx; padding: 20rpx 18rpx; margin-bottom: 16rpx; box-shadow: 0 12rpx 28rpx rgba(20, 40, 95, 0.08); }
.dept-head { display: flex; align-items: flex-start; gap: 12rpx; }
.dept-icon { width: 64rpx; height: 64rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; font-size: 30rpx; flex-shrink: 0; }
.dept-meta { flex: 1; }
.dept-name { display: block; font-size: 25rpx; font-weight: 900; color: #152c69; line-height: 1.45; }
.tags { display: flex; gap: 10rpx; flex-wrap: wrap; margin-top: 10rpx; }
.tag { padding: 5rpx 12rpx; border-radius: 999rpx; background: #edf6ff; color: #2260b8; font-size: 17rpx; font-weight: 700; }
.dept-desc { font-size: 18rpx; line-height: 1.65; color: #516688; padding-left: 76rpx; margin-top: 12rpx; }
.dept-address { font-size: 18rpx; color: #7687a8; padding-left: 76rpx; margin-top: 10rpx; }
.action-row { display: flex; gap: 12rpx; margin-top: 16rpx; padding-left: 76rpx; }
.action-btn { flex: 1; height: 72rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; font-size: 20rpx; font-weight: 800; }
.action-btn.light { background: #dff0fb; color: #24408f; }
.action-btn.dark { background: linear-gradient(135deg, #1f2f92 0%, #12276f 100%); color: #ffffff; }
.empty-state { padding: 34rpx 20rpx 54rpx; text-align: center; color: #6c7d9f; }
.empty-title { display: block; font-size: 28rpx; font-weight: 800; color: #16306d; margin-bottom: 10rpx; }
.empty-desc { display: block; font-size: 20rpx; line-height: 1.6; }
.tabbar-space { height: calc(100rpx + env(safe-area-inset-bottom)); }
</style>
