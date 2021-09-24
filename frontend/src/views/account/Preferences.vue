<template>
   <div class="preferences">
      <SignInRequired v-if="isSignedIn == false" targetPage="preferences"/>
      <AccountActivities v-if="isSignedIn"/>
      <div class="working" v-if="(lookingUpPools || lookingUpAccount) && isSignedIn" >
         <V4Spinner message="Loading preferences..."/>
      </div>
      <div v-else>
         <template v-if="isSignedIn">
            <Search class="section"/>
            <PickupLibrary class="section"/>
            <BarcodeScan class="section"/>
            <V4Privacy class="section"/>
            <JWTAdmin class="section"/>
         </template>
      </div>
   </div>
</template>

<script>
import { mapState, mapGetters } from "vuex"
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
      }),
      ...mapGetters({
        isSignedIn: 'user/isSignedIn',
      }),
   },
   created() {
      if ( this.isSignedIn) {
         this.$analytics.trigger('Navigation', 'MY_ACCOUNT', "Preferences")
      }
   }
}
</script>
<style lang="scss" scoped>
.preferences {
   min-height: 400px;
   position: relative;
   color: var(--color-primary-text);
   width: 60%;
   margin: 2vw auto 0 auto;
}
.working {
   text-align: center;
   font-size: 1.25em;
}
.working img {
   margin: 30px 0;
}
@media only screen and (min-width: 768px) {
   div.preferences  {
      width: 60%;
   }
}
@media only screen and (max-width: 768px) {
   div.preferences  {
      width: 95%;
   }
}
.section {
   margin: 15px 0;
   border: 1px solid var(--uvalib-grey-light);
   padding: 0;
   box-shadow: $v4-box-shadow-light;
   text-align: left;
}
</style>
