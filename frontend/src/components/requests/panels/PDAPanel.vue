<template>
  <div>
      <div v-if="isBarred" class="standing-info" >
          Your account is suspended until all bills are paid and/or the overdue items are returned.<br/>
          If you need assistance, please email <a href="mailto:lib-circ@virginia.edu">lib-circ@virginia.edu</a>.
      </div>
    <V4Spinner v-else message="Sending Order..."></V4Spinner>
  </div>
</template>
<script>
import { mapGetters } from "vuex";
export default {
  computed: {
      ...mapGetters({
        isBarred: 'user/isBarred',
      })
  },
  created() {
    // This component only exists to send the direct link action for the active option
    if(!this.isBarred){
      this.$store.dispatch('requests/sendDirectLink')
      this.$analytics.trigger('Requests', 'REQUEST_STARTED', "pda")
    }
  },
}
</script>

<style lang="scss" scoped>
.standing-info {
    font-size: 1em;
    font-weight: bold;
    text-align: center;
    padding: 10px;
    margin: 50px 0;
    border-radius: 5px;
    color: var(--uvalib-text);
    background-color: var(--uvalib-red-lightest);
}
</style>
