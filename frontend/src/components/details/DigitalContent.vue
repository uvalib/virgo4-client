<template>
   <div class="digital-content">
      <div class="working" v-if="item.loadingDigitalContent">
         <V4Spinner message="Searching for digital content..." />
      </div>
      <div class="items" v-else-if="item.hasDigitalContent || hasExternalImages">
         <h2>View online</h2>
         <div class="buttons" v-if="!collection.isFullPageCollection && item.hasDigitalContent">
            <VirgoButton size="small" severity="info" label="View full screen" @click="toggleFullView" />
         </div>
         <div class="viewer" v-if="item.hasDigitalContent">
            <div v-if="fsView" class="restore-view">
               <VirgoButton severity="info"  @click="toggleFullView" label="Exit full screen" />
            </div>
            <iframe tabindex="0" class="curio" :class="{full: fsView}" :src="curioURL" :width="curioWidth" :height="curioHeight"
               allowfullscreen frameborder="0" :title="`viewer for ${item.details.header.title}`" />
         </div>
         <div v-else-if="hasImage" class="img-view large" ref="viewer">
            <div class="img-toolbar">
               <VirgoButton as="a" label="View full size" severity="info" size="small"
                  aria-describedby="new-window" :href="imageURL('max')" target="_blank" rel="noopener"
               />
            </div>
            <img :src="imageURL('med')" :data-src="imageURL('full')" class="thumb large" :alt="item.details.header.title">
         </div>

         <template v-if="poolMode=='image' && details.related.length > 0">
            <h3>Related images</h3>
            <div class="related">
               <div class="related-image" v-for="r in details.related" :key="`r${r.id}`" >
                  <router-link class="img-wrap" :to="`/sources/${item.details.source}/items/${r.id}`">
                     <img :src="`${r.iiif_image_url}/square/200,200/0/default.jpg`" :alt="r.title" />
                     <ImageAdvisory v-if="r.content_advisory" />
                  </router-link>
                  <router-link :to="`/sources/${item.details.source}/items/${r.id}`">{{ r.title }}</router-link>
               </div>
            </div>
         </template>

         <div v-else class="value">
            <template v-if="pdfContent.length > 0">
               <h3 class='do-header'>{{pdfContent.length}} Digital object<span v-if="pdfContent.length>1">s</span></h3>
               <Carousel :value="pdfContent" :numVisible="7" :numScroll="7" :responsiveOptions="responsiveOptions" @update:page="carouselPaged" :showIndicators="showCarouselIndicators">
                  <template #item="slotProps">
                     <div class="download-card" :class="{current: isCurrent(slotProps.data)}" @click.stop="viewerClicked(slotProps.data)">
                        <div class="progress" v-if="generatePDFInProgress(slotProps.data)">
                           <div>Generating PDF...</div>
                           <ProgressBar :value="slotProps.data.pdf.status.replace('%','')" :showValue="false" style="height:10px"/>
                        </div>
                        <div class="progress" v-if="generateOCRInProgress(slotProps.data)">
                           <div>Extracting text...</div>
                           <ProgressBar :value="slotProps.data.ocr.status.replace('%','')" :showValue="false" style="height:10px"/>
                        </div>
                        <img v-if="slotProps.data.thumbnail" :src="slotProps.data.thumbnail" role="presentation"/>
                        <div class="details">
                           <span class="label">{{slotProps.data.name}}</span>
                              <span v-if="generatePDFInProgress(slotProps.data)" class="label">PDF generating...</span>
                              <VirgoButton text link label="Download PDF" @click="pdfClicked(slotProps.data)" :tabindex="carouselTabIndex[slotProps.index]"
                                 :aria-label="`download pdf for ${slotProps.data.name}`" size="small"/>
                              <OCRRequest v-if="user.isSignedIn && slotProps.data.ocr || slotProps.data.ocr && slotProps.data.ocr.status == 'READY'"
                                 :dcIndex="digitalContentIndex(slotProps.data)"
                                 :tabindex="carouselTabIndex[slotProps.index]"
                                 @ocr-started="ocrStarted(slotProps.data)"
                              />
                              <span v-if="isCurrent(slotProps.data)" class="opened">
                                 <i v-if="isCurrent(slotProps.data)" class="fas fa-check-circle"></i>
                                 Opened in Viewer
                              </span>
                              <VirgoButton v-else text link label="Open in Viewer" @click="viewerClicked(slotProps.data)"
                                 :aria-label="`open ${slotProps.data.name} in viewer`" size="small" :tabindex="carouselTabIndex[slotProps.index]"/>
                        </div>
                     </div>
                  </template>
               </Carousel>
            </template>
         </div>
      </div>
   </div>
</template>

<script setup>
import ImageAdvisory from "@/components/ImageAdvisory.vue"
import OCRRequest from "@/components/modals/OCRRequest.vue"
import Carousel from 'primevue/carousel'
import analytics from '@/analytics'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCollectionStore } from "@/stores/collection"
import { useItemStore } from "@/stores/item"
import { usePoolStore } from "@/stores/pool"
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import { useWindowSize } from '@vueuse/core'
import ProgressBar from 'primevue/progressbar'
import { storeToRefs } from "pinia"

const { width } = useWindowSize()
const collection = useCollectionStore()
const item = useItemStore()
const poolStore = usePoolStore()
const system = useSystemStore()
const user = useUserStore()
const route = useRoute()

const responsiveOptions = ref([
   {
        breakpoint: '1400px',
        numVisible: 6,
        numScroll: 6
    },
    {
      breakpoint: '1200px',
      numVisible: 5,
      numScroll: 5
   },
   {
      breakpoint: '1000px',
      numVisible: 4,
      numScroll: 4
   },
   {
      breakpoint: '767px',
      numVisible: 3,
      numScroll: 3
   },
   {
      breakpoint: '500px',
      numVisible: 2,
      numScroll: 2
   }
]);

const selectedDigitalObjectIdx = ref(0)
const pdfTimerIDs = ref(new Map())
const ocrTimerIDs = ref(new Map())
const fsView = ref(false)
const curioHeight = ref()
const curioWidth = ref()
const carouselTabIndex = ref([])

const { loadingDigitalContent } = storeToRefs(item)
watch( loadingDigitalContent, (newValue) => {
   if ( newValue == false) {
      // carousel initially starts on image 0 and shows 7.. all the rest are hidden
      carouselTabIndex.value = Array(item.digitalContent.length).fill(0)
      carouselTabIndex.value.fill(-1,7)
   }
})

watch( width, () => {
   setCurioDimensions()
})

const setCurioDimensions = (() => {
   let mainPanelW = document.getElementById("v4main").offsetWidth
   let w = mainPanelW * 0.95
   if (w > 1000) {
      w = 1000
   }
   curioWidth.value = `${w}px`
   curioHeight.value = `${w*0.75}px`
})

const carouselPaged = ( (pg) => {
   const startIdx = pg*7
   for ( var i=0; i<item.digitalContent.length; i++) {
      if ( i < startIdx || i > startIdx+7 ) {
         carouselTabIndex.value[i] = -1
      } else {
         carouselTabIndex.value[i] = 0
      }
   }
})

const showCarouselIndicators = computed(() => {
   return width.value >= 992
})

const details = computed(()=>{
   return item.details
})
const hasExternalImages = computed(()=>{
   let iiifField = details.value.fields.find( f => f.name=="iiif_image_url")
   if (iiifField) return true
   return false
})
const pdfContent = computed(()=>{
   return item.digitalContent.filter( dc => dc.pdf)
})
const poolMode = computed(()=>{
   let poolDetail = poolStore.poolDetails(details.value.source)
   return poolDetail.mode
})
const curioURL = computed(()=>{
   // change the oembed url to view
   let selDO = item.digitalContent[selectedDigitalObjectIdx.value]
   let idx = selDO.oEmbedURL.indexOf("/oembed")
   let url = selDO.oEmbedURL.substring(0, idx)
   url += "/view/" + selDO.pid

   // grab the current URL and split of the details page fragment to be left with the transport and host.
   // this is needed for curio to trigger events back to V4
   let currURL = window.location.href
   let domain = currURL.split("/sources")[0]

   if ( system.isDevServer) {
      url = url.replace("curio", "curio-dev.internal")
   }

   url += "?domain="+domain

   let x = route.query.x
   if (x) {
      url += `&x=${x}`
   }
   let y = route.query.y
   if (y) {
      url += `&y=${y}`
   }
   let zoom = route.query.zoom
   if (zoom) {
      url += `&zoom=${zoom}`
   }
   let rotation = route.query.rotation
   if (rotation) {
      url += `&rotation=${rotation}`
   }
   let page = route.query.page
   if (page) {
      url += `&page=${page}`
   }
   // console.log("URL: "+url)

   return url
})
const hasImage = computed(()=>{
   let iiifField = details.value.fields.find( f => f.name=="iiif_image_url")
   if (iiifField) {
      return true
   }
   return false
})

onMounted(()=>{
   setCurioDimensions()

   // if the selected digital object index is present in the URL, apply it
   let tgtIdx = route.query.idx
   if (tgtIdx) {
      selectedDigitalObjectIdx.value = parseInt(tgtIdx, 10)
      // console.log("set idx to "+selectedDigitalObjectIdx.value)
   }

    // listen for events posted from the embedded instance of curio
   window.onmessage = (e) => {
      if ( e.data.name == "curio") {
         // convert the curio params object into a query string and use replaceState to update the URL in place
         // do not use the router as this forces page reloads
         let curio = e.data
         let qp = [`idx=${selectedDigitalObjectIdx.value}`]
         if ( curio.x) {
            qp.push(`x=${curio.x}`)
         }
         if ( curio.y) {
            qp.push(`y=${curio.y}`)
         }
         if ( curio.zoom) {
            qp.push(`zoom=${curio.zoom}`)
         }
         if ( curio.rotation) {
            qp.push(`rotation=${curio.rotation}`)
         }
         if ( curio.page) {
            qp.push(`page=${curio.page}`)
         }
         history.replaceState(history.state, '', "?"+qp.join("&"))
      }
   }
})

const toggleFullView = (() => {
   fsView.value = !fsView.value
})

const imageURL = ((size) => {
   let iiifField = details.value.fields.find( f => f.name=="iiif_image_url")
   if (!iiifField) return ""
   if ( size == 'full') {
      return [`${iiifField.value}/full/1200,/0/default.jpg`]
   } else if (size == 'max') {
      return [`${iiifField.value}/full/full/0/default.jpg`]
   }
   return [`${iiifField.value}/full/600,/0/default.jpg`]
})

const viewerClicked = ((tgtItem) => {
   selectedDigitalObjectIdx.value = item.digitalContent.findIndex( i => i.pid == tgtItem.pid)
   history.replaceState(history.state, '', "?idx="+selectedDigitalObjectIdx.value)
})

const isCurrent = ((tgtItem) => {
   let curr = item.digitalContent[selectedDigitalObjectIdx.value]
   return (curr.pid == tgtItem.pid)
})

const digitalContentIndex = (( tgtItem ) => {
   return item.digitalContent.findIndex( i => i.pid == tgtItem.pid)
})

const generatePDFInProgress = ((tgtItem) => {
   if ( !tgtItem.pdf) return false
   return !( tgtItem.pdf.status == "READY" || tgtItem.pdf.status == "ERROR" || tgtItem.pdf.status == "FAILED" ||
      tgtItem.pdf.status == "NOT_AVAIL" ||  tgtItem.pdf.status == "UNKNOWN")
})

const generateOCRInProgress =((tgtItem) => {
   if ( !tgtItem.ocr) return false
   return !( tgtItem.ocr.status == "READY" ||  tgtItem.ocr.status == "ERROR" || tgtItem.ocr.status == "FAILED" ||
      tgtItem.ocr.status == "NOT_AVAIL" ||  tgtItem.ocr.status == "UNKNOWN")
})

const pdfClicked = ( async ( tgtItem ) => {
   await item.getPDFStatus(tgtItem )
   if (tgtItem.pdf.status == "READY" || tgtItem.pdf.status == "100%") {
      analytics.trigger('PDF', 'PDF_DOWNLOAD_CLICKED', tgtItem.pid)
      window.location.href=tgtItem.pdf.url
      return
   } else if (tgtItem.pdf.status == "ERROR" ) {
      system.setError("Sorry, the PDF for "+tgtItem.name+" is currently unavailable. Please try again later.")
      return
   }

   if ( tgtItem.pdf.status == "NOT_AVAIL" || tgtItem.pdf.status == "FAILED" ) {
      analytics.trigger('PDF', 'PDF_GENERATE_CLICKED', tgtItem.pid)
      await item.generatePDF(tgtItem)
   }

   if (pdfTimerIDs.value.has(tgtItem.pid) == false) {
      let pdfTimerID = setInterval( async () => {
         await item.getPDFStatus(tgtItem )
         let tgtTimer = pdfTimerIDs.value.get(tgtItem.pid)
         if (tgtItem.pdf.status == "READY" || tgtItem.pdf.status == "100%") {
            clearInterval(tgtTimer)
            pdfTimerIDs.value.delete(tgtItem.pid)
            window.location.href=tgtItem.pdf.url
         } else if (tgtItem.pdf.status == "ERROR" || tgtItem.pdf.status == "FAILED") {
            clearInterval(tgtTimer)
            pdfTimerIDs.value.delete(tgtItem.pid)
            system.setError("Sorry, the PDF for "+tgtItem.name+" is currently unavailable. Please try again later.")
         }
      }, 1000)
      pdfTimerIDs.value.set(tgtItem.pid, pdfTimerID)
   }
})

const ocrStarted = ((tgtItem) => {
   if (ocrTimerIDs.value.has(tgtItem.pid) == false) {
      let ocrTimerID = setInterval( async () => {
         await item.getOCRStatus( tgtItem )
         let tgtTimer = ocrTimerIDs.value.get(tgtItem.pid)
         if (tgtItem.ocr.status == "READY" || tgtItem.ocr.status == "100%") {
            clearInterval(tgtTimer)
            ocrTimerIDs.value.delete(tgtItem.pid)
            await item.downloadOCRText(tgtItem)
         } else if (tgtItem.ocr.status == "ERROR" || tgtItem.ocr.status == "FAILED") {
            clearInterval(tgtTimer)
            ocrTimerIDs.value.delete(tgtItem.pid)
            system.setError("Sorry, unable to extract text for "+tgtItem.name+". Please try again later.")
         }
      }, 5000)
      ocrTimerIDs.value.set(item.pid, ocrTimerID)
   }
})

onUnmounted(()=>{
   ocrTimerIDs.value.forEach( (timerID, _pid) => {
      clearInterval(timerID)
   })
   ocrTimerIDs.value.clear()

   pdfTimerIDs.value.forEach( (timerID, _pid) => {
      clearInterval(timerID)
   })
   pdfTimerIDs.value.clear()
})
</script>
<style lang="scss" scoped>
.digital-content {
   .progress {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 0.85em;
      background-color: #f5f5f5;
      border-radius: 0.3rem;
      border: 1px solid $uva-grey-100;
      padding: 0.5rem;
      margin-bottom: 10px;
   }
   div.items {
      margin: 25px 0 0 0;

      .download-card.current {
         border: 2px solid $uva-brand-blue-100;
      }
      .download-card {
         position: relative;
         border: 1px solid $uva-grey-100;
         padding: 10px;
         margin: 5px;
         cursor: pointer;
         width: 100%;
         background: white;
         border-radius: 0.3rem;

         img {
            display: block;
            margin: 0 auto;
         }
         .label {
            text-align: center;
         }

         .details {
            margin-top: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            gap: 10px;
         }

         &:hover {
            transition: 0.25s ease-in-out;
            box-shadow: 0 0 10px 0 $uva-grey-100;
            z-index: 2;
            text-decoration: none;
         }
         .opened {
            display: flex;
            flex-flow: row nowrap;
            align-items: center;
            justify-content: flex-start;
            gap: 5px;
            font-size: 0.875rem;
            i {
               font-size: 1.25em;
               color: $uva-green;
            }
         }
      }
   }

   .working {
      text-align: center;
      margin: 20px 0 30px 0;
   }

   div.buttons {
      padding-bottom: 10px;
   }

   div.viewer {
      margin-bottom: 25px;
      iframe.curio {
         border: 1px solid $uva-grey-100;
         border-radius: 0.3rem;
         background-image: url('@/assets/spinner2.gif');
         background-repeat:no-repeat;
         background-position: center center;
      }
      iframe.curio.full {
         position: fixed;
         width: 100%;
         top: 60px;
         height: 100%;
         left: 0;
         z-index: 10000;
         border: none;
         border-radius: 0;
      }
      .restore-view {
         position: fixed;
         z-index: 20000;
         right: 5px;
         top: 120px;
      }
   }

   .img-view {
      display: inline-block;
      .img-toolbar {
         padding: 0 0 10px 0;
      }
   }

   h3 {
      font-size: 1em;
   }

   div.related {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: flex-start;
      gap: 1rem;
      .related-image {
         display: flex;
         flex-direction: column;
         gap: 5px;
         a {
            max-width: 200px;
         }
      }

      a {
         display: inline-block;
      }
      .img-wrap {
         position: relative;
      }
      img {
         background-color: $uva-grey-200;
         background-image: url('@/assets/dots.gif');
         background-repeat:no-repeat;
         background-position: center center;
         min-width: 175px;
         min-height: 175px;
         border-radius: 0.3rem;
         border: 1px solid $uva-grey-100;
         &:hover {
            transition: 0.25s ease-in-out;
            box-shadow: 2px 2px 12px 0px $uva-grey-50;
            z-index: 2;
            text-decoration: none;
         }
      }
   }
}
h3.do-header {
   margin: 35px 0 15px 0;
}

</style>
