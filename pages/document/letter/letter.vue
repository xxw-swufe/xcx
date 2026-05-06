<template>
  <consult-chat
    ref="chat"
    scene="letter"
    title="来往函件"
    :show-back="true"
    subtitle="只有你手动选中的附件，才会在点发送后一起发出"
    session-key="letter-current-session-id"
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
