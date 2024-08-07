<template>
   <div class="icon-wrap">
      <Citations v-if="showCitations" :itemURL="props.hit.itemURL" :from="from"
         :ariaLabel="`citations for ${props.hit.identifier}`">
      </Citations>
      <span class="pdf-wrap" v-if="from=='COLLECTION'"  >
         <VirgoButton  v-if="!generatePDFInProgress" icon="fal fa-file-pdf"
            text rounded size="large"
            @click="pdfClicked" :aria-label="`download pdf for ${props.hit.header.title}`"/>
         <ve-progress v-if="generatePDFInProgress" :progress="pdfProgress()" :size="32" thickness="10%"
            style="position: absolute; background: white; top:-2px; left: -6px; cursor: default;"/>
      </span>
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
import { ref, computed } from 'vue'
import { useItemStore } from "@/stores/item"
import { useSystemStore } from "@/stores/system"
import { copyText } from 'vue3-clipboard'
import { VeProgress } from "vue-ellipse-progress"
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
const system = useSystemStore()
const item = useItemStore()
const pdfDownloading = ref(false)
const pdfTimerID = ref(-1)

const showCitations = computed(()=>{
   if (props.from.toUpperCase() == 'SEARCH' || props.from.toUpperCase() == 'COLLECTION') {
      return true
   }
   return false
})
const generatePDFInProgress = computed(()=>{
   if ( item.loadingDigitalContent ) return false
   if ( props.from !='COLLECTION' ) return false
   if ( !item.digitalContent ) return false
   return pdfDownloading.value
})

function pdfProgress() {
   if ( item.loadingDigitalContent == true ) return 0
   if ( !item.digitalContent ) return 0
   let itemDC = this.digitalContent[0]
   let status = itemDC.pdf.status
   if (status == "READY" || status == "100%") {
      pdfDownloading.value = false
      return 100
   }
   if ( status.includes("%")) {
      return parseInt(status.replace("%", ""),10)
   }
   return 0
}
async function pdfClicked( ) {
   let itemDC = item.digitalContent[0]
   await item.getPDFStatus( itemDC )
   if (itemDC.pdf.status == "READY" || itemDC.pdf.status == "100%") {
      analytics.trigger('PDF', 'PDF_DOWNLOAD_CLICKED', itemDC.pid)
      window.location.href=itemDC.pdf.url
      return
   } else if (itemDC.pdf.status == "ERROR") {
      system.setError("Sorry, the PDF for "+itemDC.name+" is currently unavailable. Please try again later.")
      return
   }

   if ( itemDC.pdf.status == "NOT_AVAIL" || itemDC.pdf.status == "FAILED") {
      analytics.trigger('PDF', 'PDF_GENERATE_CLICKED', itemDC.pid)
      pdfDownloading.value = true
      await item.generatePDF(itemDC)
   }

   pdfTimerID.value = setInterval( async () => {
         await item.getPDFStatus( itemDC )
         if (itemDC.pdf.status == "READY" || itemDC.pdf.status == "100%") {
         clearInterval(pdfTimerID.value)
         window.location.href=itemDC.pdf.url
      } else if (itemDC.pdf.status == "ERROR" || itemDC.pdf.status == "FAILED") {
         clearInterval(pdfTimerID.value)
         system.setError("Sorry, the PDF for "+itemDC.name+" is currently unavailable. Please try again later.")
      }
   }, 1000)
}
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
