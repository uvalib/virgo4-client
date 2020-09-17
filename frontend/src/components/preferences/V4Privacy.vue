<template>
   <div class="privacy">
      <h2>Privacy</h2>
      <div><b>The Library values your privacy.</b></div>
      <div>
         We collect analytics information that is not personally identifiable
         for the purpose of evaluating trends in usage or otherwise improving
         the product.<br/>We retain this aggregate information for a limited time.
      </div>
      <div class="opt-out">
         <span v-if="trackingOptOut">
            You have opted out. Uncheck the box below to opt in.
         </span>
         <span v-else>
            You have not opted out. Check the box below to opt out.
         </span>
         <div>
            <label>
               <input @change="optOutClicked" class="opt-out" :checked="trackingOptOut" type="checkbox"
                  aria-label="toggle opt out of analytics collection"/>Opt out
            </label>
         </div>
      </div>
   </div>
</template>

<script>
import { mapState } from "vuex"
export default {
   computed: {
      ...mapState({
         trackingOptOut: state => state.preferences.trackingOptOut,
      })
   },
   methods: {
      optOutClicked() {
         this.$store.dispatch("preferences/toggleOptOut")
      }
   }
}
</script>

<style lang="scss" scoped>
div.privacy {
   h2 {
     margin:5px 0 10px 0;
   }
   div.privacy b {
      display: block;
      margin-bottom: 10px;
   }
   div.opt-out {
      margin-top: 10px;
   }
   input.opt-out {
      margin: 5px 10px;
      width: 15px;
      height: 15px;
   }
}
</style>