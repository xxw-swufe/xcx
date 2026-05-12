<template>
  <consult-chat
    ref="chat"
    scene="construction"
    title="施工方案"
    :show-back="true"
    subtitle="自动生成施工组织、工序说明和施工方案占位页面。"
    session-key="construction-current-session-id"
  />
</template>

<script>
import ConsultChat from '../../consult/consult.vue'

export default {
  components: {
    ConsultChat
  },
  mounted() {
    this.syncChat()
  },
  onShow() {
    this.syncChat()
  },
  methods: {
    syncChat() {
      this.$nextTick(() => {
        const chat = this.$refs.chat
        if (chat && typeof chat.initializeChat === 'function') {
          chat.initializeChat()
        }
      })
    }
  }
}
</script>
