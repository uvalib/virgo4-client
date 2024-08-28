<template>
   <section class="requests" aria-live="polite">
      <div class="panel">
         <div class="gutter"></div>
         <div class="buttons">
            <PlaceHoldDialog v-if="request.hasRequestOption('hold')" :settings="request.requestOption('hold')" :show="request.activePanel=='hold'"/>
            <VirgoButton v-if="request.hasRequestOption('scan')" label="Request a scan" size="small" />
            <VirgoButton v-if="request.hasRequestOption('aeon')" label="Request in Special Colections" size="small" />
         </div>
      </div>
   </section>
</template>

<script setup>
import PlaceHoldDialog from "@/components/requests/PlaceHoldDialog.vue"
import { useRequestStore } from "@/stores/request"

const request = useRequestStore()

</script>

<style lang="scss" scoped>
.requests {
   .panel {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: stretch;
      border: 1px solid var(--uvalib-grey-light);
      border-radius: 0 5px 5px 0;
      gap: 20px;
      margin-bottom:30px;
      .gutter {
         flex: 0 0 17px;
         background-color:#E6F2F7;
      }
      .buttons {
         flex: 1;
         display: flex;
         padding: 20px 20px 20px 0;
      }
   }
}
@media only screen and (min-width: 768px) {
   .buttons {
      flex-flow: row wrap;
      align-items: flex-start;
      gap: 10px;
   }
}
@media only screen and (max-width: 768px) {
   .buttons {
      flex-direction: column;
      align-items: stretch;
      gap: 5px;
   }
}
</style>
