<template>
   <div class="icon-wrap">
      <template v-if="showCitations">
         <div class="citation-control">
            <Citations title="Citations" :id="`citation-${props.hit.identifier}`" style="margin-right: 10px"
               :itemURL="props.hit.itemURL" format="all" buttonLabel="Cite" :from="from" :toolbarButton="true"
               :ariaLabel="`citations for ${props.hit.identifier}`" >
            </Citations>
         </div>
      </template>
      <span class="pdf-wrap" v-if="from=='COLLECTION'"  >
         <V4Button mode="icon" :id="`pdf-${props.hit.identifier}`"
            @click="pdfClicked" :aria-label="`download pdf for ${props.hit.header.title}`" v-if="!generatePDFInProgress"
         >
            <i class="pdf fal fa-file-pdf"></i>
         </V4Button>
         <ve-progress v-if="generatePDFInProgress" :progress="pdfProgress()" :size="32" thickness="10%"
            style="position: absolute; background: white; top:-2px; left: -6px; cursor: default;"/>
      </span>
      <V4Button v-if="from=='DETAIL' || from=='COLLECTION'"  mode="icon" @click="shareClicked" :id="`share-${hit.identifier}`"
         :aria-label="`copy link to ${props.hit.header.title}`"
      >
         <i class="share fal fa-share-alt"></i>
      </V4Button>
      <div class="bm-control">
         <AddBookmark v-if="userStore.isSignedIn" :data="utils.toBookmarkData(props.pool, props.hit, props.from)" :id="`bm-modal-${props.hit.identifier}`"/>
         <SignInRequired v-else  :data="utils.toBookmarkData(props.pool, props.hit, props.from)" :id="`bm-modal-${props.hit.identifier}`" act="bookmark" />
      </div>
   </div>
</template>

<script setup>
import AddBookmark from "@/components/modals/AddBookmark.vue"
import SignInRequired from "@/components/modals/SignInRequired.vue"
import Citations from "@/components/modals/Citations.vue"
import analytics from '@/analytics'
import * as utils from '../utils'
import { ref, computed } from 'vue'
import { useUserStore } from "@/stores/user"
import { useItemStore } from "@/stores/item"
import { useSystemStore } from "@/stores/system"
import { copyText } from 'vue3-clipboard'
import { VeProgress } from "vue-ellipse-progress";

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

const system = useSystemStore()
const item = useItemStore()
const userStore = useUserStore()
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
      await this.$store.dispatch("item/generatePDF", itemDC)
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
         system.setError("Unable to copy Item URL to clipboard: "+error)
      } else {
         system.setMessage("Item URL copied to clipboard.")
      }
   })
}
</script>

<style lang="scss" scoped>
.v4-button {
   margin-right: 8px !important;
}
.icon-wrap {
   display: flex;
   flex-flow: row nowrap;
   margin-left: auto;
   align-content: center;
   i.share {
      color: #444;
      cursor: pointer;
      font-size: 1.4em;
      display: inline-block;
      box-sizing: border-box;
      margin: 0px;
      padding:0;
      &:hover {
         color:var(--uvalib-brand-blue-light);
      }
   }
   .pdf-wrap {
      position: relative;
      display: inline-block;
      width: 31px;
      height: 30px;
   }
}
i.pdf {
   color: #444;
   cursor: pointer;
   font-size: 1.6em;
   display: inline-block;
   box-sizing: border-box;
   margin: 0px;
   padding:0;
   &:hover {
      color:var(--uvalib-brand-blue-light);
   }
}
.citation-control {
   margin-right: 5px;
}
</style>
