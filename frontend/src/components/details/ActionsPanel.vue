<template>
   <section class="actions" aria-live="polite">
      <h2>Actions</h2>
      <div class="panel">
         <div class="gutter"></div>
         <div class="content">
            <BookmarkButton :pool="props.pool" :hit="props.hit" :origin="props.from" :labeled="true"/>
            <Citations :itemURL="props.hit.itemURL" :from="props.from" :ariaLabel="`citations for ${props.hit.identifier}`"/>
            <VirgoButton icon="fal fa-download" text rounded label="Download RIS"
               @click="downloadRISClicked" :aria-label="`download RIS citation for ${props.hit.header.title}`" />
            <span class="pdf-wrap" v-if="from=='COLLECTION'"  >
               <VirgoButton  v-if="!pdfDownloading" icon="fal fa-file-pdf"
                  label="Download PDF" text rounded @click="pdfClicked"/>
               <ve-progress v-else :progress="pdfProgress()" :size="32" thickness="10%" style="margin-top:5px; cursor: default;"/>
            </span>
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
import { useItemStore } from "@/stores/item"
import { copyText } from 'vue3-clipboard'
import { useToast } from "primevue/usetoast"
import { ref } from 'vue'
import { VeProgress } from "vue-ellipse-progress"


const toast = useToast()
const system = useSystemStore()
const item = useItemStore()

const pdfDownloading = ref(false)
const pdfTimerID = ref(-1)

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

const pdfProgress = (()  => {
   let progress = 0
   let pdfDC = item.digitalContent.find( dc => dc.pdf )
   if ( pdfDC ) {
      let status = pdfDC.pdf.status
      console.log(status)
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
      border-radius: 0.5rem;
      .gutter {
         flex: 0 0 17px;
         border-radius: 0.5rem  0 0 0.5rem;
         background-color:#BFE7F7;
      }
      .content {
         display: flex;
         flex-flow: row wrap;
         align-items: center;
         padding: 10px 30px 10px 20px;
         border: 1px solid var(--uvalib-grey-light);
         border-radius:  0 0.5rem  0.5rem 0;
         border-left: 0;
         gap: 40px;
         .pdf-wrap {
            position: relative;
         }
      }
   }
}
@media only screen and (min-width: 768px) {
   .buttons {
      justify-content: flex-start;
      gap: 5px 50px;
   }
}
@media only screen and (max-width: 768px) {
   .buttons {
      justify-content: space-between;
      gap: 5px 10px;
   }
}
</style>
