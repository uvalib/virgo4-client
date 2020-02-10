<template>
  <button @click="placeHold" class="button">Place Hold</button>
</template>
<script>
import { mapFields } from 'vuex-map-fields';

export default {
  props: {
    titleId: String,
    barcode: String,
  },
  computed: {
    ...mapFields('requests', ['hold']),
  },
  methods: {
    placeHold() {
      this.hold = {titleId: this.titleId, barcode: this.barcode}
      this.$store.dispatch('requests/createHold')
    }
  }
}

</script>
<style>
</style>
