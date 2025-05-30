<template>
   <section class="actions" aria-live="polite">
      <h2>Actions</h2>
      <div class="panel">
         <div class="gutter"></div>
         <div class="content">
            <BookmarkButton :pool="item.details.source" :identifier="item.details.identifier" :labeled="true"/>
            <Citations :itemURL="item.details.itemURL" />
            <VirgoButton icon="fal fa-download fa-lg" text rounded label="Download RIS" @click="downloadRISClicked"/>
            <span class="pdf-wrap" v-if="showPDF"  >
               <VirgoButton  v-if="!pdfDownloading" icon="fal fa-file-pdf fa-lg"
                  label="Download PDF" text rounded @click="pdfClicked"/>
               <div v-else class="progress">
                  <div>Generating PDF...</div>
                  <ProgressBar :value="pdfProgress()" :showValue="false" style="width:175px;height:8px"/>
               </div>
            </span>
            <VirgoButton icon="fal fa-link fa-lg" text rounded label="Permalink" @click="permalinkClicked" />
         </div>
      </div>
   </section>
</template>

<script setup>
import BookmarkButton from "@/components/BookmarkButton.vue"
import Citations from "@/components/modals/Citations.vue"
import analytics from '@/analytics'
import { useSystemStore } from "@/stores/system"
import { useItemStore } from "@/stores/item"
import { useCollectionStore } from "@/stores/collection"
import { useClipboard } from '@vueuse/core'
import { useToast } from "primevue/usetoast"
import { ref, computed } from 'vue'
import ProgressBar from 'primevue/progressbar'

const { copy } = useClipboard()
const toast = useToast()
const system = useSystemStore()
const item = useItemStore()
const collection = useCollectionStore()

const pdfDownloading = ref(false)
const pdfTimerID = ref(-1)

const showPDF = computed(() => {
   return ( collection.isFullPage && item.hasDigitalContent )
})

const downloadRISClicked = (() => {
   analytics.trigger('Export', 'RIS_FROM_DETAIL', item.details.identifier)
   window.location.href = `${system.citationsURL}/format/ris?item=${encodeURI(item.details.itemURL)}`
})

const permalinkClicked = ( () => {
   analytics.trigger('Results', 'SHARE_ITEM_CLICKED', item.details.identifier)
   copy( window.location.href )
   toast.add({severity:'success', summary:  "Copied", detail:  "Item URL copied to clipboard.", life: 5000})
})

const pdfProgress = (()  => {
   let progress = 0
   let pdfDC = item.digitalContent.find( dc => dc.pdf )
   if ( pdfDC ) {
      let status = pdfDC.pdf.status
      if (status == "READY" || status == "100%") {
         pdfDownloading.value = false
         return 100
      }
      if ( status.includes("%")) {
         progress = parseInt(status.replace("%", ""),10)
      }
   }
   return progress
})

const pdfClicked= ( async() => {
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
})
</script>

<style lang="scss" scoped>
.actions {
   .panel {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: stretch;
      border-radius: 0.3rem;
      .gutter {
         flex: 0 0 17px;
         border-radius: 0.3rem  0 0 0.3rem;
         background-color:#BFE7F7;
      }
      .content {
         display: flex;
         flex-flow: row wrap;
         align-items: center;
         padding: 1rem;
         border: 1px solid $uva-grey-100;
         border-radius:  0 0.3rem  0.3rem 0;
         border-left: 0;
         gap: 2rem;
         .pdf-wrap {
            position: relative;
         }
         .progress {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            font-size: 0.85em;
         }
      }
   }
}
</style>
