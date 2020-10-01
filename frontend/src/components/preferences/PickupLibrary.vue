<template>
  <div class="pickup-options pure-form">
    <h2>Pickup Location</h2>
    <p>
      This pickup location is where you will go to retrieve items you’ve requested from Ivy Stacks or are receiving as a result of a hold or a recall.
    </p>

    <p>If you cannot pick your item up at the location(s) shown below, please
      <a target="_blank" href="https://uva.hosts.atlas-sys.com/remoteauth/illiad.dll?Action=10&Form=30">use this form</a> to request your item.
    </p>

    <p v-if="canLeoMobile"><a target="_blank" href="http://library.virginia.edu/services/pickup">Learn more about options for Paging and Pickup.</a></p>

    <label for="pickup-sel">Preferred pickup location:
      <V4Select id="pickup-sel" v-model="pickupLibrary" :selections="librariesForUser"
        pad="5px 10px" :attached="false"
        @changed="update"
      />
    </label>

  </div>
</template>
<script>
import { mapFields } from 'vuex-map-fields'
import { mapGetters } from "vuex"
export default {
  computed: {
    ...mapFields({
        pickupLibrary: 'preferences.pickupLibrary',
    }),
    ...mapGetters({
      librariesForUser: "user/libraries",
      canLeoMobile: "user/canLeoMobile"
    }),
  },
  methods: {
    update() {
      this.$store.dispatch("preferences/savePreferences")
    },
  },

}
</script>
<style lang="scss" scoped>
.pickup-options {
  text-align: left;
  h2 {
    margin:5px 0 10px 0;
  }
  label {
    font-weight: 500;
    margin-top: 30px;
  }
  #pickup-sel{
    width: fit-content;
    display: inline-flex;
    margin-bottom: 30px;
  }
}
</style>
