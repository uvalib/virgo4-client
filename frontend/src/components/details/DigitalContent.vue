<template>
   <div class="digital-content">
      <div class="working" v-if="item.loadingDigitalContent">
         <V4Spinner message="Searching for digital content..." />
      </div>
      <div class="items" v-if="item.hasDigitalContent || item.googleBooksURL || hasExternalImages">
         <h2 class="buttons">
            <span>View Online</span>
            <VirgoButton v-if="!collection.isFullPageCollection && item.hasDigitalContent"
               class="small" label="View Full Screen" @click="toggleFullView" />
         </h2>
         <div class="viewer" v-if="item.hasDigitalContent">
            <div v-if="fsView" class="restore-view">
               <VirgoButton @click="toggleFullView" label="Restore View" />
            </div>
            <iframe :class="{full: fsView}" :src="curioURL" :width="curioWidth" :height="curioHeight"  allowfullscreen frameborder="0"/>
         </div>
         <div v-else-if="hasImage" class="img-view large" ref="viewer">
            <img :src="imageURL('med')" :data-src="imageURL('full')" class="thumb large">
            <div class="img-toolbar">
               <a target="_blank" :href="imageURL('max')">
                  View full size<i class="fal fa-external-link-alt"></i>
               </a>
            </div>
         </div>

         <template v-if="poolMode=='image'">
            <div v-if="details.related.length > 0" class="related">
               <label>Related Images</label>
               <router-link :to="relatedImageURL(r)"  @mousedown="relatedImageClicked(r)"
                  v-for="r in details.related" :key="`r${r.id}`"
               >
                  <div class="img-wrap">
                     <img :src="`${r.iiif_image_url}/square/200,200/0/default.jpg`" />
                     <ImageAdvisory v-if="r.content_advisory" />
                  </div>
               </router-link>
            </div>
         </template>

         <div v-else class="value">
            <template v-if="pdfContent.length > 0">
               <div class='do-header'>{{pdfContent.length}} Digital Object<span v-if="pdfContent.length>1">s</span></div>
               <ScrollPanel>
                  <div class="hcontent">
                     <div v-for="item in pdfContent" :key="item.pid"
                        class="download-card" role="button"
                        :class="{current: isCurrent(item)}"
                        @click.stop="viewerClicked(item)"
                     >
                        <V4ProgressBar v-if="generatePDFInProgress(item)" :id="item.name"
                           :style="{top: pdfTop(item)}"
                           :percent="item.pdf.status" label="Generating PDF"
                        />
                        <V4ProgressBar v-if="generateOCRInProgress(item)" :id="item.name"
                           :style="{top: ocrTop(item)}"
                           :percent="item.ocr.status" label="Extracting Text"
                        />
                        <img v-if="item.thumbnail" :src="item.thumbnail"/>
                        <span class="label">{{item.name}}</span>
                        <span v-if="generatePDFInProgress(item)" class="label">PDF generating...</span>
                        <VirgoButton text link label="Download PDF" @click="pdfClicked(item)"
                           :aria-label="`download pdf for ${item.name}`" />
                        <OCRRequest v-if="user.isSignedIn && item.ocr || item.ocr && item.ocr.status == 'READY'"
                           :dcIndex="digitalContentIndex(item)"
                           @ocr-started="ocrStarted(item)"
                        />
                        <span v-if="isCurrent(item)" class="opened">
                           <i v-if="isCurrent(item)" class="fas fa-check-circle"></i>
                           Opened in Viewer
                        </span>
                        <VirgoButton v-else text link label="Open in Viewer" @click="viewerClicked(item)"
                           :aria-label="`open ${item.name} in viewer`" />
                     </div>
                  </div>
               </ScrollPanel>
            </template>
         </div>

         <div class="google" v-if="item.googleBooksURL">
            <a :href="item.googleBooksURL" target="_blank" aria-label="google books preview">
               <img alt="Google Books Preview" class="google-btn" src="//books.google.com/intl/en/googlebooks/images/gbs_preview_button1.gif"/>
            </a>
         </div>
      </div>
   </div>
</template>

<script setup>
import ImageAdvisory from "@/components/ImageAdvisory.vue"
import V4ProgressBar from "@/components/V4ProgressBar.vue"
import OCRRequest from "@/components/modals/OCRRequest.vue"
import analytics from '@/analytics'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCollectionStore } from "@/stores/collection"
import { useItemStore } from "@/stores/item"
import { usePoolStore } from "@/stores/pool"
import { useResultStore } from "@/stores/result"
import { useSystemStore } from "@/stores/system"
import { useUserStore } from "@/stores/user"
import ScrollPanel from 'primevue/scrollpanel'

const collection = useCollectionStore()
const item = useItemStore()
const poolStore = usePoolStore()
const resultStore = useResultStore()
const system = useSystemStore()
const user = useUserStore()
const route = useRoute()

const selectedDigitalObjectIdx = ref(0)
const pdfTimerIDs = ref(new Map())
const ocrTimerIDs = ref(new Map())
const fsView = ref(false)
const curioHeight = ref("700px")
const defaultWidth = ()=>{
   let w = 800
   if ( system.displayWidth < 800) {
      w = system.displayWidth * 0.95
   }
   return w + "px"
}
const curioWidth = ref(defaultWidth())

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
      } else if (e.data.dimensions && e.data.dimensions.height != "0px"){
         curioHeight.value = e.data.dimensions.height
         // let Virgo determine the screen width
      }
   }
})

function toggleFullView() {
   fsView.value = !fsView.value
}
function imageURL(size) {
   let iiifField = details.value.fields.find( f => f.name=="iiif_image_url")
   if (!iiifField) return ""
   if ( size == 'full') {
      return [`${iiifField.value}/full/1200,/0/default.jpg`]
   } else if (size == 'max') {
      return [`${iiifField.value}/full/full/0/default.jpg`]
   }
   return [`${iiifField.value}/full/600,/0/default.jpg`]
}
function relatedImageURL( r ) {
   return `/sources/${details.value.source}/items/${r.id}`
}
function relatedImageClicked( hit ) {
   resultStore.hitSelected(hit.id)
}
function viewerClicked(tgtItem) {
   selectedDigitalObjectIdx.value = item.digitalContent.findIndex( i => i.pid == tgtItem.pid)
   history.replaceState(history.state, '', "?idx="+selectedDigitalObjectIdx.value)
}
function isCurrent(tgtItem) {
   let curr = item.digitalContent[selectedDigitalObjectIdx.value]
   return (curr.pid == tgtItem.pid)
}
function digitalContentIndex( tgtItem ) {
   return item.digitalContent.findIndex( i => i.pid == tgtItem.pid)
}
function ocrTop(tgtItem) {
   if ( generatePDFInProgress(tgtItem) ) {
      return "65%"
   }
   return "40%"
}
function pdfTop(tgtItem) {
   if ( generateOCRInProgress(tgtItem) ) {
      return "30%"
   }
   return "40%"
}
function generatePDFInProgress(tgtItem) {
   if ( !tgtItem.pdf) return false
   return !( tgtItem.pdf.status == "READY" || tgtItem.pdf.status == "ERROR" || tgtItem.pdf.status == "FAILED" ||
      tgtItem.pdf.status == "NOT_AVAIL" ||  tgtItem.pdf.status == "UNKNOWN")
}
function generateOCRInProgress(tgtItem) {
   if ( !tgtItem.ocr) return false
   return !( tgtItem.ocr.status == "READY" ||  tgtItem.ocr.status == "ERROR" || tgtItem.ocr.status == "FAILED" ||
      tgtItem.ocr.status == "NOT_AVAIL" ||  tgtItem.ocr.status == "UNKNOWN")
}
async function pdfClicked( tgtItem ) {
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
}
function ocrStarted(tgtItem) {
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
}

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
   width: 95%;
   margin: 0 auto;
   overflow: hidden;

   .working {
      text-align: center;
      margin: 20px 0 30px 0;
      font-size: 0.85em;
   }

   h2 {
      color: var(--color-primary-orange);
      text-align: center;
      margin: 30px 0 30px 0;
   }

   div.viewer {
      margin-bottom: 25px;
      iframe.full {
         position: fixed;
         width: 100%;
         top: 40px;
         height: 100%;
         left: 0;
         z-index: 10000;
      }
      .restore-view {
         position: fixed;
         z-index: 20000;
         right: 5px;
         top: 100px;
      }
   }

   .google {
      margin-top: 25px;
      img {
         display:block;
         margin: 0 auto;
      }
      .google-thumb {
         border: 1px solid var(--uvalib-grey-light);
         padding: 0;
         border-radius: 3px;
         margin-bottom: 15px;
         box-shadow: var(--uvalib-box-shadow);
      }
   }

   div.items {
      margin: 25px 0 0 0;
      h2.buttons {
         display: flex;
         flex-direction: column;
         align-items: center;
         justify-content: flex-start;
         gap: 10px;
      }

      .download-card.current {
         border: 3px solid var(--uvalib-brand-blue-light);
      }
      .download-card {
         position: relative;
         border: 1px solid var(--uvalib-grey-light);
         padding: 15px 10px 10px 10px;
         cursor: pointer;
         min-width: 175px;
         background: white;
         display: flex;
         flex-direction: column;
         align-items: stretch;
         justify-content: flex-start;
         gap: 10px;

         &:hover {
            top: -2px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0,1);
         }
         .opened {
            display: flex;
            flex-flow: row nowrap;
            align-items: center;
            justify-content: space-between;
            i {
               font-size: 1.25em;
               color: var(--uvalib-green);
            }
         }
      }
   }
   .img-view {
      display: inline-block;
      margin: 0 auto;
      .large {
         max-width: 100%;
         height: auto;
         display: block;
      }
      .img-toolbar {
         padding: 10px 0;
         text-align: right;
         a {
            font-weight: 100 !important;
            i {
               margin-left: 8px;
            }
         }
      }
   }

   div.related {
      width: 90%;
      margin: 15px auto 0 auto;
      text-align: left;
      label {
         padding:0 0 5px 0;
         border-bottom: 2px solid var(--color-brand-blue);
         margin-bottom: 10px;
         display: block;
         font-weight: 500;
      }
      a {
         display: inline-block;
         margin: 10px;
      }
      .img-wrap {
         position: relative;
      }
      img {
         background-image: url('@/assets/dots.gif');
         background-repeat:no-repeat;
         background-position: center center;
         min-width: 175px;
         min-height: 175px;
         background-color: rgb(252, 252, 252);
         &:hover {
            box-shadow: 0px 2px 8px 0 #444;
         }
      }
   }
}
.do-header {
   background: #efefef;
   border-top: 1px solid var(--uvalib-grey-light);
   border-bottom: 1px solid var(--uvalib-grey-light);
   padding: 10px 0;
   text-align: center;
}

.hcontent {
   display: flex;
   flex-flow: row nowrap;
   justify-content: flex-start;
   align-items: stretch;
   padding: 0;
   margin-top: 15px;
   gap: 10px;
}

:deep(.pdf) {
   padding-top: 0 !important;
}

</style>
