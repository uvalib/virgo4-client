<template>
   <div class="privacy">
      <div><b>The library values your privacy.</b></div>
      <div>
         We collect analytics information that is not personally identifiable 
         for the purpose of evaluating trends in usage or otherwise improving 
         the product.  We retain this aggregate information for a limited time.
      </div>
      <div class="opt-out">
         You are not opted out. Check the box below to opt out.
         <div>
            <label>
               <input @change="optOutClicked" class="opt-out" :checked="trackingOptOut" type="checkbox"/>Opt out
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

<style scoped>
div.privacy {
   background: var(--uvalib-grey-lightest);
   border: 1px solid var(--uvalib-grey);
   padding: 15px;
   border-radius: 5px;
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
</style>