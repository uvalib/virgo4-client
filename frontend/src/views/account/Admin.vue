<template>
   <div class="admin" v-if="isAdmin">
      <AccountActivities v-if="isSignedIn"/>
      <div class="working" v-if="(lookingUpPools || lookingUpAccount) && isSignedIn" >
         <V4Spinner message="Loading admin settings..."/>
      </div>
      <div v-else>
         <template v-if="isSignedIn">
            <PickupLibraries class="section"/>
            <JWTAdmin class="section"/>
         </template>
      </div>
   </div>
</template>

<script>
import { mapState, mapGetters } from "vuex"
import JWTAdmin from "@/components/admin/JWTAdmin"
import PickupLibraries from "@/components/admin/PickupLibraries"
import AccountActivities from "@/components/AccountActivities"
export default {
   name: "admin",
   components: {
      JWTAdmin, AccountActivities, PickupLibraries
   },
   computed: {
      ...mapState({
         lookingUpPools : state => state.pools.lookingUp,
         lookingUpAccount : state => state.user.lookingUp,
      }),
      ...mapGetters({
        isSignedIn: 'user/isSignedIn',
        isAdmin: 'user/isAdmin',
      }),
   },
   created() {
      if ( this.isAdmin == false) {
         this.$router.replace("/forbidden")
      } else {
         if ( this.isSignedIn) {
            this.$analytics.trigger('Navigation', 'MY_ACCOUNT', "Admin")
         }
      }
   }
}
</script>
<style lang="scss" scoped>
.admin {
   min-height: 400px;
   position: relative;
   color: var(--color-primary-text);
   width: 60%;
   margin: 2vw auto 0 auto;
   .section {
      margin: 15px 0 40px 0;
      border: 1px solid var(--uvalib-grey-light);
      padding: 0;
      box-shadow: $v4-box-shadow-light;
      text-align: left;
   }
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
</style>
