<template>
   <div class="icon-wrap">
      <Citations v-if="showCitations" :itemURL="props.hit.itemURL" :from="from"
         :ariaLabel="`citations for ${props.hit.identifier}`">
      </Citations>
      <VirgoButton v-if="from=='DETAIL' || from=='COLLECTION'" icon="fal fa-share-alt"
         text rounded size="large"
         @click="shareClicked" :aria-label="`copy link to ${props.hit.header.title}`" />
      <BookmarkButton :pool="props.pool" :hit="props.hit" :origin="props.from"/>
   </div>
</template>

<script setup>
import BookmarkButton from "@/components/BookmarkButton.vue"
import Citations from "@/components/modals/Citations.vue"
import analytics from '@/analytics'
import { computed } from 'vue'
import { copyText } from 'vue3-clipboard'
import { useToast } from "primevue/usetoast"

const props = defineProps({
   hit: {
      type: Object,
      required: true
   },
   pool: {
      type: String,
      required: true
   },
   from: {
      type: String,
      default: ""
   },
})

const toast = useToast()

const showCitations = computed(()=>{
   if (props.from.toUpperCase() == 'SEARCH' || props.from.toUpperCase() == 'COLLECTION') {
      return true
   }
   return false
})

function shareClicked() {
   analytics.trigger('Results', 'SHARE_ITEM_CLICKED', props.hit.identifier)
   let URL = window.location.href
   copyText(URL, undefined, (error, _event) => {
      if (error) {
         toast.add({severity:'success', summary:  "Copy Error", detail: "Unable to copy Item URL to clipboard: "+error, life: 5000})
      } else {
         toast.add({severity:'success', summary:  "Copied", detail:  "Item URL copied to clipboard.", life: 3000})
      }
   })
}
</script>

<style lang="scss" scoped>
.icon-wrap {
   display: flex;
   flex-flow: row nowrap;
   margin-left: auto;
   justify-content: flex-end;
   align-items: center;
}
</style>
