<template>
  <div>
    <button @click="placeHold" class="button">Place Hold</button>
  </div>
</template>
<script>
import { mapFields } from 'vuex-map-fields';
import { mapGetters } from "vuex"

export default {
  computed: {
    ...mapFields(['requests.hold', ]),
    ...mapGetters({ availability: 'item/availability', })
  },
  methods: {
    placeHold() {
      // First item for now
      let barcode = this.availability.items[0].barcode
      this.hold = {itemBarcode: barcode, pickupLibrary: 'ALDERMAN' }
      this.$store.dispatch('requests/createHold')
    }
  }
}

</script>
<style>
</style>
