<template>
  <div class="preferences">
    <h1>My Account</h1>
    <div class="preferences-content">
      <AccountActivities/>
      <div class="working" v-if="lookingUpPools || lookingUpAccount" >
        <V4Spinner message="Loading preferences..."/>
      </div>
      <div v-else>
        <Search class="section"/>
        <PickupLibrary class="section"/>
        <BarcodeScan class="section"/>
        <V4Privacy class="section"/>
        <JWTAdmin class="section"/>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex"
import AccountActivities from "@/components/AccountActivities"
import Search from "@/components/preferences/Search"
import PickupLibrary from "@/components/preferences/PickupLibrary"
import V4Privacy from "@/components/preferences/V4Privacy"
import BarcodeScan from "@/components/preferences/BarcodeScan"
import JWTAdmin from "@/components/preferences/JWTAdmin"
export default {
   name: "preferences",
   components: {
      AccountActivities, Search, PickupLibrary, V4Privacy, BarcodeScan, JWTAdmin
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
      this.$store.dispatch('pools/getPools')
      this.$store.dispatch("user/getAccountInfo")
      setTimeout(()=> { 
         let ele = document.getElementById("collapse-pref")
         if ( ele ) {
            ele.focus()
         } else {
             document.getElementById("preferences-submenu").focus()
         }
      }, 500)
   }
}
</script>
<style lang="scss" scoped>
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
   width: 60%;
   margin: 0 auto;
}
@media only screen and (min-width: 768px) {
   div.preferences-content  {
       width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.preferences-content  {
       width: 95%;
   }
}
.section {
   margin: 15px 0;
   border: 1px solid var(--uvalib-grey);
   padding:5px 15px 15px 15px;
   border-radius: 5px;
   box-shadow: $v4-box-shadow-light;
   text-align: left;
}
</style>
