<template>
  <div class="preferences">
    <h1>My Account</h1>
    <div class="preferences-content">
      <AccountActivities/>
      <div class="working" v-if="lookingUpPools || lookingUpAccount" >
        <V4Spinner message="Loading preferences..."/>
      </div>
      <div v-else>
        <ExcludedPools class="section"/>
        <PickupLibrary class="section"/>
        <BarcodeScan class="section"/>
        <V4Privacy class="section"/>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex"
import AccountActivities from "@/components/AccountActivities"
import ExcludedPools from "@/components/preferences/ExcludedPools"
import PickupLibrary from "@/components/preferences/PickupLibrary"
import V4Privacy from "@/components/preferences/V4Privacy"
import BarcodeScan from "@/components/preferences/BarcodeScan"
export default {
   name: "preferences",
   components: {
      AccountActivities, ExcludedPools, PickupLibrary, V4Privacy, BarcodeScan
   },
   computed: {
      ...mapState({
         lookingUpPools : state => state.pools.lookingUp,
         lookingUpAccount : state => state.user.lookingUp,
         searchAPI: state => state.system.searchAPI,
      }),
   },
   methods: {

   },
   created() {
      this.$store.dispatch("user/getAccountInfo")
      if ( this.searchAPI.length == 0) {
         this.$store.dispatch('system/getConfig').then(_response => {
            this.$store.dispatch('pools/getPools')
         })
      } else {
         this.$store.dispatch('pools/getPools')
      }
   }
}
</script>
<style scoped>
.preferences {
   min-height: 400px;
   position: relative;
   margin-top: 2vw;
   color: var(--color-primary-text);
}
.working {
   text-align: center;
   font-size: 1.25em;
}
.working img {
   margin: 30px 0;
}
.preferences-content {
   width: 80%;
   margin: 0 auto;
}
@media only screen and (min-width: 768px) {
   div.preferences-content  {
       width: 80%;
   }
}
@media only screen and (max-width: 768px) {
   div.preferences-content  {
       width: 95%;
   }
}
.section {
   margin: 10px;
   border: 1px solid black;
}
</style>
