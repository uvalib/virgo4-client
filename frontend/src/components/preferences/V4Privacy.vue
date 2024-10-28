<template>
   <div class="privacy">
      <h3>Privacy</h3>
      <div class="content">
         <div class="line">
            <b>
               The Library
               <a href="https://www.library.virginia.edu/policies/privacy-policy/" target="_blank">values your privacy</a>.
            </b>
         </div>
         <div class="line">
            We collect analytics information that is not personally identifiable
            for the purpose of evaluating trends in usage or otherwise improving
            the product.
         </div>
         <div class="line">We retain this aggregate information for a limited time.
         </div>
         <div class="opt-out">
            <span v-if="preferencesStore.trackingOptOut">
               You have opted out. Uncheck the box below to opt in.
            </span>
            <span v-else>
               You have not opted out. Check the box below to opt out.
            </span>
            <div>
               <label>
                  <input @change="optOutClicked" class="opt-out" :checked="preferencesStore.trackingOptOut" type="checkbox"
                     aria-label="toggle opt out of analytics collection"/>Opt out
               </label>
            </div>
         </div>
      </div>
   </div>
</template>

<script setup>
import { usePreferencesStore } from "@/stores/preferences"
const preferencesStore = usePreferencesStore()

function optOutClicked() {
   preferencesStore.toggleOptOut()
}
</script>

<style lang="scss" scoped>
div.privacy {
   h3 {
      margin: 0;
      padding: 10px 15px;
      background: var(--uvalib-grey-lightest);
      border-bottom: 1px solid var(--uvalib-grey-light);
      font-size: 1.2em;
   }
   .content {
      padding: 20px;
   }
   div.line {
      margin-bottom: 10px;
   }
      div.privacy b {
         display: block;
         margin-bottom: 10px;
      }
      div.opt-out {
         margin-top: 20px;
      }
      input.opt-out {
         margin: 5px 10px;
         width: 15px;
         height: 15px;
      }

}
</style>