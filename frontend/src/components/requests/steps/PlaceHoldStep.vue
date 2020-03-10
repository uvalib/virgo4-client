<template>
  <div>
    <button @click="placeHold" class="button">Place Hold</button>
  </div>
</template>
<script>
import { mapFields } from 'vuex-map-fields';

export default {
  props: {
    titleId: String,
  },
  computed: {
    ...mapFields(['requests.hold', ]),
  },
  methods: {
    placeHold() {
      this.hold = {titleId: this.titleId}
      this.$store.dispatch('requests/createHold')
    }
  }
}

</script>
<style>
</style>
