<template>
   <section class="actions" aria-live="polite">
      <h2>Actions</h2>
      <div class="panel">
         <div class="gutter"></div>
         <div class="buttons">
            <BookmarkButton :pool="props.pool" :hit="props.hit" origin="DETAILS" :labeled="true"/>
            <Citations :itemURL="props.hit.itemURL" from="DETAILS" :ariaLabel="`citations for ${props.hit.identifier}`"/>
            <VirgoButton icon="fal fa-download" text rounded label="Download RIS"
               @click="downloadRISClicked" :aria-label="`download RIS citation for ${props.hit.header.title}`" />
            <VirgoButton icon="fal fa-link" text rounded label="Permalink"
               @click="permalinkClicked" :aria-label="`copy permalink to ${props.hit.header.title}`" />
         </div>
      </div>
   </section>
</template>

<script setup>
import BookmarkButton from "@/components/BookmarkButton.vue"
import Citations from "@/components/modals/Citations.vue"
import analytics from '@/analytics'
import { useSystemStore } from "@/stores/system"
import { copyText } from 'vue3-clipboard'
import { useToast } from "primevue/usetoast"

const toast = useToast()
const system = useSystemStore()

const props = defineProps({
   hit: {
      type: Object,
      required: true
   },
   pool: {
      type: String,
      required: true
   },
})

const downloadRISClicked = (() => {
   analytics.trigger('Export', 'RIS_FROM_DETAIL', props.hit.identifier)
   window.location.href = `${system.citationsURL}/format/ris?item=${encodeURI(props.hit.itemURL)}`
})

const permalinkClicked = ( () => {
   analytics.trigger('Results', 'SHARE_ITEM_CLICKED', props.hit.identifier)
   let URL = window.location.href
   copyText(URL, undefined, (error, _event) => {
      if (error) {
         toast.add({severity:'success', summary:  "Copy Error", detail: "Unable to copy Item URL to clipboard: "+error, life: 5000})
      } else {
         toast.add({severity:'success', summary:  "Copied", detail:  "Item URL copied to clipboard.", life: 3000})
      }
   })
})

</script>

<style lang="scss" scoped>
.actions {
   width: 95%;
   margin: 0 auto;
   text-align: left;
   .panel {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: flex-start;
      border: 1px solid var(--uvalib-grey-light);
      border-radius: 0 5px 5px 0;
      .gutter {
         width: 17px;
         background-color:#E6F2F7;
         height: 70px;
         border-right: 1px solid var(--uvalib-grey-light);
      }
      .buttons {
         padding-left: 20px;
         display: flex;
         flex-flow: row wrap;
         justify-content: flex-start;
         align-items: center;
         gap: 50px;
         height: 70px;
      }
   }
}
</style>
