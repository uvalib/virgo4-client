<template>
  <div>
    <V4Spinner message="Sending Order..."></V4Spinner>
  </div>
</template>
<script>
export default {
  created() {
    // This component only exists to send the direct link action for the active option
    this.$store.dispatch('requests/sendDirectLink')
    this.$analytics.trigger('Requests', 'REQUEST_STARTED', "pda")
  },
}
</script>
